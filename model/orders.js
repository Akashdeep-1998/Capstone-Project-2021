const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({

    post: { type: Object, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    refId: { type: String, required: true },
    user: {
        email: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'buyer'
        }
    },
    postedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'farmer',
        required:true
    },
    orderedAt:{
        type:Date,
        required:true,
    }
}
)
module.exports = mongoose.model('order', orderSchema)