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
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortUrl: req.params.id,
    urlData: urlDatabase[req.params.id]
  };
  res.render("url_show", templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send(`${generateRandomString()} :: ${req.body.longURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});