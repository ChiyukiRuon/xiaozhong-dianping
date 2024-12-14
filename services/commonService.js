const db = require('../utils/db')

/**
 * 获取地区列表
 *
 * @param preCode 上级地区编码
 * @return Promise<Array>
 * @author ChiyukiRuon
 * */
const getRegionList = async (preCode = 0) => {
    const sql = `SELECT * FROM regions WHERE p_code = ?`
    return await db.query(sql, [preCode])
}

/**
 * 获取首页美食
 *
 * @param {Number} page 页码
 * @param {Number} limit 每页条数
 * @return {Promise<{ list: Array, total: Number }>}
 * */
const getIndex = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = `SELECT * FROM food WHERE status = 1 ORDER BY RAND() LIMIT ?,?`
    const totalSql = `SELECT COUNT(*) as total FROM food WHERE status = 1`
    const [list, total] = await Promise.all([
        db.query(sql, [offset, limit]),
        db.query(totalSql)
    ])
    return {
        list: list.map(({ status, score, ...item }) => (
            {
                score: parseFloat(score),
                ...item
            })
        ),
        total: total[0].total
    }
}

/**
 * 获取排行榜
 *
 * @return {Promise<Array>}
 * @author ChiyukiRuon
 * */
const getRank = async () => {
    const sql = `SELECT * FROM food WHERE status = 1 AND score != 0 ORDER BY score DESC LIMIT 10`
    return await db.query(sql)
}

/**
 * 搜索商家
 *
 * @param {String} term 关键词
 * @param {Number} page 页码
 * @param {Number} limit 每页条数
 * @return {Promise<{ list: Array, total: Number }>}
 * @author ChiyukiRuon
 * */
const searchMerchant = async (term, page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = `SELECT * FROM user WHERE nickname LIKE ? AND role = 'merchant' AND status = 0 LIMIT ?,?`
    const totalSql = `SELECT COUNT(*) as total FROM user WHERE nickname LIKE ? AND role = 'merchant' AND status = 0`
    const [list, total] = await Promise.all([
        db.query(sql, [`%${term}%`, offset, limit]),
        db.query(totalSql, [`%${term}%`])
    ])

    return {
        list: list.map(({ password, permission, status, ...item }) => item),
        total: total[0].total
    }
}

/**
 * 搜索美食
 *
 * @param {String} term 关键词
 * @param {Number} page 页码
 * @param {Number} limit 每页条数
 * @return {Promise<{ list: Array, total: Number }>}
 * @author ChiyukiRuon
 * */
const searchFood = async (term, page = 1, limit = 10) => {
    const offset = (page - 1) * limit

    const sql = `SELECT * FROM food WHERE name LIKE ? AND status = 1 LIMIT ?,?`
    const totalSql = `SELECT COUNT(*) as total FROM food WHERE name LIKE ? AND status = 1`
    const [list, total] = await Promise.all([
        db.query(sql, [`%${term}%`, offset, limit]),
        db.query(totalSql, [`%${term}%`])
    ])

    return {
        list: list.map(({ status, score, ...item }) => (
            {
                score: parseFloat(score),
                ...item
            })
        ),
        total: total[0].total
    }
}

/**
 * 根据美食ID获取美食详情
 *
 * @param {Number} id 美食ID
 * @return {Promise<Object>}
 * @author ChiyukiRuon
 * */
const getFoodById = async (id) => {
    const sql = `
        SELECT 
            f.*, 
            u.uid AS uid, 
            u.nickname AS nickname, 
            u.avatar AS avatar,
            u.intro AS mintro
        FROM 
            food f 
        LEFT JOIN
            user u ON f.merchant = u.uid 
        WHERE 
            f.id = ? AND f.status = 1
    `

    const result = await db.query(sql, [id])

    if (result.length !== 0) {
        const { score, uid, nickname, avatar, mintro, reviewCount, foodCount, ...foodData } = result[0]
        return {
            score: parseFloat(score),
            ...foodData,
            merchant: {
                uid: uid,
                nickname: nickname,
                intro: mintro,
                avatar: avatar,
                reviewCount: reviewCount,
                foodCount: foodCount
            }
        }
    } else {
        return {}
    }
}

/**
 * 根据美食ID获取美食评论及其子评论
 *
 * @param {Number} id 美食ID
 * @return {Promise<Array>} 带有嵌套子评论的评论列表，包含用户信息
 * @author ChiyukiRuon
 */
const getReviewById = async (id) => {
    const sql = `
        SELECT 
            r.*, 
            u.uid AS uid, 
            u.avatar AS avatar, 
            u.username AS username, 
            u.nickname AS nickname
        FROM 
            review r
        LEFT JOIN 
            user u ON r.author_id = u.uid
        WHERE 
            r.target_id = ? AND r.status = 0
    `

    const comments = await db.query(sql, [id])

    const commentMap = {}
    comments.forEach(comment => {
        comment.score = parseFloat(comment.score)
        comment.children = []
        comment.user = {
            uid: comment.uid,
            avatar: comment.avatar,
            username: comment.username,
            nickname: comment.nickname
        }
        delete comment.uid
        delete comment.avatar
        delete comment.username
        delete comment.nickname

        commentMap[comment.id] = comment
    })

    const rootComments = []
    comments.forEach(comment => {
        if (comment.parent_id) {
            const parentComment = commentMap[comment.parent_id]
            if (parentComment) {
                parentComment.children.push(comment)
            }
        } else {
            rootComments.push(comment)
        }
    })

    return rootComments
}



module.exports = {
    getRegionList,
    getIndex,
    getRank,
    searchMerchant,
    searchFood,
    getFoodById,
    getReviewById
}