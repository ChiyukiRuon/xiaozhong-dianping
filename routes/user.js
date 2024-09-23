const express = require('express')
const router = express.Router()
const authInterceptor = require('../Interceptors/authInterceptor')
const {userService} = require("../services");
const {isPasswordValid, isUsernameValid, isPhoneNumberValid} = require("../utils/valid");
const logger = require("../utils/logger");
const {decryptData} = require("../utils/rsa");
const {hashPassword} = require("../utils/bcrypt");
const jwt = require("../utils/jwt");
const xss = require("xss");

router.get('/review', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo
    const user = await userService.getUserById(params.uid)

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (!user || user.length === 0 || user[0].status !== 0 || user[0].role !== 'normal') {
        return res.error('用户不存在', 404)
    }
    if (params.uid !== userInfo.uid.toString()) {
        return res.error('未授权的操作', 403)
    }
    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const total = await userService.getReviewCountByUser(params.uid)
        const reviews = await userService.getReviewListByUser(params.uid, params.page, params.size)

        return res.ok({ reviewList: reviews, total: total[0].count, current: params.page, size: params.size }, '获取成功')
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

        const user = await userService.login(params.username)

        const { password, ...userInfo } = user[0]
        const payload = (({ uid, username, role, permission, status }) => ({ uid, username, role, permission, status }))(user[0])
        const token = jwt.signToken(payload)

        return res.ok({ token: token, user: userInfo}, '注册成功', 201)
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 普通用户编辑信息
router.post('/info', authInterceptor, async (req, res) => {
    const params = req.getParams()

    try {
        let user = await userService.getUserById(params.uid)

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

        await userService.updateUser(params)

        user = await userService.getUserById(params.uid)

        const { password, ...userInfo } = user[0]

        return res.ok(userInfo)
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
        if (reviewInfo[0].status !== 0 || reviewInfo[0].status !== 3) {
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

            return res.ok({ review: result[0] }, '更新成功')
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    } else {
        const filteredData = (({ content, author, target, parent, score, anonymity }) => ({ content, author, target, parent, score, anonymity }))(params)

        if (params.author !== userInfo.uid) {
            return res.error('未授权的操作', 403)
        }
        if (!params.author || !params.target || (!params.parent && !params.score)) {
            return res.error('非法的操作', 400)
        }
        if (!params.content) {
            return res.error('评论内容不能为空', 400)
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
            const targetInfo = [{ id: 1, status: 0}]   // TODO 待实现 获取评论目标美食的信息

            if (!targetInfo || targetInfo.length === 0 || targetInfo[0].status !== 0) {
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

        console.log(filteredData)

        try {
            const review = await userService.postReview(filteredData)

            return res.ok({ review: review[0] }, '发表成功', 201)
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    }
})

module.exports = router