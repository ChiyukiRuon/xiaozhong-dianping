const db = require('../utils/db')

const getFoodById = async (id) => {
    return await db.query('SELECT * FROM food WHERE id = ? AND status = 1', [id])
}

/**
 * 更新食品评分
 *
 * @param {Number} foodId 食品ID
 * @return {Promise<void>}
 * @author ChiyukiRuon
 */
const updateFoodScore = async (foodId) => {
    const sql = 'SELECT AVG(score) AS avgScore FROM review WHERE target_id = ? AND status = 0'
    const result = await db.query(sql, [foodId])

    const avgRating = result[0].avgScore?result[0].avgScore:0

    const updateSql = 'UPDATE food SET score = ? WHERE id = ?'
    await db.query(updateSql, [avgRating, foodId])
}

/**
 * @param {Number} uid 商家ID
 * @return {Promise<Array>} 商家所有食品，包含类别信息
 * @author ChiyukiRuon
 * */
const getMerchantAllFood = async (uid) => {
    const query = `
        SELECT f.*, 
               c.category AS categoryName 
        FROM food f
        JOIN category c ON f.category = c.id
        WHERE f.merchant = ? AND f.status = 1
    `

    const result = await db.query(query, [uid])

    return result.map(item => {
        const {score, price, remark, status, ...rest} = item
        return {
            ...rest,
            price: parseFloat(price),
            score: parseFloat(score),
        }
    })
}

module.exports = {
    getFoodById,
    updateFoodScore,
    getMerchantAllFood
}