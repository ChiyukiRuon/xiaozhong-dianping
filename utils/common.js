/**
 * 获取角色对应的首页路径
 *
 * @param {String} role 角色
 * @return {String} 首页路径
 * @author ChiyukiRuon
 * */
const getPagePathByRole = (role) => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard'
        case 'normal':
            return '/'
        case 'merchant':
            return '/merchant/dashboard'
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