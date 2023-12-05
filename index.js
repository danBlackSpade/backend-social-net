
const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://user100:desafioninja@cluster0-desafioninja.4aas6p5.mongodb.net/?retryWrites=true&w=majority";

const Product = require('./models/product');
const User = require('./models/user');
const Post = require('./models/post');

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

// Connect to MongoDB
mongoose.connect(uri);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});


app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});


// User
app.post('/users', async (req, res) => {
    const user = new User(req.body);
    console.log(req);
    await user.save()
        .then((newUser) => {
            return res.status(201).send({ message: 'New user created', newUser });
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



