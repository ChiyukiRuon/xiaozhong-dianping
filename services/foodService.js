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

    const avgRating = result[0].avgScore

    // 更新 food 表中的评分字段
    const updateSql = 'UPDATE food SET score = ? WHERE id = ?'
    await db.query(updateSql, [avgRating, foodId])
}

module.exports = {
    getFoodById,
    updateFoodScore
}