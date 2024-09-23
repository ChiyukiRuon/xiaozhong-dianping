const express = require('express')
const app = express()
const fs = require('fs')
const route = require('./routes')
const requestInterceptor = require('./Interceptors/requestInterceptor')    // 引入请求拦截器
const { userService } = require('./services')
const logger = require('./utils/logger')
const generateKeyPair = require('./utils/rsa')
const {decryptData} = require("./utils/rsa");
const {comparePassword} = require("./utils/bcrypt");
const jwt = require("./utils/jwt");

const PORT = process.env.PORT || 3000

let publicKey = ''
if (!fs.existsSync('./keys/public.key') || !fs.existsSync('./keys/private.key')) {
    logger.info('Generating Key Pair')
    generateKeyPair()
} else {
    publicKey = fs.readFileSync('./keys/public.key', 'utf8')
    logger.info('Key Pair Exists')
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestInterceptor)

app.use('/api', route)

app.get('/api/key', async (req, res) => {
    if (publicKey !== '') {
        res.ok({key: publicKey})
    } else {
        res.error('Service not available', 503)
    }
})

app.post('/api/login', async (req, res) => {
    const params = req.getParams()
    try {
        const plainPassword = decryptData(params.password)
        const user = await userService.getUserByUsername(params.username)

        // console.log(await hashPassword(plainPassword))

        if (!params.username || !params.password) {
            return res.error('请输入用户名和密码', 400)
        } else if (user.length !== 1 || !await comparePassword(plainPassword, user[0].password)) {
            return res.error('用户名或密码错误', 401)
        } else if (user[0].status >= 2 || user[0].status !== 0 && user[0].role === 'merchant') {
            return res.error('账户不可用', 403)
        } else {
            const { password, ...userInfo } = user[0]
            const payload = (({ uid, username, role, permission, status }) => ({ uid, username, role, permission, status }))(user[0])
            const token = jwt.signToken(payload)

            return res.ok({ token: token, user: userInfo}, '登录成功')
        }
    } catch (e) {
        logger.error(e)
        return res.error('服务器内部错误', 500)
    }
})

app.listen(PORT, () => logger.info(`Server start on port ${PORT}`))
