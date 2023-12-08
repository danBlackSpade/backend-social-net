
const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://user100:desafioninja@cluster0-desafioninja.4aas6p5.mongodb.net/?retryWrites=true&w=majority";


const Product = require('./models/product');
const User = require('./models/user');
const Post = require('./models/post');
const Friend = require('./models/friend');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

// async function run() {
//     try {
//         await client.connect();
//         await client.db('admin').command({ ping: 1 });
//         console.log('Connected successfully to MONGODB server');
//     } finally {
//         // Ensures that the client will close when you finish/error
//         await client.close();
//     }
// }

// run().catch(console.dir);

const app = express();
const port = 3000;

// app.use(cors());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(uri);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});




app.get('/', (req, res) => {
    res.send('Hello World!');
});


// User
// register User
// TODO: encrypt password, lowercase username, validate email
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
        await user.save()
            .then((newUser) => {
                console.log(newUser);
                return res.status(201).send({ 
                    message: 'Usuário criado com sucesso!', 
                    // newUser
                    email: newUser.email,
                    _id: newUser._id,
                    username: newUser.username.toLowerCase(),
                    name: newUser.name,

                });
            })
            .catch((err) => {
                console.log(err);
                return res.status(500).send({ message: err.message });
            });
    }
});
// login User
app.post('/users/login', async (req, res) => {
    let response = await User.findOne({
            email: req.body.email,
            password: req.body.password
        });
        console.log(response);
    if (await response) {
        return res.status(200).send({ 
            message: 'Login successful', 
            email: response.email, 
            _id: response._id,
            username: response.username.toLowerCase(),
            name: response.name,
        });
    } else {
        console.log(response);
        return res.status(400).send({ message: 'Login failed' });
    }
});
// logout
app.post('/users/logout', async (req, res) => {
    
});

// Friend
// add Friend
app.post('/users/:id/friends', async (req, res) => {
    // const friend = new Friend({
    //     requester: req.params.id,
    //     recipient: req.body.recipient,
    //     status: 'requested'
    // });

    const checkFriendshipResquested = await Friend.findOne({
        requester: req.params.id,
        recipient: req.body.recipient
    });
    const checkFriendshipPending = await Friend.findOne({
        recipient: req.params.id,
        requester: req.body.recipient
    });
    // const checkFriendshipFriends = await Friend.findOne({
    //     $or: [
    //         { requester: req.params.id, recipient: req.body.recipient, status: 'friends' },
    //         { recipient: req.params.id, requester: req.body.recipient, status: 'friends' }
    //     ]
    // });

    if (checkFriendshipResquested) {
        console.log('friendship already requested');
        return res.status(400).send({ message: 'Friendship already requested' });
    } else if (checkFriendshipPending) {
        console.log('friendship already pending');
        return res.status(400).send({ message: 'Friendship already pending' });
    } else {
        console.log('friendship not requested');
        //check if exists
        const docA = await Friend.findOneAndUpdate(
            { requester: req.params.id, recipient: req.body.recipient },
            { $set: { status: 'requested' }},
            { upsert: true, new: true }
        );
        const docB = await Friend.findOneAndUpdate(
            { recipient: req.params.id, requester: req.body.recipient },
            { $set: { status: 'pending' }},
            { upsert: true, new: true }
        );

        // check if exists
        // const updateUserA = await User.findOneAndUpdate(
        //     { _id: req.params.id },
        //     { $push: { friendsIds: docA._id }},
        // );
        const updateUserA = await User.findOneAndUpdate(
            { _id: req.params.id },
            { $addToSet: { friendsIds: docA._id }},
        );
        //update userB
        const updateUserB = await User.findOneAndUpdate(
            { _id: req.body.recipient },
            { $push: { friendsIds: docB._id }},
        )
        
        return res.status(201).send({ message: 'New friend created', docA, docB, updateUserA, updateUserB });

    }



    // await friend.save()
    //     .then((newFriend) => {
    //         console.log(newFriend)
    //         return res.status(201).send({ message: 'New friend created', newFriend });
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //         return res.status(500).send({ message: err.message });
    //     });
});

// accept Friend
app.patch('/users/:id/friends/:friendId', async (req, res) => {
    await Friend.findById(req.params.friendId)
        .then((friend) => {
            if (friend) {
                friend.status = 'friends';
                friend.updatedAt = Date.now();

                friend.save()
                    .then((updatedFriend) => {
                        return res.status(200).send({ message: 'Friend updated', updatedFriend });
                    })
                    .catch((err) => {
                        return res.status(500).send({ message: err.message });
                    });
            } else {
                return res.status(404).send({ message: 'Friend not found' });
            }
        })
});

// reject Friend
app.patch('/users/:id/friends/:friendId', async (req, res) => {
    await Friend.findById(req.params.friendId)
        .then((friend) => {
            if (friend) {
                friend.status = 'rejected';
                friend.updatedAt = Date.now();

                friend.save()
                    .then((updatedFriend) => {
                        return res.status(200).send({ message: 'Friend updated', updatedFriend });
                    })
                    .catch((err) => {
                        return res.status(500).send({ message: err.message });
                    });
            } else {
                return res.status(404).send({ message: 'Friend not found' });
            }
        })
});

// get Friends
app.get('/users/:id/friends', async (req, res) => {
    await Friend.find()
        .then((friends) => {
            return res.status(200).send({ friends });
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
});


// Posts
app.get('/posts', async (req, res) => {
    await Post.find()
        .then((posts) => {
            return res.status(200).send({ posts });
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
});

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

app.patch('/posts/:id', async (req, res) => {
    await Post.findById(req.params.id)
        .then((post) => {
            if (post) {
                post.title = req.body.title;
                post.content = req.body.content;
                post.isPublic = req.body.isPublic;
                post.likes = req.body.likes;
                post.dislikes = req.body.dislikes;
                post.usersLikes = req.body.usersLikes;
                post.updatedAt = Date.now();

                post.save()
                    .then((updatedPost) => {
                        return res.status(200).send({ message: 'Post updated', updatedPost });
                    })
                    .catch((err) => {
                        return res.status(500).send({ message: err.message });
                    });
            } else {
                return res.status(404).send({ message: 'Post not found' });
            }
        })
});

app.patch('/posts/:id/like', async (req, res) => {
    await Post.findById(req.params.id)
        .then((post) => {
            if (post) {
                // post.likes = req.body.likes;
            //     post.usersLikes = req.body.usersLikes;
            //     post.updatedAt = Date.now();
            //     post.save()
            //         .then((updatedPost) => {
            //             return res.status(200).send({ message: 'Post updated', updatedPost });
            //         })
            //         .catch((err) => {
            //             return res.status(500).send({ message: err.message });
            //         });

            post.updateOne({ 
                $inc: { likes: 1 },
                $push: { usersLikes: req.body.usersLikes }, 
                updatedAt: Date.now()
            })
            } else {
                return res.status(404).send({ message: 'Post not found' });
            }
            
        })
});

app.post('/posts', async (req, res) => {
    const post = new Post(req.body);
    console.log('creation started...');

    await post.save()
        .then((newPost) => {
            console.log(newPost)
            return res.status(201).send({ message: 'New post created', newPost });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).send({ message: err.message });
        });
});





// testes
// const Product = require('./models/product');
app.post('/products', async (req, res) => {
    const product = new Product(req.body);
    console.log('creation started...');

    await product.save()
        .then((newProduct) => {
            console.log(newProduct)
            return res.status(201).send({ message: 'New product created', newProduct });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).send({ message: err.message });
        });
});

app.get('/products', async (req, res) => {
    await Product.find()
        .then((products) => {
            return res.status(200).send({ products });
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
});

app.get('/products/:id', async (req, res) => {
    await Product.findById(req.params.id)
        .then((product) => {
            if (product) {
                return res.status(200).send({ product });
            } else {
                return res.status(404).send({ message: 'Product not found' });
            }
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
});

app.put('/products/:id', async (req, res) => {
    Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then((product) => {
            if (product) {
                return res.status(200).send({ product });
            } else {
                return res.status(404).send({ message: 'Product not found' });
            }
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
});

app.delete('/products/:id', async (req, res) => {
    Product.findByIdAndDelete(req.params.id)
        .then((product) => {
            if (product) {
                return res.status(200).send({ message: 'Product deleted' });
            } else {
                return res.status(404).send({ message: 'Product not found' });
            }
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});



