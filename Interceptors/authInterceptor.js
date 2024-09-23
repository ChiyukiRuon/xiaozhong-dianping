const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'secret_key'
const ROLE_PATH = {
    normal: '/api/user',
    admin: '/api/admin',
    merchant: '/api/merchant'
}

const authInterceptor = (req, res, next) => {
    const token = req.headers['authorization'] // 从请求头中获取 token

    if (!token) {
        return res.error('需要提供 Token', 403)
    }

    // 验证 token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.error('无效的 Token', 401)
        }

        if (ROLE_PATH[decoded.role] && req.originalUrl.startsWith(ROLE_PATH[decoded.role])) {
            req.userInfo = decoded
            next()
        } else {
            return res.error('无效的 Token', 403)
        }
    })
}

module.exports = authInterceptor
