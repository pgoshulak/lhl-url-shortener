var express = require("express");
var app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const base62 = require('base62-random');
const ta = require('time-ago')
var PORT = process.env.PORT || 8080; // default port 8080

var urlDatabase = {
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    visited: 10,
    created: new Date('2018 April 18 12:34:56'),
    updated: new Date('2018 April 18 12:34:56'),
    userId: "tester"
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    visited: 6,
    created: new Date('2018 April 17 08:09:10'),
    updated: new Date('2018 April 17 08:09:10'),
    userId: "userRandomID"
  }
};

const users = { 
  "tester": {
    id: "tester",
    email: "W@W",
    password: "123"
  },
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  return base62(6);
}

function getUserLoggedIn(req) {
  if (!req.cookies['user_id']) {
    return null;
  }
  return users[req.cookies['user_id']];
}

// Return a list of a specific user's URLs
function urlsForUser(userId) {
  let filteredUrls = {};
  for (shortUrl in urlDatabase) {
    let urlData = urlDatabase[shortUrl];
    if (urlData.userId === userId) {
      filteredUrls[shortUrl] = urlData;
    }
  }
  return filteredUrls;
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
  let user = getUserLoggedIn(req);

  if (!user) {
    res.redirect('/login');
  }

  let templateVars = { 
    user: user,
    urls: urlsForUser(user.id),
    ta: ta
  };
  res.render('urls_index', templateVars);
});

// Page to add a new URL
app.get("/urls/new", (req, res) => {
  let user = getUserLoggedIn(req);
  // User must be logged in to make a new url
  if (!user) {
    res.redirect('/login');
    return;
  }
  let templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

// View the URL info
app.get("/urls/:id", (req, res) => {
  let user = getUserLoggedIn(req);
  let shortUrl = req.params.id;
  let urlData = urlDatabase[shortUrl]

  // Check if the user is logged in
  if (!user) {
    res.status(403).send('Error: You must be logged in to edit a URL');
    return
  }

  // Check that the URL belongs to the user
  if (user.id === urlData.userId) {
    let templateVars = {
      user: user,
      shortUrl: shortUrl,
      urlData: urlData,
      ta: ta
    };
    res.render("url_show", templateVars);
    return;
  } else {
    res.status(403).send('Error: User not authorized to edit this URL')
  }

});

// Add new URL
app.post('/urls', (req, res) => {
  let shortUrl = generateRandomString();
  let longUrl = req.body.longUrl

  let user = getUserLoggedIn(req);
  // Ensure user cannot POST without being logged in
  if (!user) {
    res.redirect('/urls');
  }

  urlDatabase[shortUrl] = {
    longUrl: longUrl,
    visited: 0,
    created: new Date(),
    updated: new Date(),
    userId: user.user_id
  };
  res.redirect('/urls/' + shortUrl);
});

// Redirect to long URL
app.get('/u/:shortUrl', (req, res) => {
  let urlData = urlDatabase[req.params.shortUrl];
  if (urlData && urlData.longUrl) {
    urlData.visited += 1;
    res.redirect(urlData.longUrl);
  } else {
    res.redirect('/urls');
  }
});

// Update the URL entry
app.post('/urls/:id', (req, res) => {
  let user = getUserLoggedIn(req);
  let shortUrl = req.params.id;
  let newLongUrl = req.body.longUrl;
  let oldUrlData = urlDatabase[shortUrl];

  if (!user) {
    res.status(403).send('Error: You must be logged in to edit a URL');
  }
  if (user.id === oldUrlData.userId) {
    urlDatabase[shortUrl] = Object.assign({}, oldUrlData, {
      longUrl: newLongUrl,
      updated: new Date()
    })
    res.redirect('/urls')
  } else {
    res.status(403).send('Error: User not authorized to edit this URL');
  }
});

// Delete the short URL entry
app.post('/urls/:id/delete', (req, res) => {
  let user = getUserLoggedIn(req);
  let shortUrl = req.params.id;
  let urlData = urlDatabase[shortUrl]

  // Check if the user is logged in
  if (!user) {
    res.status(403).send('Error: You must be logged in to delete a URL');
    return
  }

  // Check that the URL belongs to the user
  if (user.id === urlData.userId) {
    // Ensure the URL exists before attempting to delete
    if (urlDatabase.hasOwnProperty(shortUrl)) {
      delete urlDatabase[shortUrl];
    }
    res.redirect('/urls')
  } else {
    res.status(403).send('Error: User not authorized to delete this URL')
  }
});

// Login page
app.get('/login', (req, res) => {
  // Check if user is already logged in
  if (req.cookies['user_id']) {
    res.redirect('/urls');
    return;
  }
  let templateVars = {user: getUserLoggedIn(req)};
  res.render('login', templateVars)
})

// Login and assign cookie as username
app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  // Check if user exists in database
  for (user_id in users) {
    let user = users[user_id];
    // If user exists
    if (user.email === email) {
      // If password correct, log the user in
      if (user.password === password) {
        res.cookie('user_id', user_id);
        res.redirect('/urls');
      } else {
        // Password is incorrect
        res.status(403).send('Error: Incorrect password');
      }
    }
  }
  // The user email does not exist in the database
  res.status(403).send('Error: User does not exist')
});

// Logout and clear username cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Registration page
app.get('/register', (req, res) => {
  let templateVars = {user: getUserLoggedIn(req)};
  res.render('register', templateVars);
})

// Post new registration
app.post('/register', (req, res) => {
  // Error checking email and password
  if (!req.body.email || !req.body.password) {
    res.redirect(400, '/register');
    return;
  }
  // Check that email is unique
  for (id in users) {
    if (users[id].email === req.body.email) {
      res.redirect(400, '/register');
      return;
    }
  }
  // Generate new user ID
  let user_id = generateRandomString();
  // Add user to database
  users[user_id] = {
    id: user_id,
    email: req.body.email,
    password: req.body.password
  }
  // Set username cookie
  res.cookie('user_id', user_id);
  res.redirect('/urls');
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});