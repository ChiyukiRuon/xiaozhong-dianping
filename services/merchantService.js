const db = require('../utils/db')
const {pool} = require("../utils/db");
const logger = require("../utils/logger");

/**
 * 注册商家
 *
 * @param {String} username 用户名
 * @param {String} hashedPassword 密码
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const registerMerchant = async (username, hashedPassword) => {
    const sql = 'INSERT INTO user (username, password, role, status) VALUES (?, ?, "merchant", 4)'
    return await db.query(sql, [username, hashedPassword])
}

/**
 * 提交申请商家资料
 *
 * @param {Object} merchantInfo 商家信息
 * @return {Promise<boolean>}
 * @author ChiyukiRuon
 * */
const applyMerchant = async (merchantInfo) => {
    const {uid, nickname, avatar, phone, email, address, annex } = merchantInfo

    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const sql1 = 'UPDATE user SET nickname = ?, avatar = ?, phone = ?, email = ?, address = ?, annex = ? WHERE uid = ?'
        await db.query(sql1, [nickname, avatar, phone, email, address, annex, uid])

        const sql2 = 'INSERT INTO verification (type, detail, source_id, status, annex) VALUES ("merchant", "register", ?, 2, ?)'
        await connection.query(sql2, [uid, annex])

        await connection.commit()
        return true
    } catch (error) {
        console.log('Error:', error)
        logger.error('Transaction failed:', error)
        await connection.rollback()
        return false
    } finally {
        connection.release()
    }
}

/**
 * 更新商家信息
 *
 * @param {Object} userInfo 用户信息
 * @return {Promise<void>}
 * @author ChiyukiRuon
 */
const updateMerchant = async (userInfo) => {
    const {
        uid,
        username,
        password,
        nickname,
        avatar,
        intro,
        phone,
        email,
        address
    } = userInfo

    const fields = []
    const values = []

    if (username) {
        fields.push('username = ?')
        values.push(username)
    }
    if (password) {
        fields.push('password = ?')
        values.push(password)
    }
    if (nickname) {
        fields.push('nickname = ?')
        values.push(nickname)
    }
    if (avatar) {
        fields.push('avatar = ?')
        values.push(avatar)
    }
    if (intro) {
        fields.push('intro = ?')
        values.push(intro)
    }
    if (phone) {
        fields.push('phone = ?')
        values.push(phone)
    }
    if (email) {
        fields.push('email = ?')
        values.push(email)
    }
    if (address) {
        fields.push('address = ?')
        values.push(address)
    }

    if (fields.length === 0) {
        return
    }

    values.push(uid)

    const sql = `UPDATE user SET ${fields.join(', ')} WHERE uid = ?`

    await db.query(sql, values)
}

module.exports = {
    registerMerchant,
    applyMerchant,
    updateMerchant
}