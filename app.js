require('dotenv').config()
const compression = require('compression')
const express = require('express')
const { default: helmet } = require('helmet')
const morgan = require('morgan')
const app = express()
// console.log(`Process:: `, process.env);

//init middleware
app.use(morgan('dev'))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
  }),
)

//init db
require(`./src/dbs/init.mongodb.js`)

const { checkOverload } = require('./src/dbs/checkConnect.js')
//checkOverload()

//init router
app.use('/', require('./src/routes/index.js'))

//handle not found error
app.use((req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})

//errorHandler middleware
app.use((error, req, res, next) => {
  const statusCode = error.status || 500
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    // stack: error.stack, // display bug location
    message: error.message || 'Internal Server Error',
  })
})

module.exports = app
