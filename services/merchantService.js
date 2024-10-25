const db = require('../utils/db')
const {pool} = require("../utils/db");
const logger = require("../utils/logger");

/**
 * 根据UID获取商家信息
 *
 * @param {Number} uid 用户ID
 * @return {Promise<Array>} 用户信息
 * @author ChiyukiRuon
 * */
const getMerchantByUid = async (uid) => {
    const sql = 'SELECT * FROM user WHERE uid = ? AND role = "merchant"'
    const result =  await db.query(sql, [uid])

    return result.map(item => {
        const {password, permission, role, status, ...rest} = item
        return {
            ...rest,
        }
    })
}

/**
 * 获取商家美食、分类、评价数
 *
 * @param {Number} merchant 商家ID
 * @return {Promise<{ foodCount: Number, categoryCount: Number, commentCount: Number }>} 商家美食、分类、评价数
 * @author ChiyukiRuon
 * */
const getMerchantStatistic = async (merchant) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM food WHERE merchant = ? AND status = 1) AS food,
            (SELECT COUNT(*) FROM category WHERE merchant = ?) AS category,
            (SELECT COUNT(*) FROM review WHERE merchant_id = ? AND status = 0) AS review
    `
    return await db.query(sql, [merchant, merchant, merchant])
}

/**
 * 获取商家的美食信息
 *
 * @param {Number} merchant 商家ID
 * @param {String} [name] 美食名称
 * @param {Number} [category] 美食分类
 * @param {Number} [status] 美食状态
 * @param {Number} [page] 页数
 * @param {Number} [limit] 每页数量
 * @return {Promise<{ list: Array, total: Number }>} 食品信息列表和总数量
 * @author ChiyukiRuon
 * */
const getMerchantFood = async (merchant, name = '', category = null, status = null, page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const baseQuery = `
        FROM food
        WHERE merchant = ? 
        ${name ? 'AND name LIKE ?' : ''}
        ${category ? 'AND category = ?' : ''}
        ${status ? 'AND status = ?' : ''}
    `

    const dataQuery =`
        SELECT *
        ${baseQuery}
        LIMIT ? OFFSET ?
    `

    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
    `

    let params = []
    if (name) {
        params.push(`%${name}%`)
    }
    if (category) {
        params.push(category)
    }
    if (status) {
        params.push(status)
    }

    const [data, total] = await Promise.all([
        db.query(dataQuery, [merchant, ...params, limit, offset]),
        db.query(countQuery, [merchant, ...params])
    ])

    return {
        list: data,
        total: total[0].total
    }
}

/**
 * 获取商家分类
 *
 * @param {Number} merchant 商家ID
 * @param {Number} [page] 页数
 * @param {Number} [limit] 每页数量
 * @param {String} [name] 分类名称
 * @return {Promise<{ list: Array<{ id: number, name: string, count: number }>, total: number }>} 商家分类
 * @author ChiyukiRuon
 * */
const getMerchantCategory = async (merchant, page = 1, limit = 10, name = '') => {
    const offset = (page - 1) * limit

    const baseQuery = `
        FROM 
            category c
        LEFT JOIN 
            food f ON f.category = c.id AND f.merchant = c.merchant
        WHERE 
            c.merchant = ?
            ${name ? `AND c.category LIKE ?` : ''}
    `
    const dataQuery = `
        SELECT 
            c.id AS id, 
            c.category AS name, 
            COUNT(f.id) AS count
        ${baseQuery}
        GROUP BY 
            c.id
        LIMIT ? OFFSET ?
    `
    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
    `

    let params = []
    if (name) {
        params.push(`%${name}%`)
    }

    const [data, total] = await Promise.all([
        db.query(dataQuery, [merchant, ...params, limit, offset]),
        db.query(countQuery, [merchant, ...params])
    ])
    console.log(data, total)

    return {
        list: data,
        total: total[0].total
    }
}

/**
 * 获取商家评价
 *
 * @param {Number} merchant 商家ID
 * @param {Number} [page] 页数
 * @param {Number} [limit] 每页数量
 * @param {Number} [food] 美食ID
 * @return {Promise<{ list: Array<{ id: number, content: string, score: number, create_time: Date }>, total: number }>} 商家评价
 * */
const getMerchantReview = async (merchant, page = 1, limit = 10, food = '') => {
    const offset = (page - 1) * limit

    const baseQuery = `
        FROM review r
        LEFT JOIN user u ON r.author_id = u.uid
        LEFT JOIN food f ON r.target_id = f.id
        WHERE merchant_id = ? AND r.status = 0
        ${food ? 'AND target_id = ?' : ''}
    `

    const dataQuery = `
        SELECT r.*,
               u.uid AS user_uid, u.username AS user_username, u.nickname AS user_nickname, u.avatar AS user_avatar,
               f.id AS food_id, f.name AS food_name, f.cover AS food_cover
        ${baseQuery}
        LIMIT ? OFFSET ?
    `

    const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
    `

    let params = []
    if (food) {
        params.push(food)
    }

    const [data, total] = await Promise.all([
        db.query(dataQuery, [merchant, ...params, limit, offset]),
        db.query(countQuery, [merchant, ...params])
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
 * 获取商家分类下拉列表
 *
 * @param {Number} merchant 商家ID
 * @return {Promise<Array<{ value: number, label: string }>>} 商家分类下拉列表
 * @author ChiyukiRuon
 * */
const getAllMerchantCategory = async (merchant) => {
    const sql = 'SELECT c.id AS value, c.category AS label FROM category c WHERE merchant = ?'
    return await db.query(sql, [merchant])
}

/**
 * 获取商家美食下拉列表
 *
 * @param {Number} merchant 商家ID
 * @return {Promise<Array<{ value: number, label: string }>>} 商家美食下拉列表
 * @author ChiyukiRuon
 * */
const getAllMerchantFood = async (merchant) => {
    const sql = 'SELECT id AS value, name AS label FROM food WHERE merchant = ?'
    return await db.query(sql, [merchant])
}

/**
 * 注册商家
 *
 * @param {String} username 用户名
 * @param {String} hashedPassword 密码
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const registerMerchant = async (username, hashedPassword) => {
    const sql = 'INSERT INTO user (username, password, role, status) VALUES (?, ?, "merchant", 4)'
    return await db.query(sql, [username, hashedPassword])
}

/**
 * 提交申请商家资料
 *
 * @param {Object} merchantInfo 商家信息
 * @return {Promise<boolean>}
 * @author ChiyukiRuon
 * */
const applyMerchant = async (merchantInfo) => {
    const {uid, nickname, avatar, phone, email, address, annex } = merchantInfo

    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const sql1 = 'UPDATE user SET nickname = ?, avatar = ?, phone = ?, email = ?, address = ?, annex = ? status = 1 WHERE uid = ?'
        await db.query(sql1, [nickname, avatar, phone, email, address, annex, uid])

        const sql2 = 'INSERT INTO verification (type, detail, source_id, status, annex) VALUES ("merchant", "register", ?, 2, ?)'
        await connection.query(sql2, [uid, annex])

        await connection.commit()
        return true
    } catch (error) {
        console.log('Error:', error)
        logger.error('Transaction failed:', error)
        await connection.rollback()
        return false
    } finally {
        connection.release()
    }
}

/**
 * 更新商家信息
 *
 * @param {Object} userInfo 用户信息
 * @param {Number} uid 用户ID
 * @return {Promise<void>}
 * @author ChiyukiRuon
 */
const updateMerchant = async (userInfo, uid) => {
    const {
        username,
        password,
        nickname,
        avatar,
        intro,
        phone,
        email,
        address
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
    if (address) {
        fields.push('address = ?')
        values.push(address)
    }

    if (fields.length === 0) {
        return
    }

    values.push(uid)

    const sql = `UPDATE user SET ${fields.join(', ')} WHERE uid = ?`

    await db.query(sql, values)
}

/**
 * 根据美食ID获取美食信息
 *
 * @param {Number} id 美食ID
 * @param {Number} [uid] 商家ID
 * @return {Promise<Array>} 美食信息
 * @author ChiyukiRuon
 * */
const getFoodById = async (id, uid = null) => {
    let sql = 'SELECT * FROM food WHERE id = ?'

    if (uid) {
        sql += ' AND merchant = ?'
        return await db.query(sql, [id, uid])
    }
    return await db.query(sql, [id])
}

/**
 * 获取同一商家是否有重复美食
 *
 * @param {Number} uid 商家ID
 * @param {String} name 美食名称
 * @return {Promise<Array>} 重复美食信息
 * @author ChiyukiRuon
 * */
const getFoodByMerchantAndName = async (uid, name) => {
    const sql = 'SELECT * FROM food WHERE merchant = ? AND name = ?'
    return await db.query(sql, [uid, name])
}

/**
 * 新增美食
 *
 * @param {Object} foodInfo 美食信息
 * @param {Number} uid 商家ID
 * @return {Promise<Array>} 新增的美食信息
 * @author ChiyukiRuon
 * */
const addFood = async (foodInfo, uid) => {
    const {
        name,
        intro = null,
        cover = 'http://cdn.dianping.chiyukiruon.top/cover/default.jpg',
        category = null,
        price,
        status
    } = foodInfo

    const sql = `INSERT INTO food (merchant, name, intro, cover, category, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    const result = await db.query(sql, [uid, name, intro, cover, category, price, status])
    return await db.query('SELECT * FROM food WHERE id = ?', [result.insertId])
}

/**
 * 编辑美食信息
 *
 * @param {Object} foodInfo 美食信息
 * @param {Number} uid 商家ID
 * @return {Promise<Array>} 编辑后的美食信息
 * @author ChiyukiRuon
 * */
const editFood = async (foodInfo, uid) => {
    const {
        id,
        name,
        intro,
        cover,
        category,
        price,
        status
    } = foodInfo

    console.log(foodInfo)

    let fields = []
    let values = []

    if (name) {
        fields.push('name = ?')
        values.push(name)
    }
    if (intro) {
        fields.push('intro = ?')
        values.push(intro)
    }
    if (cover) {
        fields.push('cover = ?')
        values.push(cover)
    }
    if (category) {
        fields.push('category = ?')
        values.push(category)
    } else if (category === null) {
        fields.push('category = NULL')
    }
    if (price) {
        fields.push('price = ?')
        values.push(price)
    }
    if (status === 0 || status === 1) {
        fields.push('status = ?')
        values.push(status)
    }

    if (fields.length === 0) {
        return []
    }

    const sql = `UPDATE food SET ${fields.join(', ')} WHERE id = ? AND merchant = ?`
    const result = await db.query(sql, [...values, id, uid])

    if (result.affectedRows > 0) {
        return await db.query('SELECT * FROM food WHERE id = ?', [id])
    } else {
        return []
    }
}

/**
 * 根据美食ID删除美食
 *
 * @param {Number} id 美食ID
 * @param {Number} uid 商家ID
 * @return {Promise<Boolean>} 删除结果
 * */
const deleteFood = async (id, uid) => {
    const sql = 'DELETE FROM food WHERE id = ? AND merchant = ?'
    try {
        const result = await db.query(sql, [id, uid])
        return result.affectedRows > 0
    } catch (error) {
        logger.error('Error:', error)
        return false
    }
}

/**
 * 根据美食类别ID获取美食类别信息
 *
 * @param {Number} id 类别ID
 * @param {Number} [uid] 商家ID
 * @return {Promise<Array>} 类别信息
 * @author ChiyukiRuon
 * */
const getCategoryById = async (id, uid = null) => {
    let sql = 'SELECT * FROM category WHERE id = ?'

    if (uid) {
        sql += ' AND merchant = ?'
        return await db.query(sql, [id, uid])
    }

    return await db.query(sql, [id])
}

/**
 * 获取商家的全部类别信息
 *
 * @param {Number} uid 商家ID
 * @return {Promise<Array>} 类别信息
 * */
const getAllCategoryByMerchant = async (uid) => {
    const sql = 'SELECT * FROM category WHERE merchant = ?'
    return await db.query(sql, [uid])
}

/**
 * 获取同一商家是否有重复类别名
 *
 * @param {Number} uid 商家ID
 * @param {String} category 类别名
 * @return {Promise<Array>} 重复类别信息
 * @author ChiyukiRuon
 * */
const getCategoryByMerchantAndCategory = async (uid, category) => {
    const sql = 'SELECT * FROM category WHERE merchant = ? AND category = ?'
    return await db.query(sql, [uid, category])
}

/**
 * 新增美食类别
 *
 * @param {Number} uid 商家ID
 * @param {String} category 类别名
 * @return {Promise<Array>} 新增的类别信息
 * @author ChiyukiRuon
 * */
const addCategory = async (uid, category) => {
    const sql = 'INSERT INTO category (merchant, category) VALUES (?, ?)'
    const result = await db.query(sql, [uid, category])

    return await db.query('SELECT * FROM category WHERE id = ?', [result.insertId])
}

/**
 * 编辑美食类别名
 *
 * @param {Number} id 类别ID
 * @param {String} category 类别名
 * @return {Promise<Array>} 编辑后的类别信息
 * @author ChiyukiRuon
 * */
const editCategory = async (id, category) => {
    const sql = 'UPDATE category SET category = ? WHERE id = ?'
    return await db.query(sql, [category, id])
}

/**
 * 删除美食类别，并将该商户的所有相关美食的类别字段设置为null
 *
 * @param {Number} id 类别ID
 * @param {Number} uid 商家ID
 * @return {Promise<boolean>} 返回删除结果，成功返回true，失败返回false
 * @author ChiyukiRuon
 */
const deleteCategory = async (id, uid) => {
    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const sqlDelete = 'DELETE FROM category WHERE id = ? AND merchant = ?'
        const deleteResult = await connection.query(sqlDelete, [id, uid])

        if (deleteResult[0].affectedRows > 0) {
            const sqlUpdate = 'UPDATE food SET category = NULL WHERE merchant = ? AND category = ?'
            await connection.query(sqlUpdate, [uid, id])

            await connection.commit()
            return true
        } else {
            await connection.rollback()
            return false
        }
    } catch (error) {
        logger.error(`删除类别或更新food表失败:${error}`)
        await connection.rollback()
        return false
    } finally {
        connection.release()
    }
}



module.exports = {
    getMerchantByUid,
    getMerchantStatistic,
    getMerchantFood,
    getMerchantCategory,
    getAllMerchantCategory,
    registerMerchant,
    applyMerchant,
    updateMerchant,
    getFoodById,
    getFoodByMerchantAndName,
    addFood,
    editFood,
    deleteFood,
    getCategoryById,
    getMerchantReview,
    getAllCategoryByMerchant,
    getAllMerchantFood,
    getCategoryByMerchantAndCategory,
    addCategory,
    editCategory,
    deleteCategory
}