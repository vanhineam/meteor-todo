// hine-todo.js

// Creates the database collection from mongodb
Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  // All of this code will run only on the client

  /*
   *  Meteor uses publishing and subscribing to documents. When the client
   *  subscribes to a collection, it copies all of the data to the client.
   *  The client can then access functions suck as "find" on the document.
   */
  Meteor.subscribe("tasks");

  /* The helper methods for the "Header" template. This is how you pass
   * the data to the template from the server. Here you are able to access
   * 'incompleteCount' in the template by using handlebars notation
   * {{incompleteCount}}
   */
  Template.Header.helpers({
    incompleteCount: function() {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  // The helper for the "Daily" template
  Template.Daily.helpers({
    tasks: function () {
      return Tasks.find({}, {sort: {createdAt: -1}});
    }
  });

  /*
   * The rendered attribute of a template is equivelant of the 
   * $(document).ready but for templates. The function runs when the tempalte
   * has been completely rendered.
   */
  Template.inputForm.rendered = function(){
    Meteor.setTimeout(function() {
      var picker = new Pikaday({
        field: $('#datepicker')[0],
        trigger: $('#dateButton')[0],
        format: 'MM/DD/YYYY',
        onSelect: function() {
        }
      });
    }, 1000);
  };

  /*
   * The events is an event map that is passed to the template and assigns 
   * actions to the specified DOM elements.
   *
   */
  Template.inputForm.events({
    // When you hit enter on the input form, submit the data.
    "keypress .new-task": function (event,template) {
      if(event.which === 13){
        // Prevent default is needed to prevent the form from acting as it 
        // usually does. This is similar to @Override in java.
        event.preventDefault();
        event.stopPropagation();

        // Get the values from the input field and datepicker.
        var text = template.find("#taskText").value;
        var dateObj = new Date(template.find("#datepicker").value);

        // If the datepicker has not been selected, set the tasks due date to 
        // today
        if(template.find("#datepicker").value == "") {
          dateObj = new Date();
        }

        var day = dateObj.getDay();

        // Makes a call to the server to add the task
        Meteor.call("addTask", text, day, dateObj);

        // Clear the form
        template.find("#taskText").value = "";
        template.find("#datepicker").value = "";

        return false;
      }
    }
  });

  // Events for the "task" template
  Template.task.events({
    "click .toggle-checked": function() {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function() {
      // Deletes the task from the database and clears it from tasks
      Meteor.call("deleteTask", this._id);
    }
  });

  // Events for the "weekentry" template
  Template.weekentry.events({
    "click .toggle-checked": function() {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function() {
      // Deletes the task from the database and clears it from tasks
      Meteor.call("deleteTask", this._id);
    }
  });

  /*
   * For the weekly tasks table I created a template for each day that creates 
   * a list of tasks that have been assigned to taht day. It gets these tasks
   * by calling weekTask, which queries the db for the entries that correspond
   * to that day of the week.
   */
  Template.sunday.helpers({
    tasks: function() {
      return weekTask(0);
    }
  });

  Template.monday.helpers({
    tasks: function() {
      return weekTask(1);
    }
  });

  Template.tuesday.helpers({
    tasks: function() {
      return weekTask(2);
    }
  });

  Template.wednesday.helpers({
    tasks: function() {
      return weekTask(3);
    }
  });

  Template.thursday.helpers({
    tasks: function() {
      return weekTask(4);
    }
  });

  Template.friday.helpers({
    tasks: function() {
      return weekTask(5);
    }
  });

  Template.saturday.helpers({
    tasks: function() {
      return weekTask(6);
    }
  });

  /*
   * The helpers for the Monthly template.
   *
   * This helper returns the options for the calendar that I used for the month
   * view. This specifies the format of the time, and most importantly, the 
   * data that will be rendered on the calendar. Because the calendar plugin
   * that I used needs the data in a specific format, I query for the data,
   * put parse the data into the task's "text" and "date". This renders a box
   * on that date, with the text in the box.
   *
   */
  Template.Monthly.helpers({    
    options: function() {
      var results = new Array();
      var events = getMonthlyTasks();
      $.each(events, function(index, value) {
        var temp = {
          title: '',
          start: ''
        };
        temp.title = value.text;
        var date = value.date;
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var dateString = year + '-' + month + '-' + day;
        temp.start = dateString;
        results.push(temp);
      });
      return {
        events: results,
        timeFormat: ''
      }
    }
  });

  // Account configuration info
  Accounts.ui.config({
    // Don't require an email for the user accounts
    passwordSignupFields: "USERNAME_ONLY"
  });

  // Helper function for each day's template.
  function weekTask(weekday) {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var day = today.getDate() - today.getDate();
    var start = new Date(year, month, day);

    var end = new Date(year, month, day + 7);
    // Query for tasks whose day of the week == 'weekday' and is this week.
    return Tasks.find({date: {$gte: start, $lt : end}, day: weekday});
  }

  function getMonthlyTasks() {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var start = new Date(year, month-1, 0);
    console.log(start);

    var end = new Date(year, month);
    console.log(end);
    // Query all the tasks for this monthadf
    return Tasks.find({date: {$gt : start, $lt : end}}).fetch();
  }
}

/*
 * When meteor methods are called, two things happen.
 * 1. The client sends a request to the server to run the method in a secure
 *    environment, just like an AJAX request would work.
 *
 * 2. A simulation of the method runs directly on the client to attempt to 
 *    predict the outcome of the server call using the available information.
 * 
 * This makes the task appear on the screen before it is actually entered in the
 * database. This is called latency compensation.
 * If the server result is different from what was added to the site, the site
 * patches to reflect the actual state of the server. This allows for both 
 * security and speed.
 */
Meteor.methods({
  addTask: function(text, day, date) {
    if(!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      day: day,
      date: date,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username || Meteor.user().profile.name
    });
  },
  deleteTask: function(taskId) {
    Tasks.remove(taskId);
  },
  setChecked: function(taskId, setChecked) {
    Tasks.update(taskId, { $set: { checked: setChecked }});
  }
});

if(Meteor.isServer) {
  // Code here only runs on the server
  
  /* Publishing the tasks data makes the data available to be subscribed to on
   *  the client.
   */
  Meteor.publish("tasks", function() {
    return Tasks.find({owner: this.userId});
  });
}

/*
 * This is the routing that I have used. It uses the main "hine-todo.html"
 * as the default and renders the templates designated into the body. The
 * first argument passed to route is the url to route, and the second is a
 * function that renders the template.
 */
Router.route('/', function () {
  this.render('Daily');
});

Router.route('/weekly', function() {
  this.render('Weekly');
});

Router.route('/monthly', function() {
  this.render('Monthly');
});