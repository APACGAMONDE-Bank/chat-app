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

// TODO:
// Add avatars (Gravatar?)
// Add {user} is typing functionality for multiple users
// Add private messaging
// Add multiple chat rooms
// Better handle page refreshes and reconnections
// Set up mongoDB
// Refactor client.js to use ReactJS
//  - browserify
// Add grunt tasks

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

    client.emit('update-users', users);

    client.on('join', function(username) {
        logger.debug(username + " requesting to join");
        
        var update = users[client.id] !== undefined;
        var old_username = update ? users[client.id]['name'] : null;
        var error_msg = validate_username(client.id, username);
        
        if (!error_msg) {
            if (update) {
                users[client.id]['name'] = username;
                client.emit('update-message', "You have changed your name to " + username);
                client.broadcast.emit('update-message', old_username + " has changed their name to " + username);
                client.emit('join:update');
                logger.debug(old_username + " successfully changed their name to " + username);
            } else {
                users[client.id] = {};
                users[client.id]['name'] = username;
                client.emit('update-message', "You have connected to the chat server");
                client.broadcast.emit('update-message', username + " has joined chat");
                client.emit('join:success');
                logger.debug(username + " successfully joined");
            }
            socket.sockets.emit('update-users', users);
        } else {
            client.emit('join:failure', error_msg);
            logger.debug(username + " failed to join: " + error_msg);
        }
    });
    
    client.on('leave', function() {
        client.emit('update-message', "You have left the chat server");
        client.broadcast.emit('update-message', users[client.id]['name'] + " has left chat");
        logger.debug(users[client.id]['name'] + " left");
        delete_user(client.id);
        socket.sockets.emit('update-users', users);
    });
    
    client.on('send-message', function(msg) {
        var time = moment().format('h:mm a');
        socket.sockets.emit('new-message', users[client.id]['name'], msg, time);
        logger.debug(users[client.id]['name'] + " said " + msg + " at " + time);
    });
    
    client.on('typing-message', function() {
        client.broadcast.emit('user-typing', users[client.id]['name']);
    });
    
    client.on('typing-message:done', function() {
        client.broadcast.emit('user-typing:done');
    });
    
    client.on('disconnect', function() {
        if (users[client.id] !== undefined) {
            socket.sockets.emit('update-message', users[client.id]['name'] + " has left chat");
            logger.debug(users[client.id]['name'] + " left");
            delete_user(client.id);
            socket.sockets.emit('update-users', users);
        }
    });
    
    function validate_username(clientId, username) {
        var msg = '',
            count = 0;
        for (var id in users) {
            if (users[id] && users[id]['name'] === username && clientId !== id) {
                msg = "Username already in use";
                break;
            }
            if (users.hasOwnProperty(id)) {
                count++;
            }
            if (count > config.MAX_USERS) {
                msg = "Too many users, try again later";
                break;
            }
        }
        return msg;
    }

    function delete_user(clientId) {
        logger.debug("Deleting user " + JSON.stringify(users[clientId]));
        for (var key in users[clientId]) {
            if (users[clientId].hasOwnProperty(key)) {
                delete users[clientId][key];
            }
        }
        delete users[clientId];
    }
    
});


