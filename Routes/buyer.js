const express = require("express");
const { body } = require("express-validator");
const isAuthenticated = require('../middleware/isAuthenticated');
const buyerController = require("../Controller/buyer");
const buyerRoutes = express.Router();
buyerRoutes.get("/signup", buyerController.getBuyerSignup);
buyerRoutes.post(
  "/postsignup",
  [
    body("username","Username must be 3 characters long!!").isLength({ min:3}).isString().trim(),
    body("email","Email field must contains @domain.com !!").isEmail().normalizeEmail(),
    body("password","Password must be 8 characters long !!").isLength({ min: 8 }).isAlphanumeric(),
    body("address","Address must be 10 characters long !!").isLength({min:10}).isString().trim()
  ],
  buyerController.postsignup
);
buyerRoutes.post("/postsignin",buyerController.postsignin); 
buyerRoutes.get("/signin", buyerController.getBuyerSignin);
buyerRoutes.post("/logout", isAuthenticated, buyerController.logout);
buyerRoutes.post("/payment/:postId", isAuthenticated, buyerController.getPayment);
buyerRoutes.get("/getinfo/:postId", isAuthenticated, buyerController.getInfo);
buyerRoutes.get("/getstore", isAuthenticated, buyerController.getStorePost);
buyerRoutes.get("/orders",isAuthenticated, buyerController.getOrders);
buyerRoutes.get("/resetpassword",buyerController.getResetPassword);
buyerRoutes.get("/newpassword/:resetToken",buyerController.getNewPassword);
buyerRoutes.post("/newpassword",buyerController.postNewPassword);
buyerRoutes.post("/resetpassword",buyerController.postResetPassword);
buyerRoutes.post("/payment", isAuthenticated, buyerController.postPayment);
buyerRoutes.get('/storecrops',isAuthenticated,buyerController.getStoreCrops);
buyerRoutes.get('/getPolicy',buyerController.getPolicy)

module.exports = buyerRoutes;