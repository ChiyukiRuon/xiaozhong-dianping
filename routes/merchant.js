const express = require('express')
const router = express.Router()
const authInterceptor = require('../Interceptors/authInterceptor')

// 商家注册
router.post('/register', (req, res) => {
    // 注册逻辑
    res.ok('注册申请提交成功')
})

// 获取商家信息
router.get('/info', (req, res) => {
    // 获取商户信息逻辑
    res.ok({ id: 1, name: '商户名称' })
})

// 添加食物
router.post('/food', authInterceptor, (req, res) => {
    // 添加食物逻辑
    res.ok('食物添加成功')
})

// 获取食物列表
router.get('/food', (req, res) => {
    // 获取食物列表逻辑
    res.ok([
        { id: 1, name: '食物1' },
        { id: 2, name: '食物2' }
    ])
})

module.exports = router
