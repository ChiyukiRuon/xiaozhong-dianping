const bcrypt = require('bcrypt')

/**
 * 加密密码
 *
 * @param {String} plainPassword 明文密码
 * @return {Promise<String>}
 * @author ChiyukiRuon
 * */
const hashPassword = async (plainPassword) => {
    try {
        const saltRounds = 10
        const salt = await bcrypt.genSalt(saltRounds)
        return await bcrypt.hash(plainPassword, salt)
    } catch (error) {
        throw new Error('Error hashing password')
    }
}

/**
 * 比较密码
 *
 * @param {String} plainPassword 明文密码
 * @param {String} hashedPassword 密文密码
 * @return {Promise<Boolean>} 比较结果, true: 密码一致, false: 密码不一致
 * @author ChiyukiRuon
 * */
const comparePassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword)
    } catch (error) {
        throw new Error('Error comparing passwords')
    }
}

module.exports = {
    hashPassword,
    comparePassword
}