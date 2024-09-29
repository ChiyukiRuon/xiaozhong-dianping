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

// 获取商家信息
router.get('/info', (req, res) => {
    // 获取商户信息逻辑
    res.ok({ id: 1, name: '商户名称' })
})

// 添加食物
router.post('/food', authInterceptor, (req, res) => {
    // 添加食物逻辑
    res.ok('食物添加成功')
})

// 获取食物列表
router.get('/food', (req, res) => {
    // 获取食物列表逻辑
    res.ok([
        { id: 1, name: '食物1' },
        { id: 2, name: '食物2' }
    ])
})

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

// 上传用户头像
router.put('/avatar', authInterceptor, async (req, res) => {
    const file = req.getFile()

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
    const result = await uploadFile(file[0].data, `avatar/${fileName}`)

    if (result.success) {
        return res.ok({ url: result.data.key, size: result.data.fsize })
    } else {
        return res.error('上传失败', 500)
    }
})

// 上传附件
router.put('/annex', authInterceptor, async (req, res) => {
    const file = req.getFile()

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
    const result = await uploadFile(file[0].data, `annex/${fileName}`)

    if (result.success) {
        return res.ok({ url: result.data.key, size: result.data.fsize })
    } else {
        return res.error('上传失败', 500)
    }
})

module.exports = router
