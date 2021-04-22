const { validationResult } = require("express-validator");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport')
const bcrypt = require("bcrypt");
const farmerModel = require("../model/farmer");
const postModel = require("../model/post");
const orderModel = require('../model/orders');
const adhaarValidator=require('aadhaar-validator');
const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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'
  }
}));

exports.getFarmerSignup = (req, res) => {
  res.render("FarmerSignup", {
    title: "Register Page",
    errorMessage: null
  });
}
exports.getFarmerSignin = (req, res) => {

  res.render("FarmerLogin", {
    title: "Login Page",
    errorMessage: null
  });
}

exports.postsignup =
  (
    (req, res, next) => {
      const errors=validationResult(req);
      if(!errors.isEmpty()){
        return res.render('FarmerSignup',{errorMessage:errors.array()[0].msg})
      }
      farmerModel.findOne({ email: req.body.email }).then(user => {
        if (user) {
          console.log(user);
          return res.render('FarmerSignup',{errorMessage:"Email already exists !!"})
        }

        bcrypt.hash(req.body.password, 10, (err, result) => { 
          const adminDb = new farmerModel({
            username: req.body.username,
            email: req.body.email,
            password: result,
            address: req.body.address,
            role: "farmer"
          });
          adminDb
            .save()
            .then((result) => {
              console.log(result);
              res.redirect('/farmer/signin');
              return transporter.sendMail({
                to: result.email,
                from: 'akashdeep.lpu@outlook.com',
                subject: 'Signed Up successfully!!',
                html: '<h1 style="color:green;">You successfully signed Up!!!</h1>'
              })
            })
            .catch((err) => console.log(err));
        });
      }).catch(err => console.log(err));
    });

exports.postsignin =
  (
    (req, res, next) => {
      farmerModel.findOne({ email: req.body.email }).then(user => {
        if (!user) {
          // req.flash('error', 'Invalid Email or Password !!')
          // return res.redirect('/farmer/signin');
          return res.render('FarmerLogin',{errorMessage:"Invalid Email or Password !!"})
        }
        bcrypt.compare(req.body.password, user.password).then(result => {
          if (result) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(() => {
              res.redirect('/home');
            })
          }
          return res.render('FarmerLogin',{errorMessage:"Invalid Email or Password !!"})
        })
      })
        .catch(err => console.log(err));
    });

exports.logout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/home');
  });
}

exports.getUploadPost=(req,res,next)=>{
  return res.render('Add-crops',{errorMessage:null});
}

exports.uploadPost = (req, res, next) => {
  const errors=validationResult(req);
  const { item_name, price, category, quantity } = req.body;
  if(!errors.isEmpty()){
    return res.render('Add-crops',{errorMessage:errors.array()[0].msg});
  }
  if(!req.file)
  {
    return res.render('Add-crops',{errorMessage:"Image file type must be .png, .jpg or jpeg"});
  }
  const imageData = req.file.path;
  const postDb = new postModel({
    image: imageData,
    title: item_name,
    category,
    price,
    quantity,
    userId: req.session.user,
    createdAt:new Date()
  })
  postDb.save().then(result => {
    console.log(result);
    return res.redirect('/farmer/getposts');
  }).catch(err => console.log(err));
}

exports.getUploadPage = (req, res, next) => {
  if (!req.session.user) {
    return res.render("error");
  }
  return res.render("mandi");
}

exports.getPosts = (req, res, next) => {
  if (!req.session.user) {
    return res.render("error");
  }
  postModel.find({ userId: req.session.user._id }).sort({createdAt:'desc'}).then(result => {
    console.log(result);
    return res.render("indexMandi", { result: result, title: "farmer Uploaded Crops", username: req.session.user.username, searched:false, authenticated:req.session.user })
  }).catch(err => console.log(err));
}

exports.removePost = (req, res, next) => {
  const postId = req.body.postId;
  postModel.deleteOne({ _id: postId, userId: req.session.user._id }).then(() => {
    console.log('post deleted!!');
    return res.redirect('/farmer/getposts');
  }).catch(err => console.log(err));
}

exports.getStorePost = (req, res, next) => {
  postModel.find().sort({createdAt:'desc'}).then(result => {
    // console.log(result);
    return res.render('store', { title: "Store", result: result, authenticated: req.session.user, searched:false})
  })
    .catch(err => console.log(err));
}

exports.getInfo = (req, res, next) => {
  const postId = req.params.postId;
  postModel.findById(postId).populate("userId", "username email address role").then(result => {
    console.log(result); //render mein info hoga
    return res.render("specificItem", { title: result.title, result: result, authenticated: req.session.user })
  }).catch(err => console.log(err));
}

exports.getPaymentHistory = (req, res, next) => {
  let total = 0;
  orderModel.find({ postedBy: req.session.user._id }).sort({orderedAt:'desc'}).then(result => {
    result.map(post => {
      total += (post.totalPrice);
    })
    console.log(result);
    // console.log(total);
    return res.render('transaction', { result, total: total.toFixed(2), user: req.session.user });
  })
}

exports.getResetPassword = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  }
  else {
    message = null;
  }
  return res.render('farmer-reset-password', { errorMessage: message });
}

exports.postResetPassword = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/farmer/resetpassword');
    }
    const token = buffer.toString('hex');
    farmerModel.findOne({ email: req.body.reset_email }).then(user => {
      if (!user) {
        req.flash('error', 'This email does not exist !!')
        return res.redirect('/farmer/resetpassword');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 900000;
      user.save().then(result => {
        res.send('<body style="background-color:#52bd52;"><h1 style="color:white; margin:18rem 21rem; font-size:3rem">Check your email address to get password reset link.</h1></body>'); transporter.sendMail({
          to: req.body.reset_email,
          from: 'akashdeep.lpu@outlook.com',
          subject: 'Forgot password!!',
          html: `<h5>You can reset your password using this<a href="http://localhost:1000/farmer/newpassword/${token}"> reset link</a>!!</h5>
            <small>this link is only active till 15 minutes.</small>`
        }).then(result => console.log(result)).catch(err => console.log(err));
      })
    }).catch(err => console.log(err));
  })
}

exports.getNewPassword = (req, res, next) => {
  const resetToken = req.params.resetToken;
  farmerModel.findOne({ resetToken, resetTokenExpiration: { $gt: Date.now() } }).then(user => {
    console.log(user);
    return res.render('farmer-new-password', { userId: user._id, resetToken });
  }).catch(err => console.log(err));
}

exports.postNewPassword = (req, res, next) => {
  farmerModel.findOne({ resetToken: req.body.resetToken, resetTokenExpiration: { $gt: Date.now() }, _id: req.body.userId }).then(user => {
    bcrypt.hash(req.body.new_password, 10, (err, hashedPassword) => {
      if (err) {
        return res.redirect('/farmer/resetpassword');
      }
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;
      user.save().then(result => {
        console.log(result);
        return res.redirect('/farmer/signin');
      })
    })
  })
}

exports.getSearchedCrops=(req,res,next)=>{
  postModel.find({$or:[{"title":{$regex:(req.query.search).toString().trim(), $options:'i'}},{"category":{$regex:(req.query.search).toString().trim(), $options:'i'}}]}).then(posts=>{
    console.log(posts);
    return res.render('indexMandi',{posts, searched:true, title:"farmer uploaded crops",role:req.session.user.role,username: req.session.user.username, authenticated:req.session.user})
  }).catch(err=>console.log(err));
}

exports.getStoreCrops=(req,res,next)=>{
  postModel.find({$or:[{"title":{$regex:(req.query.search).toString().trim(), $options:'i'}},{"category":{$regex:(req.query.search).toString().trim(), $options:'i'}}]}).sort({createdAt:'desc'}).then(posts=>{
    console.log(posts);
    return res.render('store',{ title: "Store", posts, authenticated: req.session.user, searched:true})
  }).catch(err=>console.log(err));
}

exports.getKyc=(req,res,next)=>{
  farmerModel.findById(req.session.user._id).then(user=>{
    if(!user.kyc.adhaar){
  return res.render('kyc', {authenticated:req.session.user, errorMessage:null});
    }
    return res.render('404-error');
  })
}

exports.postKyc=(req,res,next)=>{
  farmerModel.findById(req.session.user._id).then(user=>{        
    if(!adhaarValidator.isValidNumber(req.body.adhaar)){
      return res.render('kyc',{authenticated:req.session.user,errorMessage:"Invalid Adhaar number !!"})
    }
    user.kyc.adhaar=req.body.adhaar;    
    user.save().then(()=>{
      req.session.destroy(()=>{
        return res.redirect('/home')
      })
    })
  })
  .catch(err=>console.log(err));
}  