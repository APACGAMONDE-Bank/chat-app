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
                    error = 'Username already in use';
                    break;
                } else if (count > config.MAX_USERS) {
                    error = 'Too many users, try again later';
                    break;
                }
            }
        }
        return error;
    },

    deleteUser: function(users, clientId) {
        logger.debug('Deleting user ' + JSON.stringify(users[clientId]));
        delete users[clientId];
    }
};