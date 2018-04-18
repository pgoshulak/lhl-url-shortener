var express = require("express");
var app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const base62 = require('base62-random');
var PORT = process.env.PORT || 8080; // default port 8080

var urlDatabase = {
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    visited: 10,
    created: new Date('2018 April 18 12:34:56')
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    visited: 6,
    created: new Date('2018 April 17 08:09:10')
  }
};

function generateRandomString() {
  return base62(6);
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

app.use(express.static('public'))

app.get("/", (req, res) => {
  res.redirect('urls');
});

// URL index
app.get("/urls", (req, res) => {
  let templateVars = { 
    username: req.cookies['username'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

// Page to add a new URL
app.get("/urls/new", (req, res) => {
  let templateVars = { 
    username: req.cookies['username']
  };
  res.render("urls_new", templateVars);
});

// View the URL info
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies['username'],
    shortUrl: req.params.id,
    urlData: urlDatabase[req.params.id]
  };
  res.render("url_show", templateVars);
});

// Add new URL
app.post('/urls', (req, res) => {
  let shortUrl = generateRandomString();
  let longUrl = req.body.longUrl

  urlDatabase[shortUrl] = longUrl;
  res.redirect('/urls/' + shortUrl);
});

// Redirect to long URL
app.get('/u/:shortUrl', (req, res) => {
  let longUrl = urlDatabase[req.params.shortUrl];
  if (longUrl) {
    res.redirect(longUrl);
  } else {
    res.redirect('/urls');
  }
});

// Update the URL entry
app.post('/urls/:id', (req, res) => {
  let shortUrl = req.params.id;
  let longUrl = req.body.longUrl;
  urlDatabase[shortUrl] = longUrl;
  res.redirect('/urls')
});

// Delete the short URL entry
app.post('/urls/:id/delete', (req, res) => {
  let id = req.params.id
  if (urlDatabase.hasOwnProperty(id)) {
    delete urlDatabase[id];
  }
  res.redirect('/urls')
});

// Login and assign cookie as username
app.post('/login', (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

// Logout and clear username cookie
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});