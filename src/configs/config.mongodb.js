'use strict'

const dev = {
  app: {
    port: process.env.dev_app_port || 3052,
  },
  db: {
    host: process.env.dev_db_host || 'localhost',
    port: process.env.DEV_DB_PORT || 27017,
    name: process.env.DEV_DB_NAME || 'nodeShop',
  },
}

const pro = {
  app: {
    port: process.env.PRO_APP_PORT || 3053,
  },
  db: {
    host: process.env.PRO_DB_HOST || 'localhost',
    port: process.env.PRO_DB_PORT || 27017,
    name: process.env.PRO_DB_NAME || 'NodeShopPRO',
  },
}

const config = { dev, pro }

const env = process.env.NODE_ENV || 'dev'

module.exports = config[env]
