// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;


var PORT = 8080;

//Initialize express
var app = express();

//Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

//Make public a static dir
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


//Database configuration with mongoose
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



// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {

  request("http://www.nytimes.com", function(error, response, html) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(html);

    // An empty array to save the data that we'll scrape
    var result = {};

    // Select each element in the HTML body from which you want information.
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
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
        result.summary = summary
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

    // Log the results once you've looped through each of the elements found with cheerio
    // console.log(results);
  });
  res.send("/articles");
});


app.get("/articles", function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.render("index", { ars: doc });
    }
  });
});


// Grab an article by it's ObjectId
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

app.listen(PORT, function() {
  console.log("App running on port", PORT);
})
