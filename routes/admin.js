const express = require('express')
const router = express.Router()
const authInterceptor = require('../Interceptors/authInterceptor')

// 获取管理员信息
router.get('/info', authInterceptor, (req, res) => {
    res.ok('管理员')
})

module.exports = router