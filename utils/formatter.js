/**
 * 格式化未审核用户的信息
 *
 * @param {Array} userInfoList 未审核用户信息列表
 * @return {Array} 格式化后的用户信息列表
 * @author ChiyukiRuon
 * */
const unverifiedUserList = (userInfoList) => {
    return userInfoList.map(obj => {
        const { uid, username, nickname, avatar, intro, role, userStatus, userRemark, ...rest } = obj

        const user = {
            uid,
            username,
            nickname,
            avatar,
            intro,
            role,
            status: userStatus,
            remark: userRemark
        }

        return {
            ...rest,
            user
        }
    })
}

/**
 * 生成随机昵称
 *
 * @param {String} baseStr 基础字符串
 * @param {Number} length 生成长度
 * @return {String} 生成的随机昵称
 */
const generateRandomName = (baseStr, length) => {
    let result = ''
    const baseLength = baseStr.length

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * baseLength)
        result += baseStr[randomIndex]
    }

    return `用户 ${result}`
}

module.exports = {
    unverifiedUserList,
    generateRandomName
}