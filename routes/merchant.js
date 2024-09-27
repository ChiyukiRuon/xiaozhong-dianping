const express = require('express')
const router = express.Router()
const authInterceptor = require('../Interceptors/authInterceptor')
const {renameFile} = require("../utils/formatter");
const {uploadFile} = require("../utils/qiniu");
const {isImageValid} = require("../utils/valid");

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

// 上传用户头像
router.put('/avatar', authInterceptor, async (req, res) => {
    const params = req.getParams()
    const file = req.getFile()

    if (!file) {
        return res.error('未上传文件', 400)
    }
    if (file.length > 1) {
        return res.error('一次只能上传一个文件', 400)
    }
    if (!isImageValid(file[0])) {
        return res.error('仅支持.jpg以及.png格式的图片', 400)
    }
    if (file[0].size > 2 * 1024 * 1024) {
        return res.error('文件大小不能超过2MB', 400)
    }

    const fileName = renameFile(file[0].name)
    const result = await uploadFile(file[0].data, `avatar/${fileName}`)

    if (result.success) {
        return res.ok({ url: result.data.key, size: result.data.fsize })
    } else {
        return res.error('上传失败', 500)
    }
})

module.exports = router
