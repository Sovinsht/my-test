const express = require('express');
const router = express.Router();
const Register = require('../model/user');
const Activity = require('../model/activity');
const Project = require('../model/project');
//var activityController= require('../controllers/fetch_data');
const ActivityData = Activity.find({});
const ProjectData = Project.find({status:'Enable'});
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { post } = require('../app');
// const ExcelJs = require('exceljs');
require('core-js/modules/es.promise');
require('core-js/modules/es.string.includes');
require('core-js/modules/es.object.assign');
require('core-js/modules/es.object.keys');
require('core-js/modules/es.symbol');
require('core-js/modules/es.symbol.async-iterator');
require('regenerator-runtime/runtime');
const ExcelJs = require('exceljs/dist/es5');
const moment = require('moment');


require('dotenv').config();
require('../app');
//const alert = require('alert')

//Auth route here


//ROute home
router.get('/', function(req,res) {
  res.render('home');
})




//Route: auth/signin
router.get('/signin', function(req, res) {
  res.render('signin');
});

router.post('/signin', async(req,res) =>{
 try{
   const email = req.body.email;
   const password = req.body.password;

    const useremail = await Register.findOne({email:email});
    const isMatch = await bcrypt.compare(password, useremail.password)
    if(isMatch){
      
      res.redirect('/index');
     

    }else{
      res.send("Incorrect password Details");
    }

 }catch(error) {
   res.status(400).send("Invalid Login Details");
 }
});



//Route: auth/register
router.get('/register', function(req, res) {
  res.render('register');
});

router.post('/register', async(req, res) =>{
  try{
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;

    if(password === cpassword){
      const registerUser = new Register({
        name: req.body.name,
        email: req.body.email,
        password: password,       
        confirmpassword: cpassword
      })

      

      const registered = await registerUser.save();
     
    //   console.log("the success part:" + registerUser);
    
      res.redirect('/signin')
    }else {
      req.flash("Incorrect Password");
    }
  

  } catch(error){
    //console.log(`error on token`);
      res.status(400).send(error);
      
  }
})

//Route: auth/forget-password
router.get('/forgetpassword', function(req, res, next ){
 res.render('forgetpassword')
})

// post forgetpassword

router.post('/forgetpassword', function(req, res, next){
  async.waterfall([
    function(done){
      crypto.randomBytes(20, function(err, buf){
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done){
      Register.findOne({email:req.body.email}, function(err, user){
        if(!user){
          console.log('email invalid');
          req.flash('error', 'User with this email does not exist');
          return res.redirect('forgetpassword');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; //1 hr

        user.save(function(err){
          done(err, token, user);
        });
      });
    },
    function(token, user, done){
      
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'broadwaytest44@gmail.com',
            pass: 'Broadwaytest44!'
        }
      });
      var mailOption = {
        to: user.email,
        from: '"Herd International 👻" <sushil.it@herd.org.np>',
        subject: 'Password Reset Link',
        text: 'You are receiving this because you have requested the reset of password' + 
        'Please click on the link or paste the link on your browser to complete the process' + '\n\n' +
        'http://' + req.headers.host + '/resetpassword/' + token + '\n\n' + 
        'If you didnot request this Please ignore this email and your password will not change'
      };
      smtpTransport.sendMail(mailOption, function(err){
        console.log('mail sent');
        req.flash('success', 'An email is sent to' + user.email + 'Kindly follow the instruction');
        done(err, 'done');
      }); 

    }
  ], function(err){
    if(err) return next (err);
    res.redirect('forgetpassword');
  });
});

//resetpassword
router.get('/resetpassword/:token', function(req, res){
  Register.findOne({resetPasswordToken: req.params.token, resetPasswordExpires:{$gte: Date.now()} }, function(err,user) {
  if(!user){
    req.flash('error', 'Password reset token is invalid or expired');
    return res.redirect('forgetpassword');
  }
  res.render('resetpassword', {token: req.params.token});
  });
});

router.post('/resetpassword/:token', function(req, res){
  console.log('reset password entered');
  console.log(req.param.token);
  async.waterfall([
    function(done){
    
      Register.findOne({resetPasswordToken: req.params.token, resetPasswordExpires:{$gt: Date.now()} }, function(err, user) {

        if(!user){
          console.log('Password reset token is invalid or expired');
          req.flash('error', 'Password reset token is invalid or expired');
          return res.redirect('back');
        }

       if(req.body.password === req.body.confirm_password){
         user.setPassword(req.body.password, function(err){
          
           user.resetPasswordToken = undefined;
           user.resetPasswordExpires = undefined;

             user.save(function(err){
             req.signin(user, function(err){
               done(err, user)
             });
           });
         })
        } else {
          console.log('password wrong');
          req.flash('error', 'Password didnot match.');
          return res.render('back');
        }
        });
    },
    function(user, done){
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'broadwaytest44@gmail.com',
            pass: 'Broadwaytest44!'
        }
      });
      var mailOption = {
        to: user.email,
        from: '"Herd International 👻" <noreply@hello.com>',
        subject: 'Your Password has been changed',
        text: 'Hello, \n\n' + 'This is a confirmation that the password of your account' +
        user.email + 'has been changed'
      };
      smtpTransport.sendMail(mailOption, function(err){
        console.log('pasword mail sent');
        req.flash('success', 'Your password has been changed');
        done(err, 'done');
      });
    }
  ], function(err){
        res.redirect('signin');
  });
});


//Route: auth/activity
router.get('/index', function(req, res) {
  ActivityData.exec(function(err, data){
    if(err) throw err;
    res.render('dashboard', {records: data, p_records:data});
  })
  
});

//project
router.get('/project', function(req, res){
  res.render('project')
});

router.post('/project', async(req, res) =>{
  try{
    const projectReport = new Project({
      project: req.body.project,
      status: req.body.status
     
    })

    

    const registered = await projectReport.save();
   
  //   console.log("the success part:" + registerUser);
  
    res.redirect('/project')


  } catch(error){
      console.log(`error on project entry`);
        res.status(400).send(error);

  }
});

//user.edit_activity

// router.get('/edit', function(req, res){
//    ProjectData.exec(function(err, pdata){
//     if(err) throw err;
//     res.render('edit-activity', {p_records: pdata });
//   })
  
  
// });

// //user. delete_activity

// router.get('/delete', function(req, res){

//   res.render("delete");
// });



//user.activity

router.get('/activity', function(req,res){
  ProjectData.exec(function(err, pdata){
    if(err) throw err;
    res.render('activity', {p_records: pdata});
  })
  
})

router.post('/activity', async(req, res) =>{
 try{
  const activityReport = new Activity({
      key_activities: req.body.key_activities,
      project: req.body.project,
      team_member: req.body.team_member,
      activity_completion_status: req.body.activity_completion_status,
      remarks: req.body.remarks
     
         })
         const reported = await activityReport.save();
           
   console.log("the success part:" + activityReport);
    
     res.redirect('index');
   
  

    } catch(error){
     console.log(`error on data entry`);
       res.status(400).send(error);
      
   }
 });

 
 router.get('/generate', async(req, res) => {
   const startDate = moment(req.body.fromDate).startOf('month').toDate();
   console.log(startDate);
   const endDate = moment(req.body.toDate).endOf('month').toDate();
   console.log(endDate);
   try{
     const activities = await Activity.find({created_at: {$gte: startDate, $lte: endDate}});
     const workbook = new ExcelJs.Workbook();
     const worksheet = workbook.addWorksheet('Activity Report');
     worksheet.columns = [
       {header:'S.No.', key:'s_no', width:5},
       {header:'Key Activities', key:'key_activities', width:15},
       {header:'Team Members', key:'team_member', width:15},
       {header:'Project', key:'project', width:10},
       {header:'Activity Completion Status', key:'activity_completion_status', width:25},
       {header:'Remarks', key:'remarks', width:30}
      ];
      let count = 1;
      activities.forEach(activity => {
        (activity).s_no = count;
        worksheet.addRow(activity);
        count += 1;
    });
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = {bold: true};
      });
    const data = await workbook.xlsx.writeFile('activity.xlsx')
       res.send('done');
    

   }catch(err){
     console.log('generate error',err);
     res.status(500).send(err);

   }

 })
 
 

 //logout
 router.get('/logout' ,function(req,res){

  //req.logOut();
  res.redirect('/signin');
  
});

//
// router.get('/', (req, res, next) =>{
//   console.log(req.params.id);
//   Activity.find()
//   .then(result=> {
//     res.status(200).json({
//       activity: result
//     })
//   })
//   .catch(err=>{
//     console.log(err);
//     res.status(500).json({
//       error: err
//     })
//   });

// });

//id
// router.param('/id', (req, res, next, id) =>{
//   console.log(req.params.id);
//   Activity.findById(id, function(err, result){
//     if(err) {
//       res.json(err);
//     }else{
//       req.activityId = result;
//       next();

//       }
//     })   
//   })


//update
// router.get('/edit/:id', (req, res)=> {
//   console.log(req.params.id);
//   Activity.findById(req.params.id, function(err, activity){
//     if(err){
//       console.log(err);

//     } else {
//       console.log(activity);
//       res.redirect('edit-activity', {activities: activity})
//     }

//   });
    
//  });

 router.post('/edit/:id', function(req, res){
   console.log("id"+ req.params.id);
   const mybodydata = {
    key_activities: req.body.key_activities,
    project: req.body.project,
    team_member: req.body.team_member,
    activity_completion_status: req.body.activity_completion_status,
    remarks: req.body.remarks
   }

   Activity.findByIdAndUpdate(req.params.id, mybodydata, function(err){
     if(err){
       res.redirect('edit-activity' + req.params.id);
     } else {
       res.redirect('index');
     }
   })
 })

    router.delete('/report', function(req, res){
        const delete1 = req.body.id
        console.log(delete1)
        
        Activity.findByIdAndRemove({_id: delete1}, 
           function(err, docs){
        if(err) res.json(err);
        else    res.redirect('/index');
        });
        });
     






module.exports =  router


