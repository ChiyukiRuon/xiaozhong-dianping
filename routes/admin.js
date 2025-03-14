const express = require('express')
const router = express.Router()
const authInterceptor = require('../Interceptors/authInterceptor')
const {adminService, userService, foodService} = require("../services");
const logger = require("../utils/logger");
const formatter = require("../utils/formatter")
const {isUsernameValid, isPasswordValid} = require("../utils/valid");
const {hashPassword} = require("../utils/bcrypt");
const {decryptData} = require("../utils/rsa");
const xss = require("xss");
const {generateRandomName} = require("../utils/formatter");
const {sendMail} = require("../utils/mail");

// 获取管理员列表
router.get('/list', authInterceptor, async (req, res) => {
    const params = req.getParams()

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))
    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const adminList = await adminService.getAdminList(params.page, params.size)
        const total = adminList.length

        adminList.forEach(item => { delete item.password })

        return res.ok({ adminList: adminList, total: total, current: params.page, size: params.size })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 使用ID获取管理员信息
router.get('/info', authInterceptor, async (req, res) => {
    const params = req.getParams()

    try {
        const adminInfo = await adminService.getAdminById(params.uid)

        return res.ok(adminInfo)
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 获取权限列表
router.get('/permission', authInterceptor, async (req, res) => {
    try {
        const permissionList = await adminService.getPermissionList()

        return res.ok({ permissionList: permissionList })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 获取未审核的普通用户列表
router.get('/verify/user', authInterceptor, async (req, res) => {
    let params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.permission.includes('user') && !userInfo.permission.includes('super')) {
        return res.error('没有权限', 403)
    }

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))
    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const result = await adminService.getUnverifiedUserList(params.page, params.size, params.username, params.nickname, params.detail)

        return res.ok({ userList: formatter.unverifiedUserList(result.list), total: result.total, current: params.page, size: params.size })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 获取未审核的商家列表
router.get('/verify/merchant', authInterceptor, async (req, res) => {
    let params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.permission.includes('merchant') && !userInfo.permission.includes('super')) {
        return res.error('没有权限', 403)
    }

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const result = await adminService.getUnverifiedMerchantList(params.page, params.size, params.username, params.nickname, params.detail)

        return res.ok({ merchantList: formatter.unverifiedUserList(result.list), total: result.total, current: params.page, size: params.size })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 获取评论列表
router.get('/review', authInterceptor, async (req, res) => {
    let params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.permission.includes('content') && !userInfo.permission.includes('super')) {
        return res.error('没有权限', 403)
    }

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (params.page <= 0 || params.size <= 0) {
       return res.error('非法的分页参数', 400)
    }

    try {
        const result = await adminService.getReviewList(params.page, params.size, params.nickname, params.food, params.merchant)

        return res.ok({ reviewList: result.list, total: result.total, current: params.page, size: params.size }, '获取成功')
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 获取上架的美食
router.get('/food', authInterceptor, async (req, res) => {
    const params = req.getParams()

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const result = await adminService.getFoodList(params.page, params.size, params.food, params.merchant)

        return res.ok({ foodList:result.list, total: result.total, current: params.page,})
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 新增、编辑管理员
router.post('/info', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo
    let permissionList = await adminService.getPermissionList()
    permissionList = permissionList.map(item => item.permission)

    if (!userInfo.permission.includes('super')) {
        return res.error('没有权限', 403)
    }

    if (params.uid) {
        const adminInfo = await adminService.getAdminById(params.uid)

        if (!adminInfo || adminInfo.length === 0) {
            return res.error('管理员不存在', 404)
        }
        if (userInfo.uid === params.uid) {
            return res.error('没有权限', 403)
        }

        if (params.username) {
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
        }
        if (params.permission) {
            const validPermissions = [...new Set(params.permission.filter(item => permissionList.includes(item)))]

            params.permission = validPermissions.length > 0 ? validPermissions : null
        }
        if (params.status && (params.status !== 0 || params.status !== 2)) {
            return res.error('非法的状态', 400)
        }
        if (params.remark) {
            const validRemark = xss(params.remark.trim())

            if (validRemark.length > 200) {
                return res.error('备注长度过长', 400)
            } else if (validRemark.length === 0) {
                params.remark = ' '
            } else {
                params.remark = validRemark
            }
        }

        try {
            const admin = await adminService.updateAdmin(params)
            const {password, ...adminInfo} = admin[0]

            return res.ok({ adminInfo: adminInfo }, '更新成功')
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    } else {
        if (params.username) {
            const userList = await userService.getUserByUsername(params.username)

            if (!isUsernameValid(params.username) || userList.length > 0) {
                return res.error('非法的用户名', 400)
            }
        } else {
            return res.error('用户名不能为空', 400)
        }
        if (params.password) {
            const plainPassword = decryptData(params.password)

            if (!params.password || !isPasswordValid(plainPassword)) {
                return res.error('非法的密码', 400)
            } else {
                params.password = await hashPassword(plainPassword)
            }
        } else {
            return res.error('密码不能为空', 400)
        }
        if (params.permission) {
            const validPermissions = [...new Set(params.permission.filter(item => permissionList.includes(item)))]

            if (validPermissions.length === 0) {
                return res.error('权限列表为空', 400)
            } else {
                params.permission = validPermissions
            }
        }
        if (params.remark) {
            const validRemark = xss(params.remark.trim())

            if (validRemark.length > 200) {
                return res.error('备注长度过长', 400)
            } else {
                params.remark = validRemark
            }
        }

        try {
            const admin = await adminService.addAdmin(params)
            const {password, ...adminInfo} = admin[0]

            return res.ok({ adminInfo: adminInfo }, '添加成功')
        } catch (e) {
            logger.error(e)
            return res.error('服务器内部错误', 500)
        }
    }
})

// 审核用户
router.post('/verify/user', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.permission.includes('user') && !userInfo.permission.includes('super')) {
        return res.error('没有权限', 403)
    }

    const verifyDetail = await adminService.getUnverifiedUserById(params.id, 'user')

    if (!verifyDetail || verifyDetail.length === 0 || verifyDetail[0].type !== 'user') {
        return res.error('记录不存在', 404)
    }
    if (params.uid !== verifyDetail[0].uid) {
        return res.error('非法的操作', 400)
    }
    if (params.approve !== 0 && params.approve !== 1) {
        return res.error('非法的参数', 400)
    }
    try {
        if (params.approve === 0) {
            switch (verifyDetail[0].detail) {
                case 'nickname':
                    await userService.updateUser({uid: params.uid, nickname: generateRandomName(verifyDetail[0].username, 8, '用户 ')})
                    await adminService.verifyUser(params.id, 3)
                    return res.ok({}, '操作成功')
                case 'avatar':
                    await userService.updateUser({uid: params.uid, avatar: `${process.env.CDN_PERFIX}avatar.jpg`})
                    await adminService.verifyUser(params.id, 3)
                    return res.ok({}, '操作成功')
                case 'intro':
                    await userService.updateUser({uid: params.uid, intro: '这个人很懒，什么都没有写'})
                    await adminService.verifyUser(params.id, 3)
                    return res.ok({}, '操作成功')
                default:
                    return res.error('服务器内部错误', 500)
            }
        } else if (params.approve === 1) {
            await adminService.verifyUser(params.id, 0)
            return res.ok({}, '操作成功')
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 审核商家
router.post('/verify/merchant', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const userInfo = req.userInfo

    if (!userInfo.permission.includes('merchant') && !userInfo.permission.includes('super')) {
        return res.error('没有权限', 403)
    }

    const verifyDetail = await adminService.getUnverifiedUserById(params.id, 'merchant')

    if (!verifyDetail || verifyDetail.length === 0 || verifyDetail[0].type !== 'merchant') {
        return res.error('记录不存在', 404)
    }
    if (params.approve !== 0 && params.approve !== 1) {
        return res.error('非法的参数', 400)
    }

    try {
        if (params.approve === 0) {
            switch (verifyDetail[0].detail) {
                case 'register':
                    // await userService.updateUser({uid: params.uid, status: 4})
                    await adminService.verifyMerchant(params.id, 3, {uid: params.uid, remark: params.remark, status: 0})

                    sendMail(verifyDetail[0].email, '', '', 'reject', {username: verifyDetail[0].username, remark: params.remark}).then(r => {
                        if (!r.success) logger.error(r)
                    })
                    return res.ok({}, '操作成功')
                case 'nickname':
                    await userService.updateUser({uid: params.uid, nickname: generateRandomName(verifyDetail[0].username, 8, '商户 ')})
                    await adminService.verifyUser(params.id, 3)
                    return res.ok({}, '操作成功')
                case 'avatar':
                    await userService.updateUser({uid: params.uid, avatar: 'http://cdn.dianping.chiyukiruon.top/avatar.jpg'})
                    await adminService.verifyUser(params.id, 3)
                    return res.ok({}, '操作成功')
                case 'intro':
                    await userService.updateUser({uid: params.uid, intro: '这个人很懒，什么都没有写'})
                    await adminService.verifyUser(params.id, 3)
                    return res.ok({}, '操作成功')
                default:
                    return res.error('服务器内部错误', 500)
            }
        } else if (params.approve === 1) {
            await adminService.verifyMerchant(params.id, 0, {uid: params.uid, remark: params.remark, status: 0})

            sendMail(verifyDetail[0].email, '', '', 'approve', {username: verifyDetail[0].username}).then(r => {
                if (!r.success) logger.error(r)
            })

            return res.ok({}, '操作成功')
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }

})

// 封禁用户
router.post('/user/ban', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const usrList = await userService.getUserById(params.uid)

    if (!usrList || usrList.length === 0) {
        return res.error('用户不存在', 404)
    }
    if (params.type !== 'user' && params.type !== 'merchant') {
        return res.error('非法的参数', 400)
    }

    try {
        const result = await adminService.banUser(params.uid, params.type)

        if (result) {
            return res.ok({}, '操作成功')
        } else {
            return res.error('服务器内部错误', 500)
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 删除评价
router.delete('/review', authInterceptor, async (req, res) => {
    const params = req.getParams()

    if (!params.id) {
        return res.error('参数不正确', 400)
    }
    if (!params.remark) {
        return res.error('未填写删除原因', 400)
    }

    try {
        const result = await adminService.deleteReviewById(params.id, params.remark)

        if (result.changedRows === 0) {
            if (result.info.includes("Rows matched: 0")) {
                return res.error('评价不存在', 404)
            }
            return res.error('删除失败', 500)
        } {
            await foodService.updateFoodScore(params.food)
            return res.ok({}, '操作成功')
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 下架商品
router.delete('/food', authInterceptor, async (req, res) => {
    const params = req.getParams()

    if (!params.id) {
        return res.error('参数不正确', 400)
    }
    if (!params.remark) {
        return res.error('未填写删除原因', 400)
    }
    try {
        const result = await adminService.deleteFoodById(params.id, params.remark)

        if (result.changedRows === 0) {
            if (result.info.includes("Rows matched: 0")) {
                return res.error('美食不存在', 404)
            }
            return res.error('下架失败', 500)
        } else {
            return res.ok({}, '操作成功')
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

module.exports = router