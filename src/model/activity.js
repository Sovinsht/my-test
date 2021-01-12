const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

//create schema
const activityModel = new Schema({
    key_activities: {
    type: String,
    required: true
  },
    team_member: {
        type: String,
        required: false
    },
    activity_completion_status: {
        type: String,
        required: true
    },
    remarks: {
      type: String,
      required: false
    },
    project: {
        type: String,
        required: true
      }
    
   }, {timestamps: true}
) 


//create model
const Activity = new mongoose.model('Activity', activityModel);

//export the model
module.exports = Activity;