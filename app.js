
//jshint esversion:6
require('dotenv').config()

const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const mongoose=require("mongoose");

const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy=require("passport-google-oauth20").Strategy;
const findOrCreate=require("mongoose-findorcreate");

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  }));

app.use(passport.initialize());
app.use(passport.session())  

mongoose.connect("mongodb+srv://dattasandeep000:13072003@sandy.p06ijgx.mongodb.net/usersDB?retryWrites=true&w=majority",{ useNewUrlParser: true });

app.get("/",(req,res)=>{
    res.render("home")
})

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:6969/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/register",(req,res)=>{
    res.render("register")
})

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");

    }
    else
    res.redirect("/login");
})

app.get("/logout",(req,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/submit",(req,res)=>{

  if(req.isAuthenticated()){
    res.render("submit");

}
else
res.redirect("/login");
})

app.get("/secrets",function(req,res){
      User.find({"secret":{$ne:null},function(err,foundUsers) {
        if(err){
          console.log(err);
        }
        else
        {
          if(foundUsers){
                res.render("secrets",{userwithsecrets:foundUsers});
          }
        }

      }});
})

app.post("/submit",(req,res)=>{
  const userSecret=req.body.secret;
  console.log(req.user);
  
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }
    else
    if(foundUser){
      foundUser.secret=userSecret;
      foundUser.save(function(){
        res.redirect("/secrets");
      })
    }
  })

})


app.post("/register",(req,res)=>{
    
   

    User.register({username:req.body.username},req.body.password,(err,user)=>{

        if(err){
            console.log(err);
            res.redirect("/register")
        }
        else
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        })

    })
   
    
})

app.post("/login",(req,res)=>{

    
    const user = new User({
        username: req.body.username,
        password: req.body.password
      });
    
      req.login(user, function(err){
        if (err) {
          console.log(err);
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });


});



app.listen(process.env.PORT||6969,function(){

    console.log("Server started in port 3000");
});