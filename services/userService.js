const db = require('../utils/db')

/**
 * 使用用户名或昵称搜索用户信息
 *
 * @param {String} searchTerm 搜索关键词
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @return {Promise<Array>} 查询结果
 * @author ChiyukiRuon
 * */
const searchUsers = async (searchTerm, page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = `
        SELECT uid, username, nickname, avatar, intro FROM user
        WHERE (username LIKE CONCAT('%', ?, '%') OR nickname LIKE CONCAT('%', ?, '%'))
        AND status = 0 AND role = 'normal'
        LIMIT ? OFFSET ?
    `

    return await db.query(sql, [searchTerm, searchTerm, limit, offset])
}


/**
 * 根据用户ID查找用户信息
 *
 * @param {Number} uid 用户ID
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const getUserById = async (uid) => {
    const sql = 'SELECT * FROM user WHERE uid = ?'
    return await db.query(sql, [uid])
}

/**
 * 根据用户名查找用户信息
 *
 * @param {String} username 用户名
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const getUserByUsername = async (username) => {
    const sql = 'SELECT * FROM user WHERE username = ?'
    return await db.query(sql, [username])
}

/**
 * 注册普通用户
 *
 * @param {String} username 用户名
 * @param {String} hashedPassword 加密后的密码
 * @return {Promise<void>}
 * @author ChiyukiRuon
 * */
const registerUser = async (username, hashedPassword) => {
    const sql = 'INSERT INTO user (username, password) VALUES (?, ?)'
    await db.query(sql, [username, hashedPassword])
}

/**
 * 更新用户信息
 *
 * @param {Object} userInfo 用户信息
 * @return {Promise<void>}
 * @author ChiyukiRuon
 */
const updateUser = async (userInfo) => {
    const {
        uid,
        username = '',
        password = '',
        nickname = '',
        avatar = '',
        intro = '',
        phone = '',
        email = ''
    } = userInfo

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
    if (phone) {
        fields.push('phone = ?')
        values.push(phone)
    }
    if (email) {
        fields.push('email = ?')
        values.push(email)
    }

    if (fields.length === 0) {
        return
    }

    values.push(uid)

    const sql = `UPDATE user SET ${fields.join(', ')} WHERE uid = ?`

    await db.query(sql, values)
}

/**
 * 获取评论信息
 *
 * @param {Number} id 评论 ID
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const getReviewById = async (id) => {
    const sql = 'SELECT * FROM review WHERE id = ?'
    return await db.query(sql, [id])
}

/**
 * 获取用户评论列表
 *
 * @param {Number} uid 用户ID
 * @param {Number} page 当前页数，默认为1
 * @param {Number} limit 每页条数，默认为10
 * @return {Promise<{list: Array, total: Number}>}
 * @author ChiyukiRuon
 * */
const getReviewListByUser = async (uid, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const baseQuery = `
        FROM review r
        JOIN food f ON r.target_id = f.id
        JOIN user u ON r.merchant_id = u.uid
        WHERE author_id = ?
    `

    const dataQuery = `
        SELECT r.*, u.uid, u.username, u.nickname, u.avatar, f.id AS targetId, f.name, f.cover, f.score AS foodScore
        ${baseQuery}
        LIMIT ? OFFSET ?
    `

    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
    `

    const [data, total] = await Promise.all([
        db.query(dataQuery, [uid, limit, offset]),
        db.query(countQuery, [uid])
    ])

    const formattedData = data.map(item => {
        const {
            uid,
            username,
            nickname,
            avatar,
            targetId,
            name,
            cover,
            foodScore,
            author_id,
            merchant_id,
            target_id,
            ...rest
        } = item

        return {
            ...rest,
            score: parseFloat(item.score),
            anonymity: parseInt(item.anonymity),
            target: {
                id: targetId,
                name,
                cover,
                score: foodScore
            },
            merchant: {
                uid,
                username,
                nickname,
                avatar
            }
        }
    })

    return {
        list: formattedData,
        total: total[0].total
    }
};

/**
 * 发布评论
 *
 * @param {Object} params 评论信息
 * @return {Promise<Array>} 添加的评论信息
 * @author ChiyukiRuon
 * */
const postReview = async (params) => {
    const { author, content, anonymity = 0, score, parent = null, target, merchant, annex = '' } = params

    const sql = 'INSERT INTO review (author_id, content, parent_id, target_id, merchant_id, score, annex, anonymity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    const result = await db.query(sql, [author, content, parent, target, merchant, score, annex, anonymity])

    return await db.query('SELECT * FROM review WHERE id = ?', [result.insertId])
}

/**
 * 更新评论
 *
 * @param {Object} params 评论信息
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const updateReview = async (params) => {
    const { id, content, anonymity, score, status } = params
    const fields = []
    const values = []

    if (content) {
        fields.push('content = ?')
        values.push(content)
    }
    if (anonymity) {
        fields.push('anonymity = ?')
        values.push(anonymity)
    }
    if (score) {
        fields.push('score = ?')
        values.push(score)
    }
    if (status) {
        fields.push('status = ?')
        values.push(status)
    }

    if (fields.length === 0) {
        return []
    }

    values.push(id)

    const sql = `UPDATE review SET ${fields.join(', ')} WHERE id = ?`
    await db.query(sql, values)

    return await db.query('SELECT * FROM review WHERE id = ?', [params.id])
}

/**
 * 根据ID删除评价
 *
 * @param {Number} id 评价ID
 * @param {Number} uid 用户ID
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const deleteReviewById = async (id, uid) => {
    const sql = 'DELETE FROM review WHERE id = ? AND author_id = ?'
    await db.query(sql, [id, uid])
}


module.exports = {
    searchUsers,
    getUserById,
    getUserByUsername,
    registerUser,
    updateUser,
    getReviewById,
    getReviewListByUser,
    postReview,
    updateReview,
    deleteReviewById
}
