const db = require('../utils/db')

/**
 * 获取权限列表
 *
 * @return {Promise<Array>} 权限列表
 * @author ChiyukiRuon
 * */
const getPermissionList = async () => {
    const sql = 'SELECT * FROM permission'
    return await db.query(sql)
}

/**
 * 根据ID获取管理员信息
 *
 * @param {Number} uid 管理员ID
 * @return {Promise<Array>} 管理员信息
 * @author ChiyukiRuon
 * */
const getAdminById = async (uid) => {
    const sql = 'SELECT * FROM user WHERE uid = ? AND role = "admin"'
    return await db.query(sql, [uid])
}

/**
 * 获取管理员列表
 *
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @return {Promise<Array>} 管理员列表
 * @author ChiyukiRuon
 * */
const getAdminList = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = 'SELECT * FROM user WHERE role = "admin" LIMIT ? OFFSET ?'
    return await db.query(sql, [limit, offset])
}

/**
 * 更新管理员信息
 *
 * @param {Object} params 更新的参数
 * @return {Promise<Array>} 更新后的管理员信息
 * @author ChiyukiRuon
 * */
const updateAdmin = async (params) => {
    const {uid, username, password, permission, status, remark} = params

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
    if (permission) {
        fields.push('permission = ?')
        values.push(permission.join('+'))
    }
    if (status) {
        fields.push('status = ?')
        values.push(status)
    }
    if (remark) {
        fields.push('remark = ?')
        values.push(remark)
    }

    const sql = `UPDATE user SET ${fields.join(',')} WHERE uid = ?`
    await db.query(sql, [...values, uid])

    return await getAdminById(uid)
}

/**
 * 新增管理员
 *
 * @param {Object} params 新增的管理员信息
 * @return {Promise<Array>} 新增后的管理员信息
 * @author ChiyukiRuon
 * */
const addAdmin = async (params) => {
    let {username, password, permission, remark} = params

    if (!remark) {
        remark = null
    }

    const sql = 'INSERT INTO user (username, password, role, permission, status, remark) VALUES (?, ?, "admin", ?, 0, ?)'
    const result = await db.query(sql, [username, password, permission.join('+'), remark])

    return await db.query('SELECT * FROM user WHERE uid = ?', [result.insertId])
}

module.exports = {
    getPermissionList,
    getAdminById,
    getAdminList,
    updateAdmin,
    addAdmin
}