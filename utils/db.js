const mysql = require('mysql2/promise')
const logger = require('./logger')

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 200,
    queueLimit: 0
}

// 创建连接池
const pool = mysql.createPool(dbConfig)

/**
 * 执行SQL查询
 *
 * @param {string} sql SQL查询语句
 * @param {Array} params 查询参数数组
 * @returns {Promise} 查询结果
 * @author ChiyukiRuon
 * */
const query = async (sql, params = []) => {
    try {
        const [results, ] = await pool.execute(sql, params)
        return results
    } catch (error) {
        console.error(error)
        logger.error('数据库查询失败:', error)
        throw error
    }
}

module.exports = {
    query,
    pool
}
