/**
 * 获取角色对应的首页路径
 *
 * @param {String} role 角色
 * @param {Number} status 状态
 * @return {String} 首页路径
 * @author ChiyukiRuon
 * */
const getPagePathByRole = (role, status) => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard'
        case 'normal':
            return '/'
        case 'merchant':
            switch (status) {
                case 0:
                    return '/merchant/dashboard'
                case 1:
                    return '/merchant/status'
                case 4:
                    return '/merchant/apply'
                case 5:
                    return '/merchant/apply'
                default:
                    return '/login'
            }
        default:
            return '/login'
    }
}

/**
 * 获取文件后缀名
 *
 * @param {String} filename 文件名
 * @return {String} 文件后缀名
 * @author ChiyukiRuon
 * */
const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
}

module.exports = {
    getPagePathByRole,
    getFileExtension
}