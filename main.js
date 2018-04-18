var express = require("express");
var app = express();
const bodyParser = require('body-parser');
const base62 = require('base62-random');
var PORT = process.env.PORT || 8080; // default port 8080

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return base62(6);
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.redirect('urls');
});

// URL index
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Page to add a new URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// View the URL info
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortUrl: req.params.id,
    urlData: urlDatabase[req.params.id]
  };
  res.render("url_show", templateVars);
});

// Add new URL
app.post('/urls', (req, res) => {
  let shortUrl = generateRandomString();
  let longUrl = req.body.longURL

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});