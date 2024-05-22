'use strict'

const mongoose = require('mongoose') // Erase if already required

const { Schema, model, Types } = require('mongoose')

const DOCUMENT_NAME = 'Admin'
const COLLECTION_NAME = 'Admins'

//Declare the Schema of the Mongo model

const adminSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxLength: 150,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    verify: {
      type: Schema.Types.Boolean,
      default: false,
    },
    roles: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
)

//Export the model
module.exports = mongoose.model(DOCUMENT_NAME, adminSchema)
