const ADMIN_MENU = [
    {
        title: '用户管理',
        icon: 'UserFilled',
        path: '/user'
    },
    {
        title: '商家管理',
        icon: 'Shop',
        path: '/merchant'
    },
    {
        title: '内容管理',
        icon: 'Menu',
        path: '/content'
    }
]
// TODO 待完善
const MERCHANT_MENU = [
    {
        title: '店铺信息',
        icon: 'Shop',
        path: '/info'
    },
    {
        title: '美食管理',
        icon: 'ShoppingCartFull',
        path: '/food'
    },
    {
        title: '分类管理',
        icon: 'Tickets',
        path: '/category'
    },
    {
        title: '我的评价',
        icon:'Star',
        path: '/review'
    }
]
const NORMAL_MENU = [
    {
        title: '个人信息',
        icon: 'HomeFilled',
        path: '/info'
    },
    {
        title: '历史评价',
        icon: 'Menu',
        path: '/category'
    },
]

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
            return '/dashboard/admin'
        case 'normal':
            return '/'
        case 'merchant':
            switch (status) {
                case 0:
                    return '/dashboard/merchant'
                case 1:
                    return '/dashboard/merchant/status'
                case 4:
                    return '/dashboard/merchant/apply'
                case 5:
                    return '/dashboard/merchant/apply'
                default:
                    return '/login'
            }
        default:
            return '/login'
    }
}

/**
 * 获取菜单
 *
 * @param {String} role 角色
 * @param {String} permission 权限
 * @return {Array} 菜单列表
 * */
const getSidebar = (role, permission) => {
    switch (role) {
        case 'admin':
            switch (permission) {
                case 'super':
                    return ADMIN_MENU
                case 'user':
                    return ADMIN_MENU.slice(0, 1)
                case 'merchant':
                    return ADMIN_MENU.slice(1, 2)
                case 'content':
                    return ADMIN_MENU.slice(2, 3)
                default:
                    return []
            }
        case 'normal':
            return NORMAL_MENU
        case 'merchant':
            return MERCHANT_MENU
    }

}

/**
 * 根据权限返回首页路径及菜单
 *
 * @param {Object} userInfo 用户信息
 * @return {Object} 首页路径及菜单
 * @author ChiyukiRuon
 * */
const getRoute = (userInfo) => {
    const { role, status, permission } = userInfo
    const pagePath = getPagePathByRole(role, status)
    const sidebar = getSidebar(userInfo.permission, permission)
    return { pagePath, sidebar }
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
    getSidebar,
    getRoute,
    getFileExtension
}