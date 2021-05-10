const express = require('express');
const router = express.Router();
const Register = require('../model/user');
const Activity = require('../model/activity');
const Unplanned = require('../model/unplanned');
const Project = require('../model/project');
const Week = require('../model/week');
//var activityController= require('../controllers/fetch_data');
const RegisterData = Register.find({});
const ActivityData = Activity.find({});
const UnplannedData = Unplanned.find({});
const ProjectData = Project.find({status:'Enable'});
const ProjectData1 = Project.find({});
const WeekData = Week.find({});
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
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
const { errorMonitor } = require('stream');


require('dotenv').config();
require('../app');
//const alert = require('alert')

//Auth route here


//ROute home
router.get('/', function(req,res) {
  if(req.session.userEmail){
  res.render('index');
  } else{
    res.render('register');
  }
})




//Route: auth/signin
router.get('/signin', function(req, res) {
  res.render('signin');
});

router.get('/employee', function(req, res) {
  res.render('Employee-Detail');
});


//Route: auth/week
router.get('/week', function(req, res){
  WeekData.exec(function(err, wdata){
    if(err) throw err;
  res.render('week',{w_records:wdata})
})
});

router.post('/signin', async(req,res) =>{
 try{
   const email = req.body.email;
   const password = req.body.password;

    const useremail = await Register.findOne({email:email});
    const isMatch = await bcrypt.compare(password, useremail.password)

    if(isMatch){
      req.session.userEmail=email;
      res.redirect('/index');
     

    }else{
      res.render('signin',{msg:"Incorrect password Details"});
      // res.send("Incorrect password Details");
    }

 }catch(error) {
   res.status(400).send("Invalid Login Details");
 }
});



//Route: auth/register
router.get('/register', function(req, res) {
  if(req.session.userEmail){
    res.redirect('./index');
  } else{
  res.render('register');
  }
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
        confirmpassword: cpassword,
        role: req.body.role
      })

      

      const registered = await registerUser.save();
     
    //   console.log("the success part:" + registerUser);
    
      res.redirect('/user')
    }else {
      req.flash("error_msg","Incorrect Password");
    }
  

  } catch(error){
    console.log('erroor',error);
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
    ProjectData1.exec(function(err, pdata){
      if(err) throw err;
      RegisterData.exec(function(err, rdata){
        if(err) throw err;
        console.log(rdata);
       WeekData.exec(function(err, wdata){
          console.log(wdata);
          if(err) throw err;
        
        res.render('dashboard', {records: data, p_records: pdata, r_records: rdata, w_records: wdata});
      
      });
    });
  });


    //console.log(data)
    
  })
  
});

//project
router.get('/project', function(req, res){
  ProjectData1.exec(function(err, pdata){
    if(err) throw err;
  res.render('project',{p_records: pdata})
  });
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

//week

router.post('/week', async(req, res) =>{
  try{
    const weekReport = new Week({
      title: req.body.title,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate
     
    })

    

    const registered = await weekReport.save();
   
  //   console.log("the success part:" + registerUser);
  
    res.redirect('/week')


  } catch(error){
      console.log(`error on week entry`);
        res.status(400).send(error);

  }
});

//user.edit_activity

router.get('/editA/:id', function(req, res){
  
   ProjectData.exec(function(err, pdata){

    if(err) throw err;
    ActivityData.exec(function(err, data){
      if(err) throw err;
    Activity.findById(req.params.id, function(err, activity){
      if(err){
        console.log(err);
  
      } else {
        console.log(activity);
        res.render('edit-activity', {records:data, activities: activity, p_records: pdata})
      }
    });
    });
    
  })
   
});

//post
router.post('/editA/:id', function(req, res){
  console.log("id "+ req.params.id);
  
  const mybodydata = {
   key_activities: req.body.key_activities,
   project: req.body.project,
   team_member: req.body.team_member,
   activity_completion_status: req.body.activity_completion_status,
   remarks: req.body.remarks
  }
  console.log(mybodydata);
  const id = mongoose.Types.ObjectId(req.params.id);
  console.log("1" + id);
  console.log("2" + req.params.id)
  
  Activity.findById(req.params.id, function(err, activity){
    if(err){
      console.log(err);

    } else {
      console.log(activity);

      activity.key_activities = req.body.key_activities,
      activity.project= req.body.project,
      activity.team_member= req.body.team_member,
      activity.activity_completion_status= req.body.activity_completion_status,
      activity.extended_deadline = req.body.extended_deadline,
      activity.remarks= req.body.remarks
      activity.save().then(()=> {
        res.redirect('/activity');// Success!
      }, reason => {
        res.redirect('/editA/:id ' + req.params.id); // Error!
      });

      
    }

  });
//  Activity.findOneAndUpdate({_id: id}, mybodydata, function(err){
//      if(err){
//        console.log(err);
//        res.redirect('/editA/:id ' + req.params.id);
//    } else {
//      res.render('index');
//     }
//   })
})

//user.edit_activity_B

router.get('/editB/:id', function(req, res){
  
  ProjectData.exec(function(err, pdata){

   if(err) throw err;
   Activity.findById(req.params.id, function(err, activity){
     if(err){
       console.log(err);
 
     } else {
       console.log(activity);
       res.render('edit-activity B', {activities: activity, p_records: pdata})
     }
 
   });
   
 })
  
});

//post
router.post('/editB/:id', function(req, res){
 console.log("id "+ req.params.id);
 
 const mybodydata = {
  key_activities: req.body.key_activities,
  project: req.body.project,
  team_member: req.body.team_member,
  activity_completion_status: req.body.activity_completion_status,
  remarks: req.body.remarks
 }
 console.log(mybodydata);
 const id = mongoose.Types.ObjectId(req.params.id);
 console.log("1" + id);
 console.log("2" + req.params.id)
 
 Activity.findById(req.params.id, function(err, activity){
   if(err){
     console.log(err);

   } else {
     console.log(activity);

    //  activity.key_activities = req.body.key_activities,
    //  activity.project= req.body.project,
    //  activity.team_member= req.body.team_member,
     activity.activity_completion_status= req.body.activity_completion_status,

    //  activity.remarks= req.body.remarks
     activity.save().then(()=> {
       res.redirect('/index');// Success!
     }, reason => {
       res.redirect('/editB/:id ' + req.params.id); // Error!
     });

     
   }

 });

});


//edit project

router.get('/editP/:id', function(req, res){
  ProjectData1.exec(function(err, pdata){
    if(err) throw err;
  Project.findById(req.params.id, function(err, project){

   if(err) throw err;
    else {
       console.log(pdata);
       res.render('edit-project', {p_records: pdata, projects:project})
     }
 
    });
   
 });
 
 
 
});

router.post('/editP/:id', function(req, res){
  console.log("id "+ req.params.id);
  
  const myprojectdata = {
   
   project: req.body.project,
   status: req.body.status
  }
  console.log(myprojectdata);
  const id = mongoose.Types.ObjectId(req.params.id);
  console.log("1" + id);
  console.log("2" + req.params.id)
  
  Project.findById(req.params.id, function(err, project){
    if(err){
      console.log(err);

    } else {
      console.log(project);

      project.project= req.body.project,
      project.status= req.body.status
      
      project.save().then(()=> {
        res.redirect('/project');// Success!
      }, reason => {
        res.redirect('/editP/:id ' + req.params.id); // Error!
      });

      
    }

  });
//  Activity.findOneAndUpdate({_id: id}, mybodydata, function(err){
//      if(err){
//        console.log(err);
//        res.redirect('/editA/:id ' + req.params.id);
//    } else {
//      res.render('index');
//     }
//   })
})


//week


router.get('/editW/:id', function(req, res){
  WeekData.exec(function(err, wdata){
    if(err) throw err;
  Week.findById(req.params.id, function(err, week){

   if(err) throw err;
    else {
       console.log(week);
       res.render('edit-week', {w_records: wdata, weeks:week})
     }
 
    });
   
 });
 
 
 
});

router.post('/editW/:id', function(req, res){
  console.log("id "+ req.params.id);
  
  const myprojectdata = {
   
    title: req.body.title,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate
  }
  console.log(myprojectdata);
  const id = mongoose.Types.ObjectId(req.params.id);
  console.log("1" + id);
  console.log("2" + req.params.id)
  
  Week.findById(req.params.id, function(err, week){
    if(err){
      console.log(err);

    } else {
      console.log(week);

      week.title= req.body.title,
      week.fromDate= req.body.fromDate,
      week.toDate= req.body.toDate
      
      week.save().then(()=> {
        res.redirect('/week');// Success!
      }, reason => {
        res.redirect('/editW/:id ' + req.params.id); // Error!
      });

      
    }

  });
//  Activity.findOneAndUpdate({_id: id}, mybodydata, function(err){
//      if(err){
//        console.log(err);
//        res.redirect('/editA/:id ' + req.params.id);
//    } else {
//      res.render('index');
//     }
//   })
})


//plan

router.get('/editPlan/:id', function(req, res){
  
  ProjectData.exec(function(err, pdata){

    ActivityData.exec(function(err, data){
      if(err) throw err;
    ProjectData.exec(function(err, pdata){
      if(err) throw err;
      WeekData.exec(function(err, wdata){
        if(err) throw err;
        Activity.findById(req.params.id, function(err, plan){
          if(err){
            console.log(err);
      
          } else {
            console.log(plan);
            res.render('edit-plan', {p_records: pdata,records: data, w_records: wdata, plans:plan})
          }
        });  
        })
    })
  })
  }) 
   
});
  


//post
router.post('/editPlan/:id', function(req, res){
 console.log("id "+ req.params.id);
 
 const mybodydata = {
  key_activities: req.body.key_activities,
  project: req.body.project,
  team_member: req.body.team_member,
  week: req.body.week
 
 }
 console.log(mybodydata);
 const id = mongoose.Types.ObjectId(req.params.id);
 console.log("1" + id);
 console.log("2" + req.params.id)
 
 Activity.findById(req.params.id, function(err, plans){
   if(err){
     console.log(err);

   } else {
     console.log(plans);

     plans.key_activities= req.body.key_activities,
     plans.project= req.body.project,
     plans.team_member= req.body.team_member,
     plans.week= req.body.week
     plans.save().then(()=> {
       res.redirect('/plan');// Success!
     }, reason => {
       res.redirect('/editPlan/:id ' + req.params.id); // Error!
     });

     
   }

 });
//  Activity.findOneAndUpdate({_id: id}, mybodydata, function(err){
//      if(err){
//        console.log(err);
//        res.redirect('/editA/:id ' + req.params.id);
//    } else {
//      res.render('index');
//     }
//   })
})
// //user. delete_activity

// router.get('/delete', function(req, res){

//   res.render("delete");
// });



//user.activity

router.get('/plan', function(req,res){
  ActivityData.exec(function(err, data){
    if(err) throw err;
  ProjectData.exec(function(err, pdata){
    if(err) throw err;
    WeekData.exec(function(err, wdata){
      if(err) throw err;
    res.render('plan', {p_records: pdata,records: data, w_records: wdata});
  })
})
}) 
})

router.post('/plan', async(req, res) =>{
  try{
   const planReport = new Activity({
       key_activities: req.body.key_activities,
       project: req.body.project,
       team_member: req.body.team_member,
       week: req.body.week,
      
      
          })
          const reported = await planReport.save();
            
    console.log("the success part:" + planReport);
     
      res.redirect('plan');
    
   
 
     } catch(error){
      
      console.log(`error on data entry`, error);
        res.status(400).send(error);
       
    }
  });

router.get('/activity', function(req,res){
  ActivityData.exec(function(err, data){
    if(err) throw err;
  ProjectData.exec(function(err, pdata){
    if(err) throw err;
    UnplannedData.exec(function(err, undata){
      if(err) throw err;
    WeekData.exec(function(err, wdata){
      if(err) throw err;
    res.render('activity', {p_records: pdata,records: data, w_records: wdata, un_records: undata});
  })
});
})
}) 
})

router.post('/activity', async(req, res) =>{
 try{
  const activityReport = new Activity({

      key_activities: req.body.key_activities,
      project: req.body.project,
      team_member: req.body.team_member,
      activity_completion_status: req.body.activity_completion_status,
      week: req.body.week,
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

 

    router.delete('/report/:id', function(req, res){
        const delete1 = req.body.id
        console.log(delete1)
        
        Activity.findByIdAndRemove({_id: delete1}, 
           function(err, docs){
        if(err) res.json(err);
        else    res.redirect('/index');
        });
        });

        router.get('/deleteA/:id', function(req, res){
          var id = req.params.id
          console.log(id)
          var del = Activity.findByIdAndDelete(id);

          del.exec(function(err){
            if(err) throw err;
            res.redirect('/activity')
          })
          
          });

          router.get('/deleteP/:id', function(req, res){
            var id = req.params.id
            console.log(id)
            var del = Project.findByIdAndDelete(id);
  
            del.exec(function(err){
              if(err) throw err;
              res.redirect('/project')
            })
            
            });

            router.get('/deleteW/:id', function(req, res){
              var id = req.params.id
              console.log(id)
              var del = Week.findByIdAndDelete(id);
    
              del.exec(function(err){
                if(err) throw err;
                res.redirect('/week')
              })
              
              });
     
              router.get('/deletePlan/:id', function(req, res){
                var id = req.params.id
                console.log(id)
                var del = Activity.findByIdAndDelete(id);
      
                del.exec(function(err){
                  if(err) throw err;
                  res.redirect('/plan')
                })
                
                });

                router.get('/deleteUnplan/:id', function(req, res){
                  var id = req.params.id
                  console.log(id)
                  var del = Unplanned.findByIdAndDelete(id);
        
                  del.exec(function(err){
                    if(err) throw err;
                    res.redirect('/unplanned')
                  })
                  
                  });

//Route: auth/forget-password
router.get('/plan', function(req, res, next ){
  res.render('plan')
 })
 
 router.get('/note', function(req, res, next ){
  res.render('note')
 })

 router.get('/calendar', function(req, res, next ){
  res.render('calendar')
 })
 router.get('/calendar1', function(req, res, next ){
  res.render('calendar1')
 })

 router.get('/calendar2', function(req, res, next ){
  res.render('calendar2')
 })
 
 

 router.get('/user', function(req, res, next ){
  RegisterData.exec(function(err, data){
    if(err) throw err;
  res.render('user',{u_record:data})
 })
})
 
 //unplanned

 router.get('/unplanned', function(req,res){
  UnplannedData.exec(function(err, data){
    if(err) throw err;
  ProjectData.exec(function(err, pdata){
    if(err) throw err;
    WeekData.exec(function(err, wdata){
      if(err) throw err;
    res.render('unplanned', {p_records: pdata,records: data, w_records: wdata});
  })
})
}) 
})

router.post('/unplanned', async(req, res) =>{
  try{
   const unplanReport = new Unplanned({
       key_activities: req.body.key_activities,
       project: req.body.project,
       team_member: req.body.team_member,
       week: req.body.week,
      
      
          })
          const reported = await unplanReport.save();
            
    console.log("the success part:" + unplanReport);
     
      res.redirect('unplanned');
    
   
 
     } catch(error){
      
      console.log(`error on data entry in unplanned`, error);
        res.status(400).send(error);
       
    }
  });

  
router.get('/editUnplan/:id', function(req, res){
  
  ProjectData.exec(function(err, pdata){

    UnplannedData.exec(function(err, data){
      if(err) throw err;
    ProjectData.exec(function(err, pdata){
      if(err) throw err;
      WeekData.exec(function(err, wdata){
        if(err) throw err;
        Unplanned.findById(req.params.id, function(err, unplan){
          if(err){
            console.log(err);
      
          } else {
            console.log(unplan);
            res.render('edit-unplan', {p_records: pdata,un_records: data, w_records: wdata, unplans:unplan})
          }
        });  
        })
    })
  })
  }) 
   
});
  


//post
router.post('/editUnplan/:id', function(req, res){
 console.log("id "+ req.params.id);
 
 const mybodydata = {
  key_activities: req.body.key_activities,
  project: req.body.project,
  team_member: req.body.team_member,
  week: req.body.week
 
 }
 console.log(mybodydata);
 const id = mongoose.Types.ObjectId(req.params.id);
 console.log("1" + id);
 console.log("2" + req.params.id)
 
 Unplanned.findById(req.params.id, function(err, unplans){
   if(err){
     console.log(err);

   } else {
     console.log(unplans);

     unplans.key_activities= req.body.key_activities,
     unplans.project= req.body.project,
     unplans.team_member= req.body.team_member,
     unplans.week= req.body.week
     unplans.save().then(()=> {
       res.redirect('/unplanned');// Success!
     }, reason => {
       res.redirect('/editUnplan/:id ' + req.params.id); // Error!
     });

     
   }

 });
//  Activity.findOneAndUpdate({_id: id}, mybodydata, function(err){
//      if(err){
//        console.log(err);
//        res.redirect('/editA/:id ' + req.params.id);
//    } else {
//      res.render('index');
//     }
//   })
})
module.exports =  router;
