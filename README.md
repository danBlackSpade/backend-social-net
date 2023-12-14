# Readme

## Run

- Install Node 20.9 (recommended NVM)
- run:

```
npm install
node ./index.js
```

## Features

- Simple Models: User, Post
- Password hash encryption
- JWT Middleware
- User
  - Register
  - Login
  - Get all friends
  - Send friend request
  - Accept friend request
  - Refuse friend request
  - Get all requested friends
  - Get all pending friends
- Post
  - Created
  - Edit
  - Like
  - Dislike
  - Get all public posts
  - Get all private friends posts
  - Get all posts user liked
  - Get all posts user disliked
  - Get all posts user created
  - Get post by id

## Packages

- bcrypt
- express
- jsonwebtoken
- mongoose