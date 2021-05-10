const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

//create schema
const projectModel = new Schema({
  
  
    project: {
        type: String,
        required: true
      },

    status: {
        type: String,
        required: true
    }
    
   }, {timestamps: true}
) 


//create model
const Project = new mongoose.model('Project', projectModel);

//export the model
module.exports = Project;