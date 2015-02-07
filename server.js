'use strict';

// Vendor packages
var express = require('express');
var http = require('http');
var io = require('socket.io');
var moment = require('moment');
var log4js = require('log4js');

// Configuration
var config = require('./config');

// Setup logging
log4js.configure(config.LOG4JS_CONFIG, {});
var logger = log4js.getLogger('dev');

// Setup server
var app = express();
var server = http.Server(app);
var socket = io(server);

// Globals
var users = {};
var usersTyping = [];

// TODO:
// Add avatars (Gravatar?)
// Add {user} is typing functionality for multiple users
// Add private messaging
// Add multiple chat rooms
// Better handle page refreshes and reconnections
// Set up mongoDB

app.use(log4js.connectLogger(logger, { level: 'auto' }));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

server.listen(config.PORT, function() {
    logger.debug('starting chat server');
    logger.debug('listening on localhost:' + config.PORT);
});

socket.on('connection', function(client) {

    client.emit('update-users', getUsersArray());

    client.on('user:login', function(username) {
        logger.debug(username + ' requesting to join');
        var errorMessage = validateUsername(client.id, username);
        var newMessage;

        if (!errorMessage) {
            users[client.id] = {};
            users[client.id].name = username;
            users[client.id].avatar = '/img/placeholder-64x64.svg';
            newMessage = composeMessage('You have connected to the chat server', false);
            client.emit('message:new', newMessage);
            newMessage = composeMessage(username + ' has joined chat', false);
            client.broadcast.emit('message:new', newMessage);
            client.emit('user:login:success', username);
            logger.debug(username + ' successfully joined');

            socket.sockets.emit('update-users', getUsersArray());
        } else {
            client.emit('user:login:failure', errorMessage);
            logger.debug(username + ' failed to join: ' + errorMessage);
        }
    });

    client.on('user:update', function(newUsername) {
        var oldUsername = users[client.id].name;
        var errorMessage = validateUsername(client.id, newUsername);
        var newMessage;

        if (!errorMessage) {
            users[client.id].name = newUsername;
            newMessage = composeMessage('You have changed your name to ' + newUsername, false);
            client.emit('message:new', newMessage);
            newMessage = composeMessage(oldUsername + ' has changed their name to ' + newUsername, false);
            client.broadcast.emit('message:new', newMessage);
            client.emit('user:update:success', newUsername);
            logger.debug(oldUsername + ' successfully changed their name to ' + newUsername);

            socket.sockets.emit('update-users', getUsersArray());
        } else {
            client.emit('user:update:failure', errorMessage);
            logger.debug(newUsername + ' failed to update: ' + errorMessage);
        }
    });
    
    client.on('user:logout', function() {
        var newMessage = composeMessage('You have left the chat server', false);
        client.emit('message:new', newMessage);
        newMessage = composeMessage(users[client.id].name + ' has left chat', false);
        client.broadcast.emit('message:new', newMessage);
        logger.debug(users[client.id].name + ' left');
        deleteUser(client.id);
        socket.sockets.emit('update-users', getUsersArray());
    });
    
    client.on('message:send', function(message) {
        var newMessage = composeMessage(message, true);
        socket.sockets.emit('message:new', newMessage);
        logger.debug(newMessage.username + ' said ' + newMessage.text + ' at ' + newMessage.time);
    });
    
    client.on('user:typing', function() {
        usersTyping.push(users[client.id].name);
        socket.sockets.emit('update-users-typing', usersTyping);
    });
    
    client.on('user:typing:done', function() {
        var i = usersTyping.indexOf(users[client.id].name);
        usersTyping.splice(i, 1);
        socket.sockets.emit('update-users-typing', usersTyping);
    });
    
    client.on('disconnect', function() {
        if (users[client.id] !== undefined) {
            var newMessage = composeMessage(users[client.id].name + ' has left chat', false);
            socket.sockets.emit('message:new', newMessage);
            logger.debug(users[client.id].name + ' left');
            deleteUser(client.id);
            socket.sockets.emit('update-users', getUsersArray());
        }
    });

    function getUsersArray() {
        return Object.keys(users).map(function(clientId) {
            return users[clientId];
        });
    }

    function composeMessage(message, isUser) {
        var time = moment().format('h:mm a');
        return {
            username: isUser ? users[client.id].name : null,
            text: message,
            time: time
        };
    }
    
    function validateUsername(clientId, username) {
        var msg = '',
            count = 0;
        for (var id in users) {
            if (users.hasOwnProperty(id)) {
                if (users[id] && users[id].name === username && clientId !== id) {
                    msg = 'Username already in use';
                    break;
                }

                count++;
                if (count > config.MAX_USERS) {
                    msg = 'Too many users, try again later';
                    break;
                }
            }
        }
        return msg;
    }

    function deleteUser(clientId) {
        logger.debug('Deleting user ' + JSON.stringify(users[clientId]));
        for (var key in users[clientId]) {
            if (users[clientId].hasOwnProperty(key)) {
                delete users[clientId][key];
            }
        }
        delete users[clientId];
    }
    
});


