// hine-todo.js
Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Meteor.subscribe("tasks");
  // This code only runs on the client
  Template.body.helpers({
    tasks: function () {
      return Tasks.find({}, {sort: {createdAt: -1}});
    },
    weeklyTasks: function() {
      return Tasks.find({}, {sort: {createdAt: -1}});
    },
    incompleteCount: function() {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // This is called when a new task is created
      var text = event.target.text.value;

      Meteor.call("addTask", text);

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
  addTask: function(text) {
    if(!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
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
