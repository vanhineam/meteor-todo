// hine-todo.js
Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Meteor.subscribe("tasks");
  // This code only runs on the client
  Template.Daily.helpers({
    tasks: function () {
      return Tasks.find({}, {sort: {createdAt: -1}});
    }
  });

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

  Template.Header.helpers({
    incompleteCount: function() {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

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

  function weekTask(weekday) {
    var start = new Date();
    var year = start.getFullYear();
    var month = start.getMonth();
    var day = start.getDate() + 7;

    var end = new Date(year, month, day);
    return Tasks.find({date: {$gte: start, $lt : end}, day: weekday});
  }

  Template.inputForm.events({
    "keypress .new-task": function (event,template) {
      if(event.which === 13){
        event.preventDefault();
        event.stopPropagation();
        // This is called when a new task is created
        var text = template.find("#taskText").value;
        var dateObj = new Date(template.find("#datepicker").value);
        if(template.find("#datepicker").value == "") {
          dateObj = new Date();
        }
        var day = dateObj.getDay();

        Meteor.call("addTask", text, day, dateObj);

        // Clear the form
        
        template.find("#taskText").value = "";

        return false;
      }
    }
  });

  Template.task.events({
    "click .toggle-checked": function() {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function() {
      Meteor.call("deleteTask", this._id);
    }
  });

  Template.weekentry.events({
    "click .toggle-checked": function() {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function() {
      Meteor.call("deleteTask", this._id);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

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

  function getMonthlyTasks() {
    var start = new Date();
    var year = start.getFullYear();
    var month = start.getMonth() + 1;
    var end = new Date(year, month);
    return Tasks.find({date: {$gte : start, $lt : end}}).fetch();
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
  Meteor.publish("tasks", function() {
    return Tasks.find({owner: this.userId});
  });
}

Router.route('/', function () {
  this.render('Daily');
});

Router.route('/weekly', function() {
  this.render('Weekly');
});

Router.route('/monthly', function() {
  this.render('Monthly');
});