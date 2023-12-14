
const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




const Product = require('./models/product');
const User = require('./models/user');
const Post = require('./models/post');
const Friend = require('./models/friend');

const app = express();
const port = 3000;


// Insecure - For demo purposes only
const uri = "mongodb+srv://user100:desafioninja@cluster0-desafioninja.4aas6p5.mongodb.net/?retryWrites=true&w=majority";
const ACCESS_TOKEN_SECRET = '23a004412f7aa859e78af1ae0fd6ad56ad2ae36eb1eb7b4a84c71107fd59835e481ece60c2cbd9b29404bd613e930f3ff1b1eb7c680923553c68b369bc6e7d7e'
const REFRESH_TOKEN_SECRET = '934c952ca416b96e82aa87c43b2c74a70b3127bcb7b82c698ee1bca83d147893c6aa602db7741fe0978c630ce8aec6f98b6b97a438966019b69a3ce500d3eec1'

app.use(express.json());


// Connect to MongoDB
mongoose.connect(uri);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});



function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    // const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (token == null) {
        return res.sendStatus(401).send({ message: 'Token not found' });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403).send({ message: 'Token not valid' });
        } else {
            req.user = user;
            next();
        }
        // req.user = user;
        // next();
    });
}



// TEST
// get all Users
app.get('/users', async (req, res) => {
    const users = await User.find();
    if (users) {
        return res.status(200).send({ users });
    } else {
        return res.status(404).send({ message: 'Users not found' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});


// END TEST

// User
// register User
app.post('/users', async (req, res) => {
    const user = new User(req.body);
    console.log(req.body.email);
    let doesEmailExist = await User.findOne({ email: req.body.email });
    let doesUsernameExist = await User.findOne({ username: req.body.username });

    if (doesEmailExist) {
        console.log('email already exists');
        // return res.status(400).json({ message: 'Email already exists'});
        return res.status(400).send({ message: 'Email já cadastrado' });
    } else if (doesUsernameExist) {
        console.log('username already exists');
        return res.status(400).send({ message: 'Usuário já cadastrado' });
    } else {
        user.password = bcrypt.hash(user.password, 10, (err, hash) => {
            if (err) {
                console.log(err);
                return res.status(500).send({ message: err.message });
            } else {
                const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
                const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET);
                user.password = hash;
                user.username = user.username.toLowerCase();
                console.log(user);
                user.save();
                return res.status(201).send({
                    message: 'Usuário criado com sucesso!', 
                    user,
                    accessToken: accessToken,
                    refreshToken: refreshToken
                });
            }
        });
    }
});
// login User
app.post('/users/login', async (req, res) => {
    let user = await User.findOne({
            email: req.body.email
        }).select('+password');
    if (await bcrypt.compareSync(req.body.password, user.password)) {
        const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
        const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET);
        return res.status(200).send({ 
            message: 'Login successful', 
            user,
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } else {    
        return res.status(400).send({ message: 'Login failed' });
    }

});
// logout
app.post('/users/logout', async (req, res) => {
    
});

// add Friend
app.patch('/users/:id/friends', async (req, res) => {

    const user = await User.findById(req.params.id);
    const friend = await User.findById(req.body.friendId);

    if (user && friend) {
        if (user.friendsIds.includes(friend._id)) {
            return res.status(400).send({ message: 'Already friends on: ' + user.name });
        } else if (friend.friendsIds.includes(user._id)) {
            return res.status(400).send({ message: 'Already friends on: ' + friend.name });
        } else if (user.friendsRequestsSent.includes(friend._id)) {
            return res.status(400).send({ message: 'Friend request already sent' });
        } else if (friend.friendsRequestsReceived.includes(user._id)) {
            return res.status(400).send({ message: 'Friend request already received' });
        } else if (friend.friendsRequestsSentRejected.includes(user._id)) {
            return res.status(400).send({ message: 'Friend request already rejected' });
        }
        else {
            console.log('Friend request sent');
            user.friendsRequestsSent.push(friend._id);
            friend.friendsRequestsReceived.push(user._id);
            user.save();
            friend.save();
            return res.status(200).send({ message: 'Friend request sent', user });

        }
    } else {
        return res.status(404).send({ message: 'Friend or User not found' });
    }
    
});

// accept Friend
app.patch('/users/:id/friends/:friendId', async (req, res) => {
    const user = await User.findById(req.params.id);
    const friend = await User.findById(req.params.friendId);
    
    if (user && friend) {
        if(user.friendsRequestsSent.includes(friend._id) && friend.friendsRequestsReceived.includes(user._id)) {
            user.friendsRequestsSent.pull(friend._id);
            friend.friendsRequestsReceived.pull(user._id);
            user.friendsIds.push(friend._id);
            friend.friendsIds.push(user._id);
            user.save();
            friend.save();
            return res.status(200).send({ message: 'Friend request accepted', user });
        } else {
            return res.status(400).send({ message: 'Friend request not found' });
        }
    } else {
        return res.status(404).send({ message: 'Friend or User not found' });
    }

});

// reject Friend
app.patch('/users/:id/friends/:friendId', async (req, res) => {
    const user = await User.findById(req.params.id);
    const friend = await User.findById(req.params.friendId);

    if (user && friend) {
        if(user.friendsRequestsSent.includes(friend._id) && friend.friendsRequestsReceived.includes(user._id)) {
            user.friendsRequestsSent.pull(friend._id);
            friend.friendsRequestsReceived.pull(user._id);
            user.friendsRequestsSentRejected.push(friend._id);
            // friend.friendsRequestsSentRejected.push(user._id);
            user.save();
            friend.save();
            return res.status(200).send({ message: 'Friend request rejected', user });
        } else {
            return res.status(400).send({ message: 'Friend request not found' });
        }
    }
});

// get all Friends
app.get('/users/:id/friends', async (req, res) => {
    const user = await User.findById(req.params.id);
    const getFriends = user.friendsIds;

    if (getFriends) {
        console.log(getFriends);
        return res.status(200).send({ "friends": getFriends });
    } else {
        console.log('Friends not found');
        return res.send({ message: 'Friends or User not found' });
    }
});

// get pending Friends
app.get('/users/:id/friends/pending', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        console.log(user.friendsRequestsReceived);
        // const f = await Friend.find({ _id: { $in: user.friendsRequestsReceived }});
        const f = await User.find({ _id: { $in: user.friendsRequestsReceived }});
        // const f = user.friendsRequestsReceived;;
        console.log(f.length);
        const friendsRequestsReceived = f.map((friend) => {
            return {
                id: friend._id, 
                name: friend.name, 
                username: friend.username, 
                avatar: friend.avatar, 
                email: friend.email
            };
            // return {friend};
        });
        return res.status(200).send({ friendsRequestsReceived });
    } else {
        console.log(user);
        return res.send({ message: 'User not found' });
    }
});

// get requested Friends
app.get('/users/:id/friends/requested', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        console.log(user.friendsRequestsSent);
        const f = await User.find({ _id: { $in: user.friendsRequestsSent }});
        console.log(f.length);
        const friendsRequestsSent = f.map((friend) => {
            return {
                id: friend._id, 
                name: friend.name, 
                username: friend.username, 
                avatar: friend.avatar, 
                email: friend.email
            };
        });
        return res.status(200).send({ friendsRequestsSent });
    } else {
        console.log(user);
        return res.send({ message: 'User not found' });
    }
});

// get friends Friends


// Posts
// get all Posts
// app.get('/posts', authenticateToken, async (req, res) => {
//     await Post.find()
//         .then((posts) => {
//             return res.status(200).send({ posts });
//         })
//         .catch((err) => {
//             return res.status(500).send({ message: err.message });
//         });
// });

// get Post by id
app.get('/posts/:id', async (req, res) => {
    await Post.findById(req.params.id)
        .then((post) => {
            if (post) {
                return res.status(200).send({ post });
            } else {
                return res.status(404).send({ message: 'Post not found' });
            }
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
});

// delete Post by id

// update Post by id



// get all public Posts

// get all friends Posts

// like Post
app.patch('/posts/:id/like/:user_id', authenticateToken ,async (req, res) => {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.params.user_id);

    if (post && user) {
        console.log(post)
        console.log(user)
        if (post.usersLikes.includes(user._id)) {
            return res.status(400).send({ message: 'Already liked' });
        } else {
            console.log('Like added');
            post.likes += 1;
            post.usersLikes.push(user._id);
            post.updatedAt = Date.now();
            post.save();
            return res.status(200).send({ message: 'Like added', post });
        }
    } else {
        return res.status(404).send({ message: 'Post or User not found' });
    }
});

// dislike Post
app.patch('/posts/:id/dislike/:user_id', authenticateToken, async (req, res) => {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.params.user_id);

    if (post && user) {
        console.log(post)
        console.log(user)
        if (post.usersDislikes.includes(user._id)) {
            return res.status(400).send({ message: 'Already disliked' });
        } else {
            console.log('Dislike added');
            post.dislikes += 1;
            post.usersDislikes.push(user._id);
            post.updatedAt = Date.now();
            post.save();
            return res.status(200).send({ message: 'Dislike added', post });
        }
    } else {
        return res.status(404).send({ message: 'Post or User not found' });
    }
});

// new Post
app.post('/posts/:user_id', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.user_id);
    const post = new Post(req.body);
    console.log(user)
    if (user) {
        console.log(user)
        post.owner = user._id;
        await post.save()
        .then((newPost) => {
            console.log(newPost)
            return res.status(201).send({ message: 'New post created', newPost });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).send({ message: err.message });
        });
    } else {
        return res.status(404).send({ message: 'User not found' });
    }
});

// get all Posts User likes
app.get('/posts/:id/likes', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    const allPostsLiked = await Post.find({ usersLikes: { $in: user._id }});
    console.log(allPostsLiked);
    console.log(allPostsLiked.length);
    if (allPostsLiked) {
        return res.status(200).send({ allPostsLiked });
    } else {
        return res.status(404).send({ message: 'Posts not found' });
    }
});

// get all Posts User dislikes
app.get('/posts/:id/dislikes', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    const allPostsDisliked = await Post.find({ usersDislikes: { $in: user._id }});
    console.log(allPostsDisliked);
    console.log(allPostsDisliked.length);
    if (allPostsDisliked) {
        return res.status(200).send({ allPostsDisliked });
    } else {
        return res.status(404).send({ message: 'Posts not found' });
    }
});

// get all Posts User created
app.get('/posts/:id/created', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    const allPostsCreated = await Post.find({ owner: user._id });
    console.log(allPostsCreated);

    if (allPostsCreated) {
        return res.status(200).send({ allPostsCreated });
    } else {
        return res.status(404).send({ message: 'Posts not found' });
    }
});


// // Friends 2 approach
// app.get('/users/:id/friends', async (req, res) => {

// });



app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});



