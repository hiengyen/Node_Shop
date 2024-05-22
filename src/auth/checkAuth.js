'use strict'

const { findById } = require('../services/apiKey.service')

const HEADER = {
  API_KEY: 'x-api-key',
  AUTHORIZATION: 'authorization',
}
const apiKey = async (req, res, next) => {
  try {
    //check apiKey
    const key = req.headers[HEADER.API_KEY]?.toString() //check using optional chaining ?.

    if (!key) {
      return res.status(403).json({
        message: 'Forbidden Error(API key missing in headers)',
      })
    }

    //check objKey
    const objKey = await findById(key)

    if (!objKey) {
      return res.status(403).json({
        message: 'Forbidden Error (Invalid API key)',
      })
    }

    req.objKey = objKey
    return next()
  } catch (error) {
    console.error('Error in apiKey middlewares: ', error)
    return res.status(500).json({
      message: 'Internal Server Error',
    })
  }
}
// this code below using closure
const permission = permission => {
  return (req, res, next) => {
    if (!req.objKey.permissions) {
      return res.status(403).json({
        message: ' Permission Denied!',
      })
    }
    console.log('permissions::', req.objKey.permissions)

    const validPermission = req.objKey.permissions.includes(permission)
    if (!validPermission) {
      return res.status(403).json({
        message: ' Permission Denied!',
      })
    }

    return next()
  }
}

module.exports = {
  apiKey,
  permission,
}
