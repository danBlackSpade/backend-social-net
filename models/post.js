const mongoose = require('mongoose');



const postSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 72
    },
    content: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 280,
        // unique: true
    },
    isPublic: {
        type: Boolean,
        // default: true
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    usersLikes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User'       
    },
    usersDislikes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User'       
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;




