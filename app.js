const express = require('express');
const app = express();
var session = require('express-session');

//import bycryptjs
var bcrypt = require('bcryptjs');

//initialize pg promise
const pgp = require('pg-promise')()

//initialize a session -- this comes right from the documentation
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

//connection string
const connectionString = 'postgres://localhost:5432/blogpostsdb';

const db = pgp(connectionString);

const mustacheExpress = require('mustache-express');
app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.urlencoded())

//get all posts
app.get('/', (req, res) => {
    db.any('SELECT title, body, date_created, date_updated, is_published FROM blogposts')
    .then(blogposts => {
        res.render('index', {blogposts: blogposts});
    })
})

//get just the user's posts
// app.get('/my-posts', (req, res) => {
//     const userId = req.session.userId;

//     db.any('SELECT title, body, date_created, date_updated, is_published FROM blogposts where user_id = $1', [userId])
//     .then((blogposts) => {
//         res.json(blogposts)
//     })
// })

//allow users to register on website
app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/dashboard', (req, res) => {

    db.any('SELECT users.user_id, username, title, body, date_created, date_updated, is_published FROM users JOIN blogposts ON users.user_id = blogposts.user_id').then(result => {
        console.log(result)
    })
})

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    bcrypt.genSalt(10, function (error, salt) {
        bcrypt.hash(password, salt, function (error, hash) {
            //if there is no error
            if (!error) {
                db.none('INSERT INTO users(username, password) VALUES($1, $2)', [username, hash])
                .then(() => {
                    res.send('User Registered!')
                }).catch(function (e) {
                    console.log(e)
                })
            }
        })
    })
})

//user login
app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.one('SELECT user_id, username, password FROM users WHERE username = $1', [username])
        .then((user) => {
            bcrypt.compare(password, user.password, function (error, result) {
                if (result) {
                    if (req.session) {
                        req.session.userId = user.user_id
                        req.session.username = user.username

                        res.redirect('/')
                    }
                } else {
                    res.send('Invalid Password')
                }
            })
        }).catch((error) => {
            console.log(error)
            res.send('User not found!')
        })
})

//sets up the page for adding a post
app.get('/add-post', (req, res) => {
    res.render('add-post');
})

//add new blog post
app.post('/add-post', (req, res) => {
    console.log(req.body);

    const title = req.body.title;
    const body = req.body.body;
    const isPublished = req.body.isPublished == "on" ? true : false;

    db.none('INSERT INTO blogposts(title, body, is_published) VALUES($1, $2, $3)', 
    [title, body, isPublished])
    .then(() => {
        res.redirect('/')
    })
})

app.listen(3000, () => {
    console.log("Server is running...");
})