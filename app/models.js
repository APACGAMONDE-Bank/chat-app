'use strict';

var moment = require('moment');

// User model
var User = function User(name) {
    this.name = name;
    this.avatar = '/img/placeholder-64x64.svg';
    this.channel = 'default';
};

User.prototype.joinChannel = function(channel) {
    this.channel = channel;
};

// Message model
var Message = function Message(message, username) {
    this.text = message;
    this.username = username || null;
    this.time = moment().format('h:mm a');
};

// Channel Model
var Channel = function Channel(name, description) {
    this.name = name;
    this.description = description;
    this.usersTyping = [];
};

Channel.prototype.addUserTyping = function(username) {
    this.usersTyping.push(username);
};

Channel.prototype.removeUserTyping = function(username) {
    var i = this.usersTyping.indexOf(username);
    this.usersTyping.splice(i, 1);
};

module.exports = {
    User: User,
    Message: Message,
    Channel: Channel
};
