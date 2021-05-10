const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

//create schema
const weekModel = new Schema({
  
    title: {
        type: String,
        required: true
      },

    fromDate: {
        type: String,
        required: true
    },

    toDate: {
        type: String,
        required: true
    }
    
   }, {timestamps: true}
) 


//create model
const Week = new mongoose.model('Week', weekModel);

//export the model
module.exports = Week;