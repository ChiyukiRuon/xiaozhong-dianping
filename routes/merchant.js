const express = require('express')
const router = express.Router()
const authInterceptor = require('../Interceptors/authInterceptor')
const {renameFile} = require("../utils/formatter");
const {uploadFile} = require("../utils/qiniu");
const {isImageValid, isUsernameValid, isPasswordValid, isPhoneNumberValid, isEmailValid} = require("../utils/valid");
const {decryptData} = require("../utils/rsa");
const {userService, merchantService} = require("../services");
const {hashPassword} = require("../utils/bcrypt");
const jwt = require("../utils/jwt");
const logger = require("../utils/logger");
const {sendMail} = require("../utils/mail");
const xss = require("xss");

// 商家注册
router.post('/register', async (req, res) => {
    const params = req.getParams()

    const plainPassword = decryptData(params.password)

    try {
        const userList = await userService.getUserByUsername(params.username)

        if (!params.username || !isUsernameValid(params.username) || userList.length > 0) {
            return res.error('非法的用户名', 400)
        } else if (!params.password || !isPasswordValid(plainPassword)) {
            return res.error('非法的密码', 400)
        } else {
            const hashedPassword = await hashPassword(plainPassword)
            await merchantService.registerMerchant(params.username, hashedPassword)
        }

        const user = await userService.getUserByUsername(params.username)

        const { password, ...userInfo } = user[0]
        const payload = (({ uid, username, role, permission, status }) => ({ uid, username, role, permission, status }))(user[0])
        const token = jwt.signToken(payload)

        return res.ok({ token: token, user: userInfo}, '注册成功', 201)
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 提交商家申请
router.post('/apply', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo || userInfo.status !== 1) {
        return res.error('无访问权限', 403)
    }
    if (!params.phone || !isPhoneNumberValid(params.phone)) {
        return res.error('非法的手机号', 400)
    }
    if (!params.email || !isEmailValid(params.email)) {
        return res.error('非法的邮箱', 400)
    }
    if (!params.address || params.address.length < 6) {
        return res.error('非法的地址', 400)
    }
    if (!params.annex || !params.annex.startsWith(process.env.CDN_PERFIX, params.annex)) {
        return res.error('非法的附件', 400)
    }
    if (!params.avatar || !params.avatar.startsWith(process.env.CDN_PERFIX, params.annex)) {
        return res.error('非法的头像', 400)
    }

    try {
        const result =  await merchantService.applyMerchant({uid: userInfo.uid, ...params})

        if (result) {
            sendMail(params.email, '', '', 'apply', {username: params.username}).then(r => {
                if (!r.success) logger.error(r)
            })
            return res.ok({}, '商家注册申请提交成功')
        } else {
            return res.error('商家注册申请提交失败', 500)
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 编辑商家信息
router.post('/info', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    try {
        let user = await userService.getUserById(params.uid)

        if (!user || user[0].role !== 'merchant') {
            return res.error('用户不存在', 404)
        }
        if (userInfo.status !== 0) {
            return res.error('当前用户暂无法编辑', 403)
        }
        if (params.username && params.username !== user[0].username) {
            const userList = await userService.getUserByUsername(params.username)

            if (!isUsernameValid(params.username) || userList.length > 0) {
                return res.error('非法的用户名', 400)
            }
        }
        if (params.password) {
            const plainPassword = decryptData(params.password)

            if (!params.password || !isPasswordValid(plainPassword)) {
                return res.error('非法的密码', 400)
            }

            params.password = await hashPassword(plainPassword)
        }
        if (params.phone && !isPhoneNumberValid(params.phone)) {
            return res.error('非法的手机号', 400)
        }
        if (params.email && !isEmailValid(params.email)) {
            return res.error('非法的邮箱', 400)
        }
        if (params.nickname && !isUsernameValid(params.nickname)) {
            return res.error('非法的昵称', 400)
        }
        if (params.intro) {
            if (params.intro.length > 100) {
                return res.error('简介长度不能超过100', 400)
            } else {
                params.intro = xss(params.intro.trim())
            }
        }
        if (params.address) {
            if (params.address.length < 6) {
                return res.error('非法的地址', 400)
            } else {
                params.address = xss(params.address.trim())
            }
        }

        await merchantService.updateMerchant(params)

        user = await userService.getUserById(params.uid)

        const { password, ...result } = user[0]

        return res.ok(result)
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 新增、编辑美食信息
router.post('/food', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.uid) {
        return res.error('无访问权限', 403)
    }
    if (params.id) {
        try {
            const food = await merchantService.getFoodById(params.id, userInfo.uid)
            if (food.length === 0) {
                return res.error('美食不存在', 404)
            }
            if (params.name) {
                if (params.name.trim() === '') return res.error('美食名称为空', 400)
                if (params.name.length > 20) return res.error('美食名称长度不能超过20', 400)

                const foodList = await merchantService.getFoodByMerchantAndName(userInfo.uid, params.name)
                if (foodList.length > 0) {
                    if (foodList[0].id !== params.id) return res.error('美食名称重复', 400)
                }

                params.name = xss(params.name.trim())
            }
            if (params.intro) {
                if (params.intro.length > 100) {
                    return res.error('美食简介长度不能超过100', 100)
               } else {
                    params.intro = xss(params.intro.trim())
                }
            }
            if (params.cover && !params.cover.startsWith(`${process.env.CDN_PERFIX}cover/`)) {
                return res.error('非法的封面', 400)
            }
            if (params.price && params.price < 0) {
                return res.error('美食价格不合法', 400)
            }
            if (params.category) {
                const categoryList = await merchantService.getAllCategoryByMerchant(userInfo.uid)
                const exists = categoryList.some(item => item.id === params.category)
                if (!exists) return res.error('不存在的美食类别', 400)
            }
            if (params.status && params.status !== 0 && params.status !== 1) {
                return res.error('非法的状态', 400)
            }

            const result = await merchantService.editFood(params, userInfo.uid)

            if (result.length !== 0) {
                return res.ok(result[0], '美食编辑成功')
            } else {
                return res.error('美食编辑失败', 500)
            }
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    } else {
        try {
            if (!params.name) {
                return res.error('美食名称为空', 400)
            }
            if (!params.price) {
                return res.error('美食价格为空', 400)
            }
            if (params.name) {
                if (params.name.trim() === '') return res.error('美食名称为空', 400)
                if (params.name.length > 20) return res.error('美食名称长度不能超过20', 400)

                const foodList = await merchantService.getFoodByMerchantAndName(userInfo.uid, params.name)
                if (foodList.length > 0) return res.error('美食名称重复', 400, foodList)

                params.name = xss(params.name.trim())
            }
            if (params.intro) {
                if (params.intro.length > 100) {
                    return res.error('美食简介长度不能超过100', 100)
                } else {
                    params.intro = xss(params.intro.trim())
                }
            }
            if (params.cover && !params.cover.startsWith(`${process.env.CDN_PERFIX}cover/`)) {
                return res.error('非法的封面', 400)
            }
            if (params.price && params.price < 0) {
                return res.error('美食价格不合法', 400)
            }
            if (params.category) {
                const categoryList = await merchantService.getAllCategoryByMerchant(userInfo.uid)
                const exists = categoryList.some(item => item.category === params.category)
                if (!exists) return res.error('不存在的美食类别', 400)
            }
            if (params.status && (params.status !== 0 || params.status !== 1)) {
                return res.error('非法的状态', 400)
            }

            const result = await merchantService.addFood(params, userInfo.uid)

            if (result.length !== 0) {
                return res.ok(result[0], '美食添加成功')
            } else {
                return res.error('美食添加失败', 500)
            }
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    }
})

// 新增、编辑美食类别
router.post('/category', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.uid) {
        return res.error('无访问权限', 403)
    }

    if (params.id) {
        try {
            const category = await merchantService.getCategoryById(params.id)
            if (category.length === 0) {
                return res.error('类别不存在', 404)
            }
            if (!params.category.trim()) {
                return res.error('类别为空', 400)
            }

            const categoryList = await merchantService.getCategoryByMerchantAndCategory(userInfo.uid, params.category)
            if (categoryList.length > 0) {
                return res.error('类别已存在', 400, categoryList)
            }

            const result = await merchantService.editCategory(params.id, params.category)

            return res.ok(result[0], '类别编辑成功', 200)
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    } else {
        try {
            if (!params.category.trim()) {
                return res.error('类别为空', 400)
            }

            const categoryList = await merchantService.getCategoryByMerchantAndCategory(userInfo.uid, params.category)
            if (categoryList.length > 0) {
                return res.error('类别已存在', 400, categoryList)
            }

            const result = await merchantService.addCategory(userInfo.uid, params.category)

            return res.ok(result[0], '类别添加成功', 200)
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    }
})

// 上传文件
router.put('/file', authInterceptor, async (req, res) => {
    const file = req.getFile()
    const params = req.getParams()

    if (!['annex', 'avatar', 'cover'].includes(params.type) || !params.type) {
        return res.error('非法的文件类型', 400)
    }
    if (!file) {
        return res.error('未上传文件', 400)
    }
    if (file.length > 1) {
        return res.error('一次只能上传一个文件', 400)
    }
    if (!isImageValid(file[0])) {
        return res.error('仅支持.jpg以及.png格式的图片', 400)
    }
    if (file[0].size > 2 * 1024 * 1024) {
        return res.error('文件大小不能超过2MB', 400)
    }

    const fileName = renameFile(file[0].name)
    const result = await uploadFile(file[0].data, `${params.type}/${fileName}`)

    if (result.success) {
        return res.ok({ type: params.type, url: result.data.key, size: result.data.fsize })
    } else {
        return res.error('上传失败', 500)
    }
})

// 删除美食
router.delete('/food', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.uid) {
        return res.error('无访问权限', 403)
    }

    try {
        const food = await merchantService.getFoodById(params.id, userInfo.uid)
        if (food.length === 0) {
            return res.error('美食不存在', 404)
        }

        const result = await merchantService.deleteFood(params.id, userInfo.uid)
        if (result) {
            return res.ok({}, '美食删除成功')
        } else {
            return res.error('美食删除失败', 500)
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 删除美食类别
router.delete('/category', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.uid) {
        return res.error('无访问权限', 403)
    }

    try {
        const category = await merchantService.getCategoryById(params.id, userInfo.uid)
        if (category.length === 0) {
            return res.error('类别不存在', 404)
        }
        const result = await merchantService.deleteCategory(params.id, userInfo.uid)

        if (result) {
            return res.ok({}, '类别删除成功')
        } else {
            return res.error('类别删除失败', 500)
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

module.exports = router

