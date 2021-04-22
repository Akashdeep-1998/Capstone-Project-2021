const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: Number,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "farmer",
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    }
})
module.exports = mongoose.model('post', postSchema)