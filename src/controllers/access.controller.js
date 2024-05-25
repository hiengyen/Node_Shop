'use strict'

const AccessService = require('../services/access.service')

const { OK, CREATED, SuccessResponse } = require('../core/success.response')
class AccessController {
  handlerRefreshToken = async (req, res, next) => {
    //version2 , no need access token
    new SuccessResponse({
      message: 'Get token success!',
      metadata: await AccessService.handleRefreshTokenV2({
        refreshToken: req.refreshToken,
        user: req.user,
        keyStore: req.keyStore,
      }),
    }).send(res)
  }

  logout = async (req, res, next) => {
    new SuccessResponse({
      message: 'Logout Success!',
      metadata: await AccessService.logoutAdmin(req.keyStore),
    }).send(res)
  }

  login = async (req, res, next) => {
    new SuccessResponse({
      message: 'Login Success!',
      metadata: await AccessService.loginAdmin(req.body),
    }).send(res)
  }

  signUp = async (req, res, next) => {
    // return res.status(201).json(await AccessService.signUp(req.body))

    new CREATED({
      message: 'Registered OK!',
      metadata: await AccessService.signUpAdmin(req.body),
      options: {
        limit: 10,
      },
    }).send(res)
  }
}
module.exports = new AccessController()
