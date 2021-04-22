const mongoose=require('mongoose');
const buyerSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true
    },
    resetToken:String,
    resetTokenExpiration:Date,
})

module.exports=mongoose.model('buyer',buyerSchema)