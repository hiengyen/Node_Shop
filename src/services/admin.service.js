'use strict'

const adminModel = require('../models/admin.model')

const findByEmail = async ({
  email,
  select = { email: 1, password: 1, name: 1, status: 1, roles: 1 },
}) => {
  return await adminModel.findOne({ email }).select(select).lean()
}

module.exports = {
  findByEmail,
}
