// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var path = require("path");
//Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
//Scrapers
var request = require("request");
var cheerio = require("cheerio");


// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

//Set port
var port = process.env.PORT || 8080;

//Initialize express
var app = express();

//Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(__dirname + "/public"));
//Make public a static dir
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// mongodb://heroku_632qmzsh:j045agcpn4kq2nvav091c3rh35@ds127872.mlab.com:27872/heroku_632qmzsh

mongoose.connect("mongodb://localhost/week18homework");
var db = mongoose.connection;

//Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});


//Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


//Routes

// A GET request to scrape the NY Times website
app.get("/scrape", function(req, res) {

  request("http://www.nytimes.com", function(error, response, html) {

    var $ = cheerio.load(html);


    var result = {};


    $("article.theme-summary").each(function(i, element) {

      var link = $(element).children("h2.story-heading").children("a").attr("href");
      var title = $(element).children("h2.story-heading").children().text().trim();
      var author = $(element).children('.byline').text();
      var summary = $(element).children('.summary').text().trim();
      // Save these results in an object that we'll push into the results array we defined earlier

      if (link && title && author && summary) {
        result.link = link,
        result.title = title,
        result.author = author,
        result.summary = summary,
        result.saved = false
      }

      var entry = new Article(result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err)
        }
        else {
          console.log(doc);
        }
      });

    });


  });
  res.send("/articles");
});


app.get("/", function(req, res) {
  Article.remove({saved:false}, function(error, removed) {
    if(error) {
      console.log(error);
      res.send(error);
    }
    else {
      console.log(removed);
      res.render("index");
      }
  });
});


app.post("/articles/delete/:id", function(req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id}, { "saved": false})
  .exec(function(err, doc) {
    if (err) {
      console.log(err)
    }
    else {
      res.send(doc);
    }
  });
});



app.get("/articles", function(req, res) {
  Article.find({saved: false}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.render("index", { ars: doc });
    }
  });
});


app.get("/saved", function(req, res) {
  Article.find({saved: true}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.render("saved", { ars: doc });
    }
  });
});


// Query an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

app.post("/articles/saved/:id", function(req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id}, { "saved": true})
  .exec(function(err, doc) {
    if (err) {
      console.log(err)
    }
    else {
      res.send(doc);
    }
  });
});

//Save a new note to the database with an id associated with its article
app.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);

  newNote.save(function(error, doc) {

    if (error) {
      console.log(error);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.id}, { "note": doc._id})
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }

      });
    }
  });
});

app.listen(port, function() {
  console.log("App running on port", port);
})
