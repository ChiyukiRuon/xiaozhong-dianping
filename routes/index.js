const express = require('express')
const userRoutes = require('./user')
const merchantRoutes = require('./merchant')
const adminRoutes = require('./admin')

const router = express.Router()

router.use('/user', userRoutes)
router.use('/merchant', merchantRoutes)
router.use('/admin', adminRoutes)

module.exports = router
