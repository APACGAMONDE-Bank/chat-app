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
        var error = '',
            count = 0;
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
        return error;
    },

    validateChannel: function(channels, clientId, channelName) {
        var error = '',
            count = 0;
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
                    error = 'Maximum number of channels exceeded, try again later';
                    break;
                }
            }
        }
        return error;
    },

    deleteUser: function(users, clientId) {
        logger.debug('Deleting user: ' + JSON.stringify(users[clientId]));
        delete users[clientId];
        logger.debug('Users: ' + JSON.stringify(users));
    },

    deleteChannel: function(channels, key) {
        logger.debug('Deleting channel: ' + JSON.stringify(channels[key]));
        delete channels[key];
        logger.debug('Channels: ' + JSON.stringify(channels));
    }

};