const express = require('express')
const router = express.Router()
const authInterceptor = require('../Interceptors/authInterceptor')
const {userService, foodService} = require("../services");
const {isPasswordValid, isUsernameValid, isPhoneNumberValid, isImageValid, isNicknameValid, isEmailValid} = require("../utils/valid");
const logger = require("../utils/logger");
const {decryptData} = require("../utils/rsa");
const {hashPassword} = require("../utils/bcrypt");
const jwt = require("../utils/jwt");
const xss = require("xss");
const {uploadFile} = require("../utils/qiniu");
const {renameFile} = require("../utils/formatter");
const {getRoute} = require("../utils/common");

const CDN_PREFIX = process.env.CDN_PERFIX

// 搜索用户
router.get('/search', async (req, res) => {
    const params = req.getParams()

    if (params.term) params.term = xss(params.term.trim())
    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (!params.term) {
        return res.error('请输入搜索内容', 400)
    }
    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const userList = await userService.searchUsers(params.term, params.page, params.size)
        const total = userList.length

        return res.ok({ userList: userList, total: total, current: params.page, size: params.size }, '获取成功')
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

router.get('/available', async (req, res) => {
    const params = req.getParams()

    try {
        const result = await userService.getUserByUsername(params.username)

        if (result.length === 0) {
            return res.ok({ available: true })
        } else {
            return res.ok({ available: false })
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

router.get('/review', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo
    const user = await userService.getUserById(userInfo.uid)

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (!user || user.length === 0 || user[0].status !== 0 || user[0].role !== 'normal') {
        return res.error('用户不存在', 404)
    }
    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const result = await userService.getReviewListByUser(userInfo.uid, params.page, params.size)

        return res.ok({ reviewList: result.list, total: result.total, current: params.page, size: params.size }, '获取成功')
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 普通用户注册
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
            await userService.registerUser(params.username, hashedPassword)
        }

        const user = await userService.getUserByUsername(params.username)

        const { password, ...userInfo } = user[0]
        const payload = (({ uid, username, role, permission, status }) => ({ uid, username, role, permission, status }))(user[0])
        const token = jwt.signToken(payload)
        const { path, route } = getRoute(userInfo)

        return res.ok({ token: token, user: userInfo, path: path, route: route }, '注册成功', 201)
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 普通用户编辑信息
router.post('/info', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    try {
        let user = await userService.getUserById(userInfo.uid)

        if (!user || user[0].role !== 'normal') {
            return res.error('用户不存在', 404)
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
        if (params.nickname && !isNicknameValid(params.nickname)) {
            return res.error('非法的昵称', 400)
        }
        if (params.intro) {
            if (params.intro.length > 100) {
                return res.error('简介长度不能超过100', 400)
            } else {
                params.intro = xss(params.intro.trim())
            }
        }

        params.uid = userInfo.uid
        await userService.updateUser(params)

        user = await userService.getUserById(userInfo.uid)

        const { password, ...result } = user[0]

        return res.ok(result)
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 发表、更新评论
router.post('/review', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (params.id) {
        const filteredData = (({ id, content, score, anonymity, status }) => ({ id, content, score, anonymity, status }))(params)
        const reviewInfo = await userService.getReviewById(params.id)

        if (!reviewInfo || reviewInfo.length === 0 || reviewInfo[0].status !== 0) {
            return res.error('评论不存在', 404)
        }
        if (reviewInfo[0].author_id !== userInfo.uid) {
            return res.error('未授权的操作', 403)
        }
        if (reviewInfo[0].status !== 0 && reviewInfo[0].status !== 3) {
            return res.error('当前状态禁止编辑', 403)
        }

        if (params.content) {
            params.content = xss(params.content.trim())

            if (params.content.length > 200 || params.content.length < 5) {
                return res.error('评论内容长度必须在5到200之间', 400)
            }
        }
        if (params.score && (params.score < 0 || params.score > 5)) {
            return res.error('评分必须在0到5之间', 400)
        }
        if (params.anonymity && params.anonymity !== 0 && params.anonymity !== 1) {
            return res.error('非法的操作', 400)
        }
        if (params.status && params.status !== 0 && params.status !== 3) {
            return res.error('未授权的操作', 403)
        }

        try {
            const result = await userService.updateReview(filteredData)
            if (params.score) await foodService.updateFoodScore(params.id)

            return res.ok({ review: result[0] }, '更新成功')
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    } else {
        const filteredData = (({ content, target, parent, score, anonymity, merchant, annex }) => ({ content, target, parent, score, anonymity, merchant, annex }))(params)

        if (!params.target || (!params.parent && !params.score)) {
            return res.error('非法的操作', 400)
        }
        if (!params.content) {
            return res.error('评论内容不能为空', 400)
        }
        if (!params.merchant) {
            return res.error('非法的操作', 400)
        }

        params.content = xss(params.content.trim())
        filteredData.content = params.content
        if (params.content.length > 200 || params.content.length < 5) {
            return res.error('评论内容长度必须在5到200之间', 400)
        }
        if (params.parent) {
            const parentReview = await userService.getReviewById(params.parent)

            if (!parentReview || parentReview.length === 0 || parentReview[0].status !== 0) {
                return res.error('评论不存在', 404)
            } else if (parentReview[0].target !== params.target || parentReview[0].status !== 0) {
                return res.error('非法的操作', 400)
            }
        } else {
            filteredData.parent = null
        }
        if (params.target) {
            const targetInfo = await foodService.getFoodById(params.target)

            if (!targetInfo || targetInfo.length === 0) {
                return res.error('美食不存在', 404)
            }
        }
        if (params.score && (params.score < 0 || params.score > 5)) {
            return res.error('评分必须在0到5之间', 400)
        } else if (!params.score) {
            filteredData.score = null
        }
        if (params.anonymity && params.anonymity !== 0 && params.anonymity !== 1) {
            return res.error('非法的操作', 400)
        } else if (!params.anonymity) {
            filteredData.anonymity = 0
        }
        if (params.merchant) {
            const merchantInfo = await userService.getUserById(params.merchant)

            if (!merchantInfo || merchantInfo.length === 0 || merchantInfo[0].role !== 'merchant' || merchantInfo[0].status !== 0) {
                return res.error('未找到商家', 404)
            }
        }
        if (params.annex && !params.annex.startsWith(CDN_PREFIX)) {
            return res.error('非法的附件', 400)
        }

        try {
            filteredData.author = userInfo.uid
            const review = await userService.postReview(filteredData)
            await foodService.updateFoodScore(review[0].target_id)

            return res.ok({ review: review[0] }, '发表成功', 201)
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

    if (!['annex', 'avatar'].includes(params.type) || !params.type) {
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

router.delete('/review', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!params.id) {
        return res.error('未知参数', 400)
    }

    const review = await userService.getReviewById(params.id)

    if (!review || review.length === 0) {
        return res.error('评论不存在', 404)
    }
    if (review[0].author_id !== userInfo.uid) {
        return res.error('非法的操作', 403)
    }

    try {
        await userService.deleteReviewById(params.id, userInfo.uid)
        await foodService.updateFoodScore(review[0].target_id)

        return res.ok({}, '删除成功')
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

module.exports = router