'use strict';

// Vendor packages
var express = require('express');
var http = require('http');
var io = require('socket.io');
var log4js = require('log4js');

// Configuration
var config = require('./config');

// Logger
var logger = require('./app/logger');

// Models
var User = require('./app/models').User;
var Message = require('./app/models').Message;
var Channel = require('./app/models').Channel;

var utils = require('./app/utils');

// Setup server
var app = express();
var server = http.Server(app);
var socket = io(server);

// Globals
var users = {};
var channels = {
    default: new Channel('Home', 'The default channel')
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
    logger.debug('Client connection: ' + client.id);

    client.emit('update-users', utils.getUsersArray(users));
    client.emit('update-channels', utils.getChannelsArray(channels));

    client.on('user:login', function(username, callback) {
        logger.debug(username + ' requesting to join');
        var errorMessage = utils.validateUsername(users, client.id, username),
            newMessage;

        if (!errorMessage) {
            // create new User and join the default channel
            users[client.id] = new User(username);
            client.join(channels.default.name);

            newMessage = new Message('You have connected to the chat server');
            client.emit('message:new', newMessage);
            newMessage = new Message(username + ' has joined chat');
            client.broadcast.to(channels.default.name).emit('message:new', newMessage);

            socket.sockets.emit('update-users', utils.getUsersArray(users));
            callback();
            logger.debug(username + ' successfully logged in');
        } else {
            callback(errorMessage);
            logger.debug(username + ' failed to login: ' + errorMessage);
        }
    });

    client.on('user:update', function(newUsername, callback) {
        var oldUsername = users[client.id].name,
            errorMessage = utils.validateUsername(users, client.id, newUsername),
            newMessage;

        if (!errorMessage) {
            users[client.id].name = newUsername;

            newMessage = new Message('You have changed your name to ' + newUsername);
            client.emit('message:new', newMessage);
            newMessage = new Message(oldUsername + ' has changed their name to ' + newUsername);
            client.broadcast.emit('message:new', newMessage);

            socket.sockets.emit('update-users', utils.getUsersArray(users));
            callback();
            logger.debug(oldUsername + ' successfully changed their name to ' + newUsername);
        } else {
            callback(errorMessage);
            logger.debug(newUsername + ' failed to update: ' + errorMessage);
        }
    });
    
    client.on('user:logout', function(callback) {
        var channelName = channels[users[client.id].channel].name,
            newMessage;

        client.leave(channelName);
        logger.debug(users[client.id].name + ' left channel ' + channelName);

        newMessage= new Message('You have left the chat server');
        client.emit('message:new', newMessage);
        newMessage = new Message(users[client.id].name + ' has left chat');
        client.broadcast.emit('message:new', newMessage);

        logger.debug(users[client.id].name + ' logged out');
        utils.deleteUser(users, client.id);
        socket.sockets.emit('update-users', utils.getUsersArray(users));
        callback();
    });

    client.on('channel:join', function(channel, callback) {
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
        callback();
    });

    client.on('channel:create', function(name, description, callback) {
        var errorMessage = utils.validateChannel(channels, client.id, name),
            newMessage;

        if (!errorMessage) {
            channels[client.id] = new Channel(name, description);
            logger.debug(users[client.id].name + ' created channel: ' + JSON.stringify(channels[client.id]));

            newMessage = new Message(users[client.id].name + ' created new channel ' + name);
            socket.sockets.emit('message:new', newMessage);
            socket.sockets.emit('update-channels', utils.getChannelsArray(channels));
            callback();
        } else {
            callback(errorMessage);
            logger.debug(users[client.id].name + ' failed to create channel: ' + errorMessage);
        }
    });

    client.on('channel:delete', function(name, currChannel, callback) {
        var clientIds = socket.sockets.adapter.rooms[name],
            cli,
            newMessage,
            newChannel = (name === currChannel ? channels.default.name : currChannel);

        for (var id in clientIds) { /* jshint ignore: line */
            cli = socket.sockets.adapter.nsp.connected[id];
            cli.leave(name);
            logger.debug(users[cli.id].name + ' left channel ' + name);

            cli.join(channels.default.name);
            users[cli.id].channel = 'default';
            newMessage = new Message(users[cli.id].name + ' has joined the channel');
            cli.broadcast.to(channels.default.name).emit('message:new', newMessage);
            logger.debug(users[cli.id].name + ' joined channel ' + channels.default.name);

            cli.emit('channel:change', channels.default.name);
        }
        utils.deleteChannel(channels, client.id);
        newMessage = new Message(users[client.id].name + ' deleted channel ' + name);
        socket.sockets.emit('message:new', newMessage);
        socket.sockets.emit('update-channels', utils.getChannelsArray(channels));
        callback(null, newChannel);
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

            logger.debug(users[client.id].name + ' disconnected');
            utils.deleteUser(users, client.id);
            socket.sockets.emit('update-users', utils.getUsersArray(users));
        }
    });

});
