'use strict';

// Vendor packages
var express = require('express');
var http = require('http');
var io = require('socket.io');
var log4js = require('log4js');

// Configuration
var config = require('./config');

// Models
var User = require('./app/models').User;
var Message = require('./app/models').Message;
var Channel = require('./app/models').Channel;

// Setup logging
log4js.configure(config.LOG4JS_CONFIG, {});
var logger = log4js.getLogger('dev');

// Setup server
var app = express();
var server = http.Server(app);
var socket = io(server);

// Globals
var users = {};
var channels = {
    default: new Channel('Home', 'The default channel'),
    test: new Channel('Test', 'This is a test channel')
};

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

// socket.io communication
socket.on('connection', function(client) {

    client.emit('update-users', getUsersArray());
    client.emit('update-channels', getChannelsArray());

    client.on('user:login', function(username) {
        logger.debug(username + ' requesting to join');
        var errorMessage = validateUsername(client.id, username),
            newMessage;

        if (!errorMessage) {
            // create new User and join the default channel
            users[client.id] = new User(username);
            client.join(channels.default.name);

            newMessage = new Message('You have connected to the chat server');
            client.emit('message:new', newMessage);
            newMessage = new Message(username + ' has joined chat');
            client.broadcast.to(channels.default.name).emit('message:new', newMessage);

            client.emit('user:login:success', username, channels.default.name);
            socket.sockets.emit('update-users', getUsersArray());
            logger.debug(username + ' successfully logged in');
        } else {
            client.emit('user:login:failure', errorMessage);
            logger.debug(username + ' failed to login: ' + errorMessage);
        }
    });

    client.on('user:update', function(newUsername) {
        var oldUsername = users[client.id].name,
            errorMessage = validateUsername(client.id, newUsername),
            newMessage;

        if (!errorMessage) {
            users[client.id].name = newUsername;

            newMessage = new Message('You have changed your name to ' + newUsername);
            client.emit('message:new', newMessage);
            newMessage = new Message(oldUsername + ' has changed their name to ' + newUsername);
            client.broadcast.emit('message:new', newMessage);

            client.emit('user:update:success', newUsername);
            socket.sockets.emit('update-users', getUsersArray());
            logger.debug(oldUsername + ' successfully changed their name to ' + newUsername);
        } else {
            client.emit('user:update:failure', errorMessage);
            logger.debug(newUsername + ' failed to update: ' + errorMessage);
        }
    });
    
    client.on('user:logout', function() {
        var channelName = channels[users[client.id].channel].name,
            newMessage;

        client.leave(channelName);
        logger.debug(users[client.id].name + ' left channel ' + channelName);

        newMessage= new Message('You have left the chat server');
        client.emit('message:new', newMessage);
        newMessage = new Message(users[client.id].name + ' has left chat');
        client.broadcast.emit('message:new', newMessage);

        logger.debug(users[client.id].name + ' logged out');
        deleteUser(client.id);
        socket.sockets.emit('update-users', getUsersArray());
    });

    client.on('channel:join', function(channel) {
        var oldChannelName = channels[users[client.id].channel].name,
            newMessage;

        client.leave(oldChannelName);
        newMessage = new Message(users[client.id].name + ' has left the channel');
        client.broadcast.to(oldChannelName).emit('message:new', newMessage);
        logger.debug(users[client.id].name + ' left channel ' + oldChannelName);

        client.join(channel);
        newMessage = new Message(users[client.id].name + ' has joined the channel');
        client.broadcast.to(channel).emit('message:new', newMessage);
        logger.debug(users[client.id].name + ' joined channel ' + channel);

        for (var key in channels) {
            if (channels.hasOwnProperty(key) && channels[key].name === channel) {
                users[client.id].joinChannel(key);
                break;
            }
        }
        client.emit('channel:join:success', channel);
    });
    
    client.on('message:send', function(message) {
        var channelName = channels[users[client.id].channel].name,
            newMessage = new Message(message, users[client.id].name);

        socket.to(channelName).emit('message:new', newMessage);
        logger.debug('Sent message to channel ' + channelName + ': ' + JSON.stringify(newMessage));
    });
    
    client.on('user:typing', function() {
        var channel = channels[users[client.id].channel];

        channel.addUserTyping(users[client.id].name);
        socket.to(channel.name).emit('update-users-typing', channel.usersTyping);
    });
    
    client.on('user:typing:done', function() {
        var channel = channels[users[client.id].channel];

        channel.removeUserTyping(users[client.id].name);
        socket.to(channel.name).emit('update-users-typing', channel.usersTyping);
    });
    
    client.on('disconnect', function() {
        if (users[client.id] !== undefined) {
            var newMessage = new Message(users[client.id].name + ' has left chat');
            socket.sockets.emit('message:new', newMessage);

            deleteUser(client.id);
            socket.sockets.emit('update-users', getUsersArray());
            logger.debug(users[client.id].name + ' disconnected');
        }
    });

    function getUsersArray() {
        return Object.keys(users).map(function(clientId) {
            return users[clientId];
        });
    }

    function getChannelsArray() {
        return Object.keys(channels).map(function(key) {
            return channels[key];
        });
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
        delete users[clientId];
    }
    
});
