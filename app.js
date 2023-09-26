require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate"); //this we used for findOrCreate function of Strategies because as per google google+ has or is retiring.

app.use(express.static("public")); //statics like css does'nt work until I use it.
app.set("view engine", "ejs"); //required ejs is set
app.use(bodyParser.urlencoded({ extended: true })); //to make bodyParser work

app.use(
  session({
    secret: process.env.SECOND_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.CONNECTION, { useNewUrlParser: true });
// mongoose.set("useCreateIndex",true)
const User = require("./Models/Users");
const { Strategy } = require("passport-local");
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
//this is going to work for every strategy not only local.

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
//Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3005/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
    //  console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);

//facebook strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FB_APP_ID,
      clientSecret: process.env.FB_APP_SECRET,
      callbackURL: "http://localhost:3005/auth/facebook/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
    //  console.log(profile);
      User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);
//other routes Home and etc.
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/secrets", async (req, res) => {
  try {
    const foundUser = await User.find({ secret: { $ne: null } });
    if (foundUser) {
      res.render("secrets", { usersWithSecrets: foundUser });
    }
  } catch (e) {
    console.log(e.message);
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout(async () => {
    try {
      res.redirect("/");
    } catch (e) {
      console.log(e.message);
    }
  });
});

// post request for Submit button
app.post("/submit", async (req, res) => {
  try {
    const submittedSecret = req.body.secret;
   // console.log(req.user.id);
    const foundUser = await User.findById(req.user.id);
    if (foundUser) {
      foundUser.secret = submittedSecret;
      await foundUser.save();
      res.redirect("/secrets");
    }
  } catch (e) {
    console.log(e.message);
  }
});

//register and login routes performing crucial functionality
app.post("/register", async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.setPassword(req.body.password);
    await user.save();
    const { isAuthenticatedUser } = await User.authenticate()(
      req.body.username,
      req.body.password
    );
    await passport.authenticate("local")(req, res, function () {
      res.redirect("/secrets");
    });
  } catch (e) {
    console.log(e.message);
    res.redirect("/register"); // Redirect to registration page in case of an error
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.setPassword(req.body.password);
    const { isAuthenticatedUser } = await User.authenticate()(
      req.body.username,
      req.body.password
    );
    req.login(user, async (request, response) => {
      try {
        await passport.authenticate("local")(req, res, () =>
          res.redirect("/secrets")
        );
      } catch (e) {
        console.log(e.message);
      }
    });
  } catch (e) {
    console.log(e.message);
  }
});

//server listening.
app.listen(port, () => console.log("The server has started on Port " + port));
