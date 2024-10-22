const express = require('express')
const fileUpload = require('express-fileupload');
const app = express()
const fs = require('fs')
const route = require('./routes')
const requestInterceptor = require('./Interceptors/requestInterceptor')    // 引入请求拦截器
const { userService, commonService} = require('./services')
const logger = require('./utils/logger')
const generateKeyPair = require('./utils/rsa')
const {decryptData} = require("./utils/rsa");
const {comparePassword} = require("./utils/bcrypt");
const jwt = require("./utils/jwt");
const {getRoute} = require("./utils/common");
const authInterceptor = require("./Interceptors/authInterceptor");
const cors = require('cors');

const PORT = process.env.PORT || 3000

let publicKey = ''
if (!fs.existsSync('./keys/public.key') || !fs.existsSync('./keys/private.key')) {
    logger.info('Generating Key Pair')
    generateKeyPair()
} else {
    publicKey = fs.readFileSync('./keys/public.key', 'utf8')
    logger.info('Key Pair Exists')
}

app.use(fileUpload({
    createParentPath: true
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(requestInterceptor)

app.use('/api', route)

// 获取公钥
app.get('/api/key', async (req, res) => {
    if (publicKey !== '') {
        res.ok({key: publicKey})
    } else {
        res.error('Service not available', 503)
    }
})

// 获取路由
app.get('/api/route', authInterceptor, async (req, res) => {
    const userInfo = req.userInfo

    if (!userInfo) {
        return res.ok({ router: '/' })
    } else {
        const { path, route } = getRoute(userInfo)

        return res.ok({ path: path, route: route })
    }
})

// 获取行政区划
app.get('/api/regions', async (req, res) => {
    const params = req.getParams()


    try {
        const result = await commonService.getRegionList(params.pcode)

        return res.ok(result)
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 获取首页美食
app.get('/api/index', async (req, res) => {
    const params = req.getParams()

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const result = await commonService.getIndex(params.page, params.size)

        return res.ok({ list: result.list, total: result.total, current: params.page, size: params.size })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 搜索商家
app.get('/api/search/merchant', async (req,res) => {
    const params = req.getParams()

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const result = await commonService.searchMerchant(params.term)
        return res.ok({ list: result.list, total: result.total, current: params.page, size: params.size })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 搜索美食
app.get('/api/search/food', async (req,res) => {
    const params = req.getParams()

    params.page = parseInt(params.page) || 1
    params.size = parseInt(params.size) || Math.min(300, parseInt(params.size))

    if (params.page <= 0 || params.size <= 0) {
        return res.error('非法的分页参数', 400)
    }

    try {
        const result = await commonService.searchFood(params.term)
        return res.ok({ list: result.list, total: result.total, current: params.page, size: params.size })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 获取美食详情
app.get('/api/food', async (req, res) => {
    const params = req.getParams()

    try {
        const result = await commonService.getFoodById(params.id)

        if (Object.keys(result).length === 0) {
            return res.error('美食不存在', 404)
        }

        return res.ok({ food: result })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 根据美食ID获取评论
app.get('/api/review', async (req, res) => {
    const params = req.getParams()

    if (!params.id) {
        return res.error('请输入美食ID', 400)
    }

    try {
        const result = await commonService.getReviewById(params.id)

        return res.ok({ list: result })
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

// 验证用户
app.post('/api/auth', async (req, res) => {
    const params = req.getParams()
    try {
        const plainPassword = decryptData(params.password)
        const user = await userService.getUserByUsername(params.username)

        // console.log(await hashPassword(plainPassword))

        if (!params.username || !params.password) {
            return res.error('请输入用户名和密码', 400)
        } else if (user.length !== 1 || !await comparePassword(plainPassword, user[0].password)) {
            return res.error('用户名或密码错误', 400)
        } else if (user[0].status >= 2 || user[0].status === 3) {
            return res.error('账户不可用', 403)
        } else {
            const { password, ...userInfo } = user[0]
            const payload = (({ uid, username, role, permission, status }) => ({ uid, username, role, permission, status }))(user[0])
            const token = jwt.signToken(payload)
            const { path, route } = getRoute(userInfo)

            return res.ok({ token: token, user: userInfo, path: path, route: route }, '登录成功')
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

app.listen(PORT, () => logger.info(`Server start on port ${PORT}`))
