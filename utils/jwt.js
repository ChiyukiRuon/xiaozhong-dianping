const jwt = require('jsonwebtoken')
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'secret_key'

/**
 * Token 签名
 *
 * @param payload {Object} 用户信息
 * @param expires {String} 有效期
 * @return {String} token
 * @author ChiyukiRuon
 * */
const signToken = (payload, expires = '1d') => jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: expires })

/**
 * Token 验证
 *
 * @param token {String} token
 * @return {Object} 用户信息
 * @author ChiyukiRuon
 * */
const verifyToken = (token) => jwt.verify(token, JWT_SECRET_KEY)

module.exports = {
    signToken,
    verifyToken
}