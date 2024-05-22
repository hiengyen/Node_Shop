'use strict'

const express = require('express')
const accessController = require('../../controllers/access.controller')
const router = express.Router()
const asyncHandler = require('../../middlewares/asyncHandler')
const { authentication, authenticationV2 } = require('../../auth/authUtils')
//sign up
router.post('/shop/signup', asyncHandler(accessController.signUp))
//login
router.post('/shop/login', asyncHandler(accessController.login))

//authentication//
router.use(authenticationV2)

//logout
router.post('/shop/logout', asyncHandler(accessController.logout))

router.post(
  '/shop/handlerRefreshToken',
  asyncHandler(accessController.handlerRefreshToken),
)

module.exports = router
