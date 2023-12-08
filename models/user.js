const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // minlength: 3,
        // maxlength: 20
    },
    email: {
        type: String,
        required: true,
        // minlength: 5,
        // maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        // minlength: 5,
        // maxlength: 1024
    },
    username: {
        type: String,
        required: true,
        minLength: 3,
        // maxlength: 20,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    friendsIds: [{
        default: [],
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    updatedAt: {
        type: Date
    }

});


const User = mongoose.model('User', userSchema);

module.exports = User;

