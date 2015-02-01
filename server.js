var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io');
var socket = io(http);
var moment = require('moment');
var log4js = require('log4js');
var config = require('./config');

log4js.configure(config.LOG4JS_CONFIG, {});
var logger = log4js.getLogger('dev');

var users = {};

// TODO:
// Add avatars (Gravatar?)
// Add {user} is typing functionality
// Add private messaging
// Better handle page refreshes and reconnections

app.use(log4js.connectLogger(logger, { level: 'auto' }));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(config.PORT, function() {
    logger.debug('starting chat server');
    logger.debug('listening on localhost:' + config.PORT);
});

socket.on('connection', function(client) {

    client.emit('update-users', users);

    client.on('join', function(username) {
        logger.debug(username + " requesting to join");
        
        var update = users[client.id] !== undefined ? true : false
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
            delete key;
        }
        delete users[clientId];
    }
    
});


