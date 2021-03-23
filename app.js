//ability to create a post
//ability to view all posts

const express = require('express');
const app = express();

//initialize pg promise
const pgp = require('pg-promise')();

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