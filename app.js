require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const User = require("./Models/Users");

app.use(express.static("public")); //this is for css to make it work cuz its static
app.set("view engine", "ejs"); //required ejs is setted
app.use(bodyParser.urlencoded({ extended: true })); //bodyparser cannot be used without this

mongoose.connect(process.env.CONNECTION,{useNewUrlParser:true});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const newUser = new User({
      email: req.body.username,
      password: req.body.password,
    });
    await newUser.save();
    res.render("secrets");
  } catch (e) {
    console.log(e.message);
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const auth = await User.findOne({ email: username });
    if (auth) {
      if (auth.password === password) {
        res.render("secrets");
      } else if (auth.password !== password) {
        console.log("The password was wrong");
      }
    }
  } catch (e) {
    console.log(e.message);
  }
});
app.listen(port, () => console.log("The server has started on Port " + port));
