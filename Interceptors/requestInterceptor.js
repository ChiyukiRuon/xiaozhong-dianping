const logger = require('../utils/logger')

const requestInterceptor = (req, res, next) => {
    logger.info(`METHOD: ${req.method}; PATH: ${req.path}`)

    /**
     * 获取请求参数和路径
     *
     * @return {Object}
     * @author ChiyukiRuon
     * */
    req.getParams = function () {
        return { ...req.query, ...req.body, ...req.params }
    };

    /**
     * 统一请求成功返回格式
     *
     * @param {Object} data 返回的数据
     * @param {String} message 提示信息
     * @param {Number} code 状态码
     * @return {Object}
     * @author ChiyukiRuon
     * */
    res.ok = function (data, message = 'ok', code = 200) {
        res.json({ code: 200, message: message, data: data });
    }

    /**
     * 统一请求失败返回格式
     *
     * @param {String} message 错误信息
     * @param {Number} code 错误码
     * @return {Object}
     * */
    res.error = function (message, code = 0) {
        res.status(code).json({ code: code, message: message });
    }

    next()
}

module.exports = requestInterceptor
