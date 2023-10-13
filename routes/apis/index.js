const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')

const admin = require('./modules/admin')

const restController = require('../../controllers/apis/restaurant-controller')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')
const { apiErrorHandler } = require('../../middleware/error-handler')
const userController = require('../../controllers/apis/user-controller')

router.use('/admin', authenticated, authenticatedAdmin, admin) // 修改，後台路由加入 authenticated, authenticatedAdmin
router.get('/restaurants', authenticated, restController.getRestaurants) // 修改，前台路由加入 authenticated

router.post('/signup', userController.signUp)

router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)

router.use('/', apiErrorHandler)
module.exports = router
