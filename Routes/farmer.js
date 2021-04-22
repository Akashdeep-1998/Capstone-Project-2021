const express = require("express");
const { check, body } = require("express-validator");
const isAuthenticated = require('../middleware/isAuthenticated');
const farmerController = require("../Controller/farmer");
const farmerRoutes = express.Router();
farmerRoutes.get("/signup", farmerController.getFarmerSignup);
farmerRoutes.post(
  "/postsignup",
  [
    body("username", "Username must be 3 characters long!!").isLength({ min: 3 }).isString().trim(),
    body("email", "Email field must contains @domain.com").isEmail().normalizeEmail(),
    body("password", "Password field must be longer than 8 characters!").isLength({ min: 8 }).isAlphanumeric(),
    body("address", "Address field must be longer than 10 characters!").isLength({ min: 10 }).isString().trim()
  ],
  farmerController.postsignup);

farmerRoutes.get("/signin", farmerController.getFarmerSignin);

farmerRoutes.post("/postsignin", farmerController.postsignin);

farmerRoutes.post("/logout", isAuthenticated, farmerController.logout);

farmerRoutes.get('/uploadpost', isAuthenticated, farmerController.getUploadPost);

farmerRoutes.post("/uploadpost", [
  body("item_name", "Crop's name must be 3 characters long !!").isLength({ min: 3 }).isString().trim(),
  body("category", "category must be 3 characters long !!").isLength({ min: 3 }).isString().trim(),
  body("price", "Invalid input of price !!").isLength({ min: 1 }),
  body("quantity", "Invalid input of quantity !!").isLength({ min: 1 })
], isAuthenticated, farmerController.uploadPost);

farmerRoutes.get("/getposts", isAuthenticated, farmerController.getPosts);

farmerRoutes.get("/getstore", isAuthenticated, farmerController.getStorePost);

farmerRoutes.get("/getinfo/:postId", isAuthenticated, farmerController.getInfo);

farmerRoutes.get("/paymenthistory", isAuthenticated, farmerController.getPaymentHistory);

farmerRoutes.get("/resetpassword", farmerController.getResetPassword);

farmerRoutes.get("/newpassword/:resetToken", farmerController.getNewPassword);

farmerRoutes.post("/newpassword", farmerController.postNewPassword);

farmerRoutes.post("/resetpassword", farmerController.postResetPassword);

farmerRoutes.post("/removepost", isAuthenticated, farmerController.removePost);

farmerRoutes.get('/crops', isAuthenticated, farmerController.getSearchedCrops);

farmerRoutes.get('/storecrops', isAuthenticated, farmerController.getStoreCrops);

farmerRoutes.get('/kyc', isAuthenticated, farmerController.getKyc);

farmerRoutes.post('/kyc', isAuthenticated, farmerController.postKyc);


module.exports = farmerRoutes;
