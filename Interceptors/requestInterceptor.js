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
    }

    /**
     * 获取文件
     *
     * @return {Array}
     * @author ChiyukiRuon
     * */
    req.getFile = function () {
        if (!req.files) {
            return null
        } else {
            if (!req.files.file.length) {
                return [req.files.file]
            } else {
                return req.files.file
            }
        }
    }

    /**
     * 统一请求成功返回格式
     *
     * @param {Object} data 返回的数据
     * @param {String} [message] 提示信息
     * @param {Number} [code] 状态码
     * @return {Object}
     * @author ChiyukiRuon
     * */
    res.ok = function (data, message = 'ok', code = 200) {
        res.json({ code: code, message: message, data: data });
    }

    /**
     * 统一请求失败返回格式
     *
     * @param {String} message 错误信息
     * @param {Number} code 错误码
     * @param {Object} [data] 返回的数据
     * @return {Object}
     * */
    res.error = function (message, code, data = {}) {
        res.status(code).json({ code: code, message: message, data: data });
    }

    next()
}

module.exports = requestInterceptor
