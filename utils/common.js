const ADMIN_MENU = [
    {
        title: '用户管理',
        icon: 'UserFilled',
        path: 'user',
        component: 'User'
    },
    {
        title: '商家管理',
        icon: 'Shop',
        path: 'merchant',
        component: 'Merchant'
    },
    {
        title: '评论管理',
        icon: 'Menu',
        path: 'content',
        component: 'Content'
    }
]
// TODO 待完善
const MERCHANT_MENU = [
    {
        title: '店铺信息',
        icon: 'Postcard',
        path: 'info',
        component: 'Info'
    },
    {
        title: '美食管理',
        icon: 'Dish',
        path: 'food',
        component: 'Food'
    },
    {
        title: '分类管理',
        icon: 'Tickets',
        path: 'category',
        component: 'Category'
    },
    {
        title: '用户评价',
        icon:'Star',
        path: 'review',
        component: 'Review'
    }
]
const NORMAL_MENU = [
    {
        title: '个人信息',
        icon: 'HomeFilled',
        path: 'info',
        component: 'Info'
    },
    {
        title: '历史评价',
        icon: 'Menu',
        path: 'review',
        component: 'Review'
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
            return '/dashboard'
        case 'normal':
            return '/'
        case 'merchant':
            switch (status) {
                case 0:
                    return '/dashboard'
                case 1:
                    return '/apply'
                case 4:
                    return '/apply'
                case 5:
                    return '/apply'
                default:
                    return '/'
            }
        default:
            return '/'
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
    const path = getPagePathByRole(role, status)
    const route = getSidebar(role, permission)
    return { path: path, route: route }
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