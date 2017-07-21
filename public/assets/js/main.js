
  var scrape_button = document.querySelector(".scrape-articles");

  scrape_button.addEventListener("click", function() {
    $.getJSON("/scrape");
    setTimeout(refreshPage, 1000);
    function refreshPage() {
      window.location.assign("/articles");
    }
  });


  $(document).on("click", "#comment", function() {

    var thisId = $(this).attr("data-id");
    $("#notes").empty();
      console.log("This ID: "+ thisId);
    $('#modal1').modal('open', {opacity: .1, inDuration: 600, startingTop: '4%'});
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
      // With that done, add the note information to the page
      .done(function(data) {
        console.log(data);
        // The title of the article
        $("#notes").append("<h6>" + data.title + "</h6>");
        // An input to enter a new title
        $("#notes").append("<input id='titleinput' name='title' placeholder='Name'></input>");
        // A textarea to add a new note body
        $("#notes").append("<textarea id='bodyinput' name='body' placeholder='Message'></textarea>");
        // A button to submit a new note, with the id of the article saved to it
        $("#notes").append("<div class='modal-footer'><button class='modal-action modal-close' data-id='" + data._id + "' id='savenote'>Save Note</button><div>");

        // If there's a note in the article
        if (data.note) {
          // Place the title of the note in the title input
          $("#titleinput").val(data.note.title);
          // Place the body of the note in the body textarea
          $("#bodyinput").val(data.note.body);
        }
      });

  });


//Save a
  $(document).on("click", "#save", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/saved/" + thisId
    })
      // With that done
      .done(function(data) {
        // Log the response
        console.log(data);
        // Empty the notes section
      });

  });


  $(document).on("click", "#delete", function() {

    var thisId = $(this).attr("data-id");
    console.log("This is the ID:" + thisId);
    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/delete/" + thisId
    })
      // With that done
      .done(function(data) {
        // Log the response
        console.log(data);

      });

  });




  // When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  $('#modal1').modal('close');
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

$(document).ready(function(){
  $('.tooltipped').tooltip({delay: 50});
});
