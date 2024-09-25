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

/**
 * 获取未审核的普通用户列表
 *
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @return {Promise<Array>} 未审核的普通用户列表
 * @author ChiyukiRuon
 * */
const getUnverifiedUserList = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = `
        SELECT v.*, u.uid, u.username, u.nickname, u.avatar, u.intro, u.role, u.status AS userStatus, u.remark AS userRemark
        FROM verification v
        LEFT JOIN user u ON u.uid = v.source_id
        WHERE v.type = 'user' AND v.status = 2
        LIMIT ? OFFSET ?
    `
    return await db.query(sql, [limit, offset])
}

/**
 * 获取未审核的商家列表
 *
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @return {Promise<Array>} 未审核的商家列表
 * @author ChiyukiRuon
 * */
const getUnverifiedMerchantList = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = `
        SELECT v.*, u.uid, u.username, u.nickname, u.avatar, u.intro, u.role, u.status, u.remark
        FROM verification v
        LEFT JOIN user u ON u.uid = v.source_id
        WHERE v.type = 'merchant' AND v.status = 2
        LIMIT ? OFFSET ?
    `

    return await db.query(sql, [limit, offset])
}

/**
 * 获取未审核内容列表
 *
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @return {Promise<Array>} 未审核内容列表
 * @author ChiyukiRuon
 * */
const getUnverifiedContentList = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = ``

    return await db.query(sql, [limit, offset])
}

/**
 * 根据记录ID获取未审核用户信息
 *
 * @param {Number} id 记录ID
 * @return {Promise<Array>} 未审核用户信息
 * @author ChiyukiRuon
 * */
const getUnverifiedUserById = async (id) => {
    const sql = `
        SELECT v.*, u.uid, u.username, u.nickname, u.avatar, u.intro, u.role, u.status AS userStatus, u.remark AS userRemark
        FROM verification v
        LEFT JOIN user u ON u.uid = v.source_id
        WHERE v.type = 'user' AND v.status = 2 AND v.id = ?
    `
    return await db.query(sql, [id])
}

/**
 * 审核用户
 *
 * @param {Number} id 记录ID
 * @param {Number} approve 审核状态
 * @return {Promise<Array>} 审核结果
 * @author ChiyukiRuon
 * */
const verifyUser = async (id, approve) => {
    const connection = await db.getConnection()

    try {
        // 开始事务
        await connection.beginTransaction()

        // 更新表1
        const sql1 = 'UPDATE verification SET status = ? WHERE id = ?'
        await connection.query(sql1, [status, id])

        // 更新表2
        const sql2 = 'UPDATE user SET column2 = ? WHERE id = ?'
        await connection.query(sql2, [data.value2, data.id2])

        // 如果两张表都更新成功，提交事务
        await connection.commit()
        console.log('Transaction committed successfully')
    } catch (error) {
        // 如果出错，回滚事务
        await connection.rollback()
        console.error('Transaction rolled back due to error:', error)
    } finally {
        // 关闭连接
        await connection.release()
    }

    return await db.query(sql, [id])
}

module.exports = {
    getPermissionList,
    getAdminById,
    getAdminList,
    updateAdmin,
    addAdmin,
    getUnverifiedUserList,
    getUnverifiedMerchantList,
    getUnverifiedContentList
}