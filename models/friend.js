const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    // user: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User'
    // },
    // friend: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User'
    // },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enums: [    
            'requested',        //'requested',
            'pending',          //'pending',
            'friends',          //'friends'
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }


});

module.exports = mongoose.model('Friend', friendSchema);