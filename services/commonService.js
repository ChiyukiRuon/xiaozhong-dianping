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

module.exports = {
    getRegionList
}