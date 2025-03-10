const db = require('../utils/db')
const logger = require("../utils/logger");
const {pool} = require("../utils/db");

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
 * @param {String} username 搜索关键词
 * @param {String} nickname 搜索关键词
 * @param {String} detail 搜索关键词
 * @return {Promise<{list: Array, total: Number}>} 包含未审核用户列表和总条数
 * @author ChiyukiRuon
 * */
const getUnverifiedUserList = async (page = 1, limit = 10, username = '', nickname = '', detail = '') => {
    const offset = (page - 1) * limit

    const baseQuery = `
        FROM verification v
        LEFT JOIN user u ON u.uid = v.source_id
        WHERE v.type = 'user' AND v.status = 2
        ${username ? 'AND u.username LIKE ?' : ''}
        ${nickname ? 'AND u.nickname LIKE ?' : ''}
        ${detail ? 'AND v.detail = ?' : ''}
    `

    const dataQuery = `
        SELECT v.*, v.status AS verifyStatus, v.remark AS verifyRemark, u.*, u.status AS userStatus, u.remark AS userRemark
        ${baseQuery}
        LIMIT ? OFFSET ?
    `

    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
    `

    const params = []
    if (username) {
        params.push(`%${username}%`)
    }
    if (nickname) {
        params.push(`%${nickname}%`)
    }
    if (detail) {
        params.push(detail)
    }

    // 执行查询
    const [data, total] = await Promise.all([
        db.query(dataQuery, [...params, limit, offset]),
        db.query(countQuery, params)
    ])

    return {
        list: data,
        total: total[0].total
    }
}

/**
 * 获取未审核的商家列表
 *
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @param {String} username 搜索关键词
 * @param {String} nickname 搜索关键词
 * @param {String} detail 搜索关键词
 * @return {Promise<{list: Array, total: Number}>} 包含未审核商家列表和总条数
 * @author ChiyukiRuon
 */
const getUnverifiedMerchantList = async (page = 1, limit = 10, username = '', nickname = '', detail = '') => {
    const offset = (page - 1) * limit

    const baseQuery = `
        FROM verification v
        LEFT JOIN user u ON u.uid = v.source_id
        WHERE v.type = 'merchant' AND v.status = 2
        ${username ? 'AND u.username LIKE ?' : ''}
        ${nickname ? 'AND u.nickname LIKE ?' : ''}
        ${detail ? 'AND v.detail = ?' : ''}
    `

    // 查询未审核商家列表
    const dataQuery = `
        SELECT v.*, v.status AS verifyStatus, v.remark AS verifyRemark, u.*, u.status AS userStatus, u.remark AS userRemark
        ${baseQuery}
        LIMIT ? OFFSET ?
    `

    // 查询符合条件的总条数
    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
    `

    const params = []
    if (username) {
        params.push(`%${username}%`)
    }
    if (nickname) {
        params.push(`%${nickname}%`)
    }
    if (detail) {
        params.push(detail)
    }

    // 执行查询
    const [data, total] = await Promise.all([
        db.query(dataQuery, [...params, limit, offset]),
        db.query(countQuery, params)
    ])

    return {
        list: data,
        total: total[0].total
    }
}


/**
 * 获取评论列表
 *
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @param {String} nickname 搜索关键词
 * @param {String} food 搜索关键词
 * @param {String} merchant 搜索关键词
 * @return {Promise<{list: Array, total: Number}>}
 * @author ChiyukiRuon
 * */
const getReviewList = async (page = 1, limit = 10, nickname = '', food = '', merchant = '') => {
    const offset = (page - 1) * limit

    const conditions = []
    const params = []

    if (nickname) {
        conditions.push('(u.nickname LIKE ? AND u.role = "normal")')
        params.push(`%${nickname}%`)
    }

    if (food) {
        conditions.push('(f.name LIKE ?)')
        params.push(`%${food}%`)
    }

    if (merchant) {
        conditions.push('(m.nickname LIKE ? AND m.role = "merchant")')
        params.push(`%${merchant}%`)
    }

    const baseQuery = `
        FROM review r
        LEFT JOIN user u ON r.author_id = u.uid
        LEFT JOIN food f ON r.target_id = f.id
        LEFT JOIN user m ON r.merchant_id = m.uid
    `

    const dataQuery = `
        SELECT r.*,
               u.uid AS user_uid, u.username AS user_username, u.nickname AS user_nickname, u.avatar AS user_avatar,
               m.uid AS merchant_uid, m.username AS merchant_username, m.nickname AS merchant_nickname, m.avatar AS merchant_avatar,
               f.id AS food_id, f.name AS food_name, f.cover AS food_cover
        ${baseQuery}
        WHERE r.status = 0
        ${conditions.length > 0 ? 'AND' : ''} ${conditions.join(' AND ')}
        LIMIT ? OFFSET ?
    `

    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
        WHERE r.status = 0
        ${conditions.length > 0 ? 'AND' : ''} ${conditions.join(' AND ')}
    `

    const [ data, total ] = await Promise.all([
        db.query(dataQuery, [...params, limit, offset]),
        db.query(countQuery, params)
    ])

    const formattedData = data.map(item => {
        const {user_uid, user_username, user_nickname, user_avatar, merchant_uid, merchant_username, merchant_nickname, merchant_avatar, food_id, food_name, food_cover, ...rest} = item
        return {
            ...rest,
            user: {
                uid: user_uid,
                username: user_username,
                nickname: user_nickname,
                avatar: user_avatar
            },
            merchant: {
                uid: merchant_uid,
                username: merchant_username,
                nickname: merchant_nickname,
                avatar: merchant_avatar
            },
            food: {
                id: food_id,
                name: food_name,
                cover: food_cover
            }
        }
    })

    return {
        list: formattedData,
        total: total[0].total
    }
}

/**
 * 获取上架的美食列表
 *
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @param {String} food 搜索关键词
 * @param {String} merchant 搜索关键词
 * @return {Promise<{list: Array, total: Number}>}
 * @author ChiyukiRuon
 */
const getFoodList = async (page = 1, limit = 10, food = '', merchant = '') => {
    const offset = (page - 1) * limit

    const conditions = ['f.status = 1']
    const params = []

    if (merchant) {
        conditions.push('(u.nickname LIKE ?)')
        params.push(`%${merchant}%`)
    }
    if (food) {
        conditions.push('(f.name LIKE ?)')
        params.push(`%${food}%`)
    }

    const baseQuery = `
        FROM food f
        LEFT JOIN user u ON f.merchant = u.uid
    `

    const dataQuery = `
        SELECT f.*, 
               u.uid AS merchant_uid, u.username AS merchant_username, u.nickname AS merchant_nickname, u.avatar AS merchant_avatar
        ${baseQuery}
        WHERE ${conditions.join(' AND ')}
        LIMIT ? OFFSET ?
    `

    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
        WHERE ${conditions.join(' AND ')}
    `

    const [data, total] = await Promise.all([
        db.query(dataQuery, [...params, limit, offset]),
        db.query(countQuery, params)
    ])

    const formattedData = data.map(item => {
        const {merchant_uid, merchant_username, merchant_nickname, merchant_avatar, category, status, ...rest} = item
        return {
            ...rest,
            merchant: {
                uid: merchant_uid,
                username: merchant_username,
                nickname: merchant_nickname,
                avatar: merchant_avatar
            }
        }
    })

    return {
        list: formattedData,
        total: total[0].total
    }
}


/**
 * 根据记录ID获取未审核信息
 *
 * @param {Number} id 记录ID
 * @param {String} type 类型。user为用户，merchant为商家
 * @return {Promise<Array>} 未审核用户信息
 * @author ChiyukiRuon
 * */
const getUnverifiedUserById = async (id, type) => {
    const sql = `
        SELECT v.*, u.uid, u.username, u.nickname, u.avatar, u.intro, u.role, u.address, u.annex, u.email, u.status AS userStatus, u.remark AS userRemark
        FROM verification v
        LEFT JOIN user u ON u.uid = v.source_id
        WHERE v.type = ? AND v.status = 2 AND v.id = ?
    `
    return await db.query(sql, [type, id])
}

/**
 * 审核用户
 *
 * @param {Number} id 记录ID
 * @param {Number} approve 审核状态, 0为通过，3为拒绝
 * @return {Promise<void>}
 * @author ChiyukiRuon
 * */
const verifyUser = async (id, approve) => {
    const sql = `UPDATE verification SET status = ? WHERE id = ?`

    return await db.query(sql, [approve, id])
}

/**
 * 审核商家
 *
 * @param {Number} id 记录ID
 * @param {Number} approve 审核状态, 0为通过，3为拒绝
 * @param {Object} info 更新的信息
 * @return {Promise<boolean>}
 * @author ChiyukiRuon
 * */
const verifyMerchant = async (id, approve, info) => {
    const connection = await pool.getConnection()
    const {
        uid,
        nickname,
        avatar,
        intro,
        status,
    } = info
    const fields = []
    const values = []

    if (!uid) return false
    if (approve === 3) {
        try {
            await connection.beginTransaction()

            const sql1 = 'UPDATE user SET status = 5 WHERE uid = ?'
            await connection.query(sql1, [uid])

            const sql2 = 'UPDATE verification SET status = 3 WHERE source_id = ? AND type = "merchant"'
            await connection.query(sql2, [uid])

            await connection.commit()
            return true
        } catch (error) {
            logger.error('Transaction failed:', error)
            await connection.rollback()
            return false
        } finally {
            connection.release()
        }
    } else {
        if (nickname) {
            fields.push('nickname = ?')
            values.push(nickname)
        }
        if (avatar) {
            fields.push('avatar = ?')
            values.push(avatar)
        }
        if (intro) {
            fields.push('intro = ?')
            values.push(intro)
        }
        if (status === 0 || status === 1) {
            fields.push('status = ?')
            values.push(status)
        }

        try {
            await connection.beginTransaction()

            const sql1 = `UPDATE user SET ${fields.join(', ')} WHERE uid = ?`
            await connection.query(sql1, [...values, uid])

            const sql2 = 'UPDATE verification SET status = 0 WHERE source_id = ? AND type = "merchant"'
            await connection.query(sql2, [uid])

            await connection.commit()
            return true
        } catch (error) {
            logger.error('Transaction failed:', error)
            await connection.rollback()
            return false
        } finally {
            connection.release()
        }
    }
}

/**
 * 封禁用户
 *
 * @param {Number} uid 用户ID
 * @param {String} type 用户类型,user or merchant
 * @return {Promise<boolean>} 封禁结果
 * @author ChiyukiRuon
 * */
const banUser = async (uid, type) => {
    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const sql1 = 'UPDATE user SET status = 2 WHERE uid = ?'
        await connection.query(sql1, [uid])

        const sql2 = 'UPDATE verification SET status = 3 WHERE source_id = ? AND type = ?'
        await connection.query(sql2, [uid, type])

        await connection.commit()
        return true
    } catch (error) {
        logger.error('Transaction failed:', error)
        await connection.rollback()
        return false
    } finally {
        connection.release()
    }
}

/**
 * 删除评价
 *
 * @param {Number} id 评价ID
 * @param {String} remark 删除原因
 * @return {Promise<boolean>} 删除结果
 * @author ChiyukiRuon
 * */
const deleteReviewById = async (id, remark) => {
    const sql = 'UPDATE review SET status = 2, remark = ? WHERE id = ?'
    return await db.query(sql, [remark, id])
}

/**
 * 下架商品
 *
 * @param {Number} id 商品ID
 * @param {String} remark 下架原因
 * @return {Promise<boolean>} 下架结果
 * @author ChiyukiRuon
 * */
const deleteFoodById = async (id, remark) => {
    const sql = 'UPDATE food SET status = 0, remark = ? WHERE id = ?'
    return await db.query(sql, [remark, id])
}

module.exports = {
    getPermissionList,
    getAdminById,
    getAdminList,
    updateAdmin,
    addAdmin,
    getUnverifiedUserList,
    getUnverifiedMerchantList,
    getReviewList,
    getFoodList,
    getUnverifiedUserById,
    verifyUser,
    verifyMerchant,
    banUser,
    deleteReviewById,
    deleteFoodById
}