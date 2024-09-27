/**
 * 检查用户名合法性
 *
 * @param {string} username 用户名
 * @returns {boolean} 返回 true 表示用户名合法，false 表示不合法
 * @author ChiyukiRuon
 */
const isUsernameValid = (username) => {
    // 用户名长度应在 3 到 30 个字符之间，且只能包含字母、数字和下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    return usernameRegex.test(username)
}

/**
 * 检查密码合法性
 *
 * @param {string} password 密码
 * @returns {boolean} 返回 true 表示密码合法，false 表示不合法
 */
const isPasswordValid = (password) => {
    // 密码长度应在 3 到 20 个字符之间，且包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/
    return passwordRegex.test(password)
}

/**
 * 检查手机号是否合法（中国大陆）
 *
 * @param {string} phoneNumber 手机号
 * @return {boolean} 返回 true 表示手机号合法，false 表示不合法
 */
const isPhoneNumberValid = (phoneNumber) => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phoneNumber)
}

/**
 * 检查邮箱是否合法
 *
 * @param {string} email 邮箱地址
 * @return {boolean} 返回 true 表示邮箱合法，false 表示不合法
 */
const isEmailValid = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
}

/**
 * 检查图片文件是否合法
 *
 * @param {Object} image 文件对象
 * @return {boolean} 返回 true 表示图片合法，false 表示不合法
 * */
const isImageValid = (image) => {
    // 检查文件类型是否为图片
    const imageTypes = ['image/jpeg', 'image/png']
    return imageTypes.includes(image.mimetype)
}

module.exports = {
    isUsernameValid,
    isPasswordValid,
    isPhoneNumberValid,
    isEmailValid,
    isImageValid
}