'use strict'

const bcrypt = require('bcrypt')
const crypto = require('crypto')
const keyTokenService = require('./keyToken.service')
const { createTokenPair, verifyJWT } = require('../auth/authUtils')
const { getInfoData } = require('../../utils/index')
const {
  ConflictRequestError,
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require('../core/error.response')

//Services

const { findByEmail } = require('./admin.service')
const adminModel = require('../models/admin.model')
const RoleShop = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  USER: 'USER',
}

class AccessService {
  static handleRefreshTokenV2 = async ({ keyStore, user, refreshToken }) => {
    const { userId, email } = user
    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await keyTokenService.deleteKeyById(userId)
      throw new ForbiddenError('Something wrong happen!Please login again!')
    }

    if (keyStore.refreshToken !== refreshToken)
      throw new AuthFailureError('Admin not registered!')

    const foundAdmin = await findByEmail({ email })
    if (!foundAdmin) throw new AuthFailureError('Admin not registered!')
    // create a new couple tokens
    const tokens = createTokenPair(
      { userId, email },
      keyStore.publicKey,
      keyStore.privateKey,
    )
    //update tokens
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken, // RT da duoc cap moi
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, // RT da duoc su dung de tao token moi
      },
    })
    return {
      user,
      tokens,
    }
  }
  static handleRefreshToken = async refreshToken => {
    const foundToken =
      await keyTokenService.findByRefreshTokensUsed(refreshToken)
    if (foundToken) {
      //verify to detect who is accessing
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey,
      )
      console.log('[1]--', { userId, email })
      //delete all token into keyStore
      await keyTokenService.deleteKeyById(userId)
      throw new ForbiddenError('Something wrong happen!Please login again!')
    }

    //token is using
    const holderToken = await keyTokenService.findByRefreshToken(refreshToken)
    if (!holderToken) throw new AuthFailureError('Admin not registered 1')

    //verify
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey,
    )
    console.log('[2]--', { userId, email })

    //check userId
    const foundAdmin = await findByEmail({ email })
    if (!foundAdmin) throw new AuthFailureError('Admin not registered 2')

    //create a new couple tokens
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey,
    )

    //update tokens
    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken, // RT da duoc cap moi
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, // RT da duoc su dung de tao token moi
      },
    })
    return {
      user: { userId, email },
      tokens,
    }
  }

  static logout = async keyStore => {
    const delKey = await keyTokenService.removeTokenById(keyStore._id)
    console.log(delKey)
    return delKey
  }

  /*
    1-check email in dbs
    2-match password
    3-created AccessToken vs RefreshToken and save
    4-generate tokens 
    5-get data return login
  */
  static login = async ({ email, password, refreshToken = null }) => {
    //1-check email in dbs
    const foundShop = await findByEmail({ email })
    if (!foundShop) throw new BadRequestError('Shop not registered!')
    //2

    const match = await bcrypt.compare(password, foundShop.password)
    if (!match) throw new AuthFailureError('Authentication error')

    //3-create AT vs RT and save

    const privateKey = crypto.randomBytes(64).toString('hex')
    const publicKey = crypto.randomBytes(64).toString('hex')

    //4 - generate tokens

    const { _id: userId } = foundShop
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey,
    )

    await keyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId,
    })
    return {
      shop: getInfoData({
        fields: ['_id', 'name', 'email'],
        object: foundShop,
      }),
      tokens,
    }
  }

  static signUp = async ({ name, email, password }) => {
    //step1: check email exist??

    const holderAdmin = await adminModel.findOne({ email }).lean() // using lean() after find() speed up query data

    if (holderAdmin) {
      throw new BadRequestError('Error: Admin already registered!')
    }

    const passwordHash = await bcrypt.hash(password, 10) //??? https://www.makeuseof.com/nodejs-bcrypt-hash-verify-salt-password/

    const newAdmin = await adminModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.ADMIN],
    })

    if (newAdmin) {
      //create privateKey , publicKey
      const privateKey = crypto.randomBytes(64).toString('hex')
      const publicKey = crypto.randomBytes(64).toString('hex')

      console.log(privateKey, publicKey) //save collection KeyStore

      const keyStore = await keyTokenService.createKeyToken({
        userId: newAdmin._id,
        publicKey,
        privateKey,
      })

      if (!keyStore) {
        throw new BadRequestError('Error: keyStore Error!')
      }
      //Create token pair

      const tokens = await createTokenPair(
        { userId: newAdmin._id, email },
        publicKey,
        privateKey,
      )
      console.log(`Created Token Success::`, tokens)

      return {
        code: 201,
        metadata: {
          shop: getInfoData({
            object: newAdmin,
            fields: ['_id', 'name', 'email'],
          }),
          tokens,
        },
      }
    }
    return {
      code: 200,
      metadata: null,
    }
    // } catch (err) {
    //   return {
    //     code: 'xxx',
    //     message: err.message,
    //     status: 'error',
    //   }
    // }
  }
}

module.exports = AccessService
