const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

//create schema
const unplannedModel = new Schema({
  

    key_activities: {
    type: String,
    required: true
  },
    team_member: {
        type: String,
        required: false
    },
   
    
    project: {
        type: String,
        required: true
      },
    week:{
        type:String,
        required:true
      }
    
   }, {timestamps: true}
) 


//create model
const Unplanned = new mongoose.model('Unplanned', unplannedModel);

//export the model
module.exports = Unplanned;