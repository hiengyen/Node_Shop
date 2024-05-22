'use strict'

const JWT = require('jsonwebtoken')
const asyncHandler = require('../middlewares/asyncHandler')
const { AuthFailureError, NotFoundError } = require('../core/error.response')
const { findByUserId } = require('../services/keyToken.service')
const { keys } = require('lodash')

const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESHTOKEN: 'x-rtoken-id',
}
const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    //sign
    const accessToken = JWT.sign(payload, publicKey, {
      expiresIn: '2 days',
    })

    const refreshToken = JWT.sign(payload, privateKey, {
      expiresIn: '7 days',
    })

    //verify

    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.error(`--> Error verify::`, err)
      } else {
        console.log(`--> Decode verify::`, decode)
      }
    })

    return { accessToken, refreshToken }
  } catch (error) {
    return error
  }
}

const authentication = asyncHandler(async (req, res, next) => {
  //1_check userId missing ???
  const userId = req.headers[HEADER.CLIENT_ID]
  if (!userId) throw new AuthFailureError('Invalid Request!')

  //2_get accessTokenSS
  const keyStore = await findByUserId(userId)
  if (!keyStore) throw new NotFoundError('keyStore not found!')

  //3_verifyToken
  const accessToken = req.headers[HEADER.AUTHORIZATION]
  if (!accessToken) throw new NotFoundError('Invalid Request!')

  try {
    //4_check user in dbs
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
    //5_check keyStore with this userId
    if (userId !== decodeUser.userId)
      throw new AuthFailureError('Invalid userId!')
    req.keyStore = keyStore
    //6_ done -> return next()
    return next()
  } catch (error) {
    throw error
  }
})

const authenticationV2 = asyncHandler(async (req, res, next) => {
  //1_check userId missing ???
  const userId = req.headers[HEADER.CLIENT_ID]
  if (!userId) throw new AuthFailureError('Invalid Request!')

  //2_get accessTokenSS
  const keyStore = await findByUserId(userId)
  if (!keyStore) throw new NotFoundError('keyStore not found!')

  //3_verifyToken
  if (req.headers[HEADER.REFRESHTOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN]
      const decodeUser = JWT.verify(refreshToken, keyStore.privateKey)
      if (userId !== decodeUser.userId)
        throw new AuthFailureError('Invalid userId!')
      req.keyStore = keyStore
      req.user = decodeUser
      req.refreshToken = refreshToken
      return next()
    } catch (error) {
      throw error
    }
  }
  const accessToken = req.headers[HEADER.AUTHORIZATION]
  if (!accessToken) throw new NotFoundError('Invalid Request!')

  try {
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
    if (userId !== decodeUser.userId)
      throw new AuthFailureError('Invalid userId!')
    req.keyStore = keyStore
    req.user = decodeUser
    return next()
  } catch (error) {
    throw error
  }
})

const verifyJWT = async (token, keySecret) => {
  return await JWT.verify(token, keySecret)
}

module.exports = {
  createTokenPair,
  authentication,
  authenticationV2,
  verifyJWT,
}
