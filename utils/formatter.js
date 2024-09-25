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

module.exports = {
    unverifiedUserList
}