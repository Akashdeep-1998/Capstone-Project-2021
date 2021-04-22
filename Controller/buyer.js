const bcrypt = require("bcrypt");
const crypto=require('crypto');
const {validationResult}=require('express-validator')
const buyerModel = require("../model/buyer");
const postModel = require("../model/post");
const orderModel = require('../model/orders');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport')
const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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'
  }
}));

exports.getBuyerSignup = (req, res) => {
  res.render("BuyerSignup", {
    title: "Register Page",
    errorMessage:null
  });
}

exports.getBuyerSignin = (req, res) => {
  res.render("BuyerLogin", {
    title: "Login Page",
    errorMessage:null
  });
}

exports.postsignup =((req, res, next) => {
        // return res.status(204).json({ Error: "Given field can not be empty!!" });
      const errors=validationResult(req);
      if(!errors.isEmpty()){
        return res.render('BuyerSignup',{errorMessage:errors.array()[0].msg})
      }
      buyerModel.findOne({ email: req.body.email }).then(user => {
        if (user) {
          console.log(user);
          return res.render('BuyerSignup',{errorMessage:"Email already exists !!"})

          // return res.status(422).json({ Warning: "This email already registered!! Try another one!" })
        }
        bcrypt.hash(req.body.password, 10, (err, result) => {
          const adminDb = new buyerModel({
            username: req.body.username,
            email: req.body.email,
            password: result,
            address: req.body.address,
            role: "buyer"
          });
          adminDb
            .save()
            .then((result) => {
              console.log(result);
              // return res.status(201).json({ message: "User signup successfully!", Data: result });
              return res.redirect('/home')
            })
            .catch((err) => console.log(err));
        });
      }).catch(err => console.log(err));
    });

exports.postsignin =((req, res, next) => {
      buyerModel.findOne({ email: req.body.email }).then(user => {
        if (!user) {
          return res.render('BuyerLogin',{errorMessage:"Invalid Email or Password !!"})
          // return res.status(404).json({ error: "Wrong Email or Password !!" });
        }
        bcrypt.compare(req.body.password, user.password).then(result => {
          if (result) {
            // console.log(user.username);
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(() => {
              res.redirect('/home');
            })
          }
          return res.render('BuyerLogin',{errorMessage:"Invalid Email or Password !!"})
        })
      })
        .catch(err => console.log(err));
    });

exports.getStorePost = (req, res, next) => {
  postModel.find().sort({createdAt:'desc'}).then(result => {
    // console.log(result);
    return res.render('store', { title: "Store", result: result, authenticated: req.session.user, quantity: req.body.shop_quantity, searched:false })
  })
    .catch(err => console.log(err));
}

exports.getInfo = (req, res, next) => {
  const postId = req.params.postId;
  postModel.findById(postId).populate("userId", "username email address").then(result => {
    console.log(result);
    return res.render("specificItem", { title: result.title, result: result, authenticated: req.session.user })
  }).catch(err => console.log(err));
}

exports.logout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/home');
  });
}

exports.getPayment = (req, res, next) => {
    const orderId = Math.ceil(Math.random() * 1000000000000);
    const unit = req.body.shop_quantity;
    postModel.findByIdAndUpdate(req.params.postId, { unit: unit }, { new: true, useFindAndModify: false }, () => {
      postModel.findById(req.params.postId).then(post => {
        return res.render("Payment", { post, orderId, units: post.unit });
      })
        .catch(err => console.log(err));
    })
  }

exports.postPayment = (req, res, next) => {
  const postId = req.body.payment_postId;

  postModel.findById(postId).then(post => {
    const order = new orderModel({
      post: {
        _id: post._id,
        image: post.image, 
        title: post.title,
        category: post.category, 
      },
      quantity: post.unit,
      totalPrice: (post.unit) * (post.price),
      refId: req.body.payment_refId,
      user: {
        email: req.session.user.email,
        userId: req.session.user
      },
      postedBy:post.userId,
      orderedAt:new Date()
    })
    order.save().then(result => {
      console.log("order Done!!");
      console.log(result);
        return res.render('OrderPlaced', { refId: result.refId, price: post.price, quantity: result.quantity, total: result.totalPrice, address: req.session.user.address });
    }).catch(err => console.log(err));
    post.unit=undefined;
    post.save().then(()=>'success').catch(err=>console.log(err));
  }).catch(err => console.log(err));
}

exports.getOrders = (req, res, next) => {
  orderModel.find({'user.userId':req.session.user._id}).sort({orderedAt:'desc'}).then(result => {
    console.log(result);
    return res.render('Orders',{result, authenticated:req.session.user});
  }).catch(err => console.log(err));
}

exports.getResetPassword = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){  
    message=message[0];
  }
  else{
    message=null;
  }
  return res.render('buyer-reset-password',{errorMessage:message});
}

exports.postResetPassword = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/buyer/resetpassword');
    }
      const token = buffer.toString('hex');
      buyerModel.findOne({ email: req.body.reset_email }).then(user => {
        if (!user) {
          req.flash('error','This email does not exist !!')
          return res.redirect('/buyer/resetpassword');
        }
        user.resetToken = token;
        user.resetTokenExpiration=Date.now()+900000;
        user.save().then(result=>{
          res.send('<body style="background-color:#52bd52;"><h1 style="color:white; margin:18rem 21rem; font-size:3rem">Check your email address to get password reset link.</h1></body>');
          transporter.sendMail({
            to: req.body.reset_email,
            from: 'akashdeep.lpu@outlook.com',
            subject: 'Forgot password!!',
            html: `<p>You can reset your password using this<a href="http://localhost:1000/buyer/newpassword/${token}">&nbsp;reset link</a>!!</p>
            <small>this link is only active till 15 minutes.</small>`
          }).then(result => console.log(result)).catch(err => console.log(err));
        })
      }).catch(err => console.log(err));
  })
}

exports.getNewPassword=(req,res,next)=>{
  const resetToken=req.params.resetToken;
  buyerModel.findOne({resetToken, resetTokenExpiration:{$gt:Date.now()}}).then(user=>{
    console.log(user);
    return res.render('buyer-new-password',{userId:user._id, resetToken});
  }).catch(err=>console.log(err));
}

exports.postNewPassword=(req,res,next)=>{
  buyerModel.findOne({resetToken:req.body.resetToken, resetTokenExpiration:{$gt:Date.now()}, _id:req.body.userId}).then(user=>{
    bcrypt.hash(req.body.new_password, 10,(err,hashedPassword)=>{
      if(err){
        return res.redirect('/buyer/resetpassword');
      }
      user.password=hashedPassword;
      user.resetToken=undefined;
      user.resetTokenExpiration=undefined;
      user.save().then(result=>{
        console.log(result);
        return res.redirect('/buyer/signin');
      })
    })
  })
}

exports.getStoreCrops=(req,res,next)=>{
  const search=req.query.search;
  postModel.find({title:{$regex:search, $options:'$i'}}).sort({createdAt:'desc'}).then(posts=>{
    console.log(posts);
    return res.render('store',{ title: "Store", posts, authenticated: req.session.user, searched:true})
  }).catch(err=>console.log(err));
}

exports.getPolicy=(req,res,next)=>{
  return res.render('Privacy-Policy');
}