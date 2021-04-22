const express = require("express");
const mongoose = require("mongoose");
const path = require('path');
const farmerModel=require('./model/farmer')
const session = require("express-session");
const mongoSession = require("connect-mongodb-session")(session);
const farmerRoutes = require("./Routes/farmer");
const buyerRoutes = require('./Routes/buyer');
const errorController = require('./Controller/error');
const { MONGO_URI, SESSION_SECRET_KEY } = require('./private/private')
const bodyParser = require("body-parser");
const multer = require('multer');
const flash = require('connect-flash');
const app = express();

const store = mongoSession({
  uri: MONGO_URI,
  collection: "session"
})
// For storing images uploaded by farmer (crops pics)..
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname)
  }
})
//filtering file type (only images can be uploaded)..
const fileFilter = (req, file, callback) => {
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    callback(null, true);
  }
  else {
    callback(null, false);
  }
}

/* Update for front end*/
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static("images"));
/* end update*/
const PORT = process.env.PORT || 1000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: SESSION_SECRET_KEY, resave: false, saveUninitialized: false, store: store, cookie: { maxAge: 86400000 } }))
app.use(flash());
app.use("/home", (req, res, next) => {
  if(!req.session.user){
    // console.log(req.session.user);
    return res.render("LandingPage", { authenticated: null });
  }
    return res.render("LandingPage", { authenticated: req.session.user });
    // farmerModel.findById(req.session.user._id).then(user=>{
    //   // console.log(user.kyc.adhaar)
    //   return res.render("LandingPage", { authenticated: req.session.user, user });
    // }).catch(err=>console.log(err));
})
app.use("/farmer", farmerRoutes);
app.use("/buyer", buyerRoutes);
app.use(errorController.getError);
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log(`Database connected & server is running on PORT ${PORT}`);
    app.listen(PORT);
  })
  .catch((err) => console.log(err));
