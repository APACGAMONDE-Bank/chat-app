'use strict';

// Vendor packages
var express = require('express');
var http = require('http');
var socketio = require('socket.io');
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
var io = socketio(server);

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
io.on('connection', function(socket) {
    logger.debug('Client connection: ' + socket.id);

    socket.emit('update-users', utils.getUsersArray(users));
    socket.emit('update-channels', utils.getChannelsArray(channels));

    socket.on('user:login', function(username, callback) {
        logger.debug(username + ' requesting to join');
        var errorMessage = utils.validateUsername(users, socket.id, username),
            newMessage;

        if (!errorMessage) {
            // create new User and join the default channel
            users[socket.id] = new User(username);
            socket.join(channels.default.name);

            newMessage = new Message('You have connected to the chat server');
            socket.emit('message:new', newMessage);
            newMessage = new Message(username + ' has joined chat');
            socket.broadcast.to(channels.default.name).emit('message:new', newMessage);

            io.sockets.emit('update-users', utils.getUsersArray(users));
            logger.debug(username + ' successfully logged in');
            logger.debug('Users: ' + JSON.stringify(users));
            callback();
        } else {
            callback(errorMessage);
            logger.debug(username + ' failed to login: ' + errorMessage);
        }
    });

    socket.on('user:update', function(newUsername, callback) {
        var oldUsername = users[socket.id].name,
            errorMessage = utils.validateUsername(users, socket.id, newUsername),
            newMessage;

        if (!errorMessage) {
            users[socket.id].name = newUsername;

            newMessage = new Message('You have changed your name to ' + newUsername);
            socket.emit('message:new', newMessage);
            newMessage = new Message(oldUsername + ' has changed their name to ' + newUsername);
            socket.broadcast.emit('message:new', newMessage);

            io.sockets.emit('update-users', utils.getUsersArray(users));
            logger.debug(oldUsername + ' successfully changed their name to ' + newUsername);
            callback();
        } else {
            callback(errorMessage);
            logger.debug(newUsername + ' failed to update: ' + errorMessage);
        }
    });
    
    socket.on('user:logout', function(callback) {
        var channelName = channels[users[socket.id].channel].name,
            newMessage;

        socket.leave(channelName);
        logger.debug(users[socket.id].name + ' left channel ' + channelName);

        newMessage= new Message('You have left the chat server');
        socket.emit('message:new', newMessage);
        newMessage = new Message(users[socket.id].name + ' has left chat');
        socket.broadcast.emit('message:new', newMessage);

        logger.debug(users[socket.id].name + ' logged out');
        utils.deleteUser(users, socket.id);
        io.sockets.emit('update-users', utils.getUsersArray(users));
        callback();
    });

    socket.on('channel:join', function(channel, callback) {
        var oldChannelName = channels[users[socket.id].channel].name,
            newMessage;

        socket.leave(oldChannelName);
        newMessage = new Message(users[socket.id].name + ' has left the channel');
        socket.broadcast.to(oldChannelName).emit('message:new', newMessage);
        logger.debug(users[socket.id].name + ' left channel ' + oldChannelName);

        socket.join(channel);
        newMessage = new Message(users[socket.id].name + ' has joined the channel');
        socket.broadcast.to(channel).emit('message:new', newMessage);
        logger.debug(users[socket.id].name + ' joined channel ' + channel);

        for (var key in channels) {
            if (channels.hasOwnProperty(key) && channels[key].name === channel) {
                users[socket.id].joinChannel(key);
                break;
            }
        }
        callback();
    });

    socket.on('channel:create', function(name, description, callback) {
        var errorMessage = utils.validateChannel(channels, socket.id, name),
            newMessage;

        if (!errorMessage) {
            channels[socket.id] = new Channel(name, description);
            logger.debug(users[socket.id].name + ' created channel: ' + JSON.stringify(channels[socket.id]));

            newMessage = new Message(users[socket.id].name + ' created new channel ' + name);
            io.sockets.emit('message:new', newMessage);
            io.sockets.emit('update-channels', utils.getChannelsArray(channels));
            logger.debug('Channels: ' + JSON.stringify(channels));
            callback();
        } else {
            callback(errorMessage);
            logger.debug(users[socket.id].name + ' failed to create channel: ' + errorMessage);
        }
    });

    socket.on('channel:delete', function(name, currChannel, callback) {
        var socketIds = io.sockets.adapter.rooms[name],
            client,
            newMessage,
            newChannel = (name === currChannel ? channels.default.name : currChannel);

        for (var socketId in socketIds) { /* jshint ignore: line */
            client = io.sockets.adapter.nsp.connected[socketId];
            client.leave(name);
            logger.debug(users[client.id].name + ' left channel ' + name);

            client.join(channels.default.name);
            users[client.id].channel = 'default';
            newMessage = new Message(users[client.id].name + ' has joined the channel');
            client.broadcast.to(channels.default.name).emit('message:new', newMessage);
            logger.debug(users[client.id].name + ' joined channel ' + channels.default.name);

            client.emit('channel:change', channels.default.name);
        }
        utils.deleteChannel(channels, socket.id);
        newMessage = new Message(users[socket.id].name + ' deleted channel ' + name);
        io.sockets.emit('message:new', newMessage);
        io.sockets.emit('update-channels', utils.getChannelsArray(channels));
        callback(null, newChannel);
    });
    
    socket.on('message:send', function(message) {
        var channelName = channels[users[socket.id].channel].name,
            newMessage = new Message(message, users[socket.id].name);

        io.to(channelName).emit('message:new', newMessage);
        logger.debug('Sent message to channel ' + channelName + ': ' + JSON.stringify(newMessage));
    });
    
    socket.on('user:typing', function() {
        var channel = channels[users[socket.id].channel];

        channel.addUserTyping(users[socket.id].name);
        io.to(channel.name).emit('update-users-typing', channel.usersTyping);
    });
    
    socket.on('user:typing:done', function() {
        var channel = channels[users[socket.id].channel];

        channel.removeUserTyping(users[socket.id].name);
        io.to(channel.name).emit('update-users-typing', channel.usersTyping);
    });
    
    socket.on('disconnect', function() {
        if (users[socket.id] !== undefined) {
            var newMessage = new Message(users[socket.id].name + ' has left chat');
            io.sockets.emit('message:new', newMessage);

            logger.debug(users[socket.id].name + ' disconnected');
            utils.deleteUser(users, socket.id);
            io.sockets.emit('update-users', utils.getUsersArray(users));
        }
    });

});
