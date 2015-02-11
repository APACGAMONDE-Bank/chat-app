'use strict';

var logger = require('./logger');
var config = require('../config');

module.exports = {

    getUsersArray: function(users) {
        return Object.keys(users).map(function(clientId) {
            return users[clientId];
        });
    },

    getChannelsArray: function(channels) {
        return Object.keys(channels).map(function(key) {
            return channels[key];
        });
    },

    validateUsername: function(users, clientId, username) {
        var error = null,
            count = 0;
        if (!username) {
            error = 'Please provide a valid username';
        } else {
            for (var id in users) {
                if (users.hasOwnProperty(id)) {
                    count++;
                    if (users[id] && users[id].name === username && clientId !== id) {
                        error = 'Username `' + username + '` already in use';
                        break;
                    } else if (count > config.MAX_USERS) {
                        error = 'Too many users, try again later';
                        break;
                    }
                }
            }
        }
        return error;
    },

    validateChannel: function(channels, clientId, channelName) {
        var error = null,
            count = 0;
        if (!channelName) {
            error = 'Please provide a valid channel name';
        } else {
            for (var key in channels) {
                if (channels.hasOwnProperty(key)) {
                    count++;
                    if (key === clientId) {
                        error = 'You have already created a channel';
                        break;
                    } else if (channels[key] && channels[key].name === channelName) {
                        error = 'A channel with that name already exists';
                        break;
                    } else if (count > config.MAX_CHANNELS) {
                        error = 'Too many channels, try again later';
                        break;
                    }
                }
            }
        }
        return error;
    },

    deleteUser: function(users, clientId) {
        if (users.hasOwnProperty(clientId)) {
            logger.debug('Deleting user: ' + JSON.stringify(users[clientId]));
            delete users[clientId];
        } else {
            logger.error('Client id `' + clientId + '` not in users');
        }
        logger.debug('Users: ' + JSON.stringify(users));
    },

    deleteChannel: function(channels, key) {
        if (channels.hasOwnProperty(key)) {
            logger.debug('Deleting channel: ' + JSON.stringify(channels[key]));
            delete channels[key];
        } else {
            logger.error('Channel key `' + key + '` not in channels');
        }
        logger.debug('Channels: ' + JSON.stringify(channels));
    }

};