'use strict'

const mongoose = require('mongoose')

const {
  db: { host, port, name },
} = require('../configs/config.mongodb')

const connectString = `mongodb://${host}:${port}/${name}`
console.log(`connect string: `, connectString)

const { countConnect } = require('./checkConnect')
class Database {
  constructor() {
    this.connect()
  }
  //Connecting
  connect(type = 'mongodb') {
    //used to set dev environment don't affect to code
    if (1 === 1) {
      mongoose.set('debug', true)
      mongoose.set('debug', { color: true })
    }

    mongoose
      .connect(connectString, { maxPoolSize: 50 })
      .then(_ => console.log(`Connect Mongodb Success Pro`, countConnect()))
      .catch(err => console.log(`Error Connect!`))
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }
}

const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb
//using singleton pattern only one instance of Database is created throughout the application, following the Singleton pattern
