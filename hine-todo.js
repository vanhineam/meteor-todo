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

  function weekTask(day) {
    return Tasks.find({day: day});
  }

  Template.Daily.events({
    "submit .new-task": function (event) {
      // This is called when a new task is created
      var text = event.target.text.value;
      var day = Math.round(Math.random() * (6 - 0) + 0);
      Meteor.call("addTask", text, day);

      // Clear the form
      event.target.text.value = "";

      return false;
    },
    "change .hide-completed input": function(event) {
      Session.set("hideCompleted", event.target.checked);
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
  addTask: function(text, day) {
    if(!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      day: day,
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