'use strict';

var mocha = require('mocha');
var should = require('chai').should();
var sinon = require('sinon');
var io = require('socket.io-client');
var config = require('../config');

var socketURL = 'http://localhost:' + config.PORT;
var options = {
    transports: ['websocket'],
    'force new connection': true,
    reconnection: false
};

var DELAY = 10; // ms

describe('Chat server', function() {
    var client1,
        client2,
        username1 = 'User 1',
        username2 = 'User 2',
        spyMessageNew1 = sinon.spy(),
        spyUpdateUsers1 = sinon.spy(),
        spyUpdateChannels1 = sinon.spy(),
        spyMessageNew2 = sinon.spy(),
        spyUpdateUsers2 = sinon.spy(),
        spyUpdateChannels2 = sinon.spy();

    function resetSpies() {
        spyMessageNew1.reset();
        spyUpdateUsers1.reset();
        spyUpdateChannels1.reset();
        spyMessageNew2.reset();
        spyUpdateUsers2.reset();
        spyUpdateChannels2.reset();
    }

    beforeEach(function(done) {
        client1 = io.connect(socketURL, options);
        client1.on('message:new', spyMessageNew1);
        client1.on('update-users', spyUpdateUsers1);
        client1.on('update-channels', spyUpdateChannels1);
        client1.on('connect', function() {
            client2 = io.connect(socketURL, options);
            client2.on('message:new', spyMessageNew2);
            client2.on('update-users', spyUpdateUsers2);
            client2.on('update-channels', spyUpdateChannels2);
            client2.on('connect', function() {
                done();
            });
        });
    });

    afterEach(function(done) {
        client1.on('disconnect', function() {
            client2.disconnect();
        });
        client2.on('disconnect', function() {
            done();
        });
        client1.disconnect();
    });

    describe('on client connection', function() {
        it('should emit initial users list', function(done) {
            var client3 = io.connect(socketURL, options);
            client3.on('connect', function() {
                client3.on('update-users', function(users) {
                    users.should.be.an('array');
                    users.should.be.empty();
                    client3.disconnect();
                    done();
                });
            });
        });

        it('should emit initial channels list', function(done) {
            var client3 = io.connect(socketURL, options);
            client3.on('connect', function() {
                client3.on('update-channels', function(channels) {
                    channels.should.be.an('array');
                    channels.should.have.length(1);
                    channels[0].should.be.an('object');
                    channels[0].should.deep.equal({
                        name: 'Home',
                        description: 'The default channel',
                        usersTyping: []
                    });
                    client3.disconnect();
                    done();
                });
            });
        });
    });

    describe('on user login', function() {

        beforeEach(function() {
            resetSpies();
        });

        afterEach(function(done) {
            client1.emit('user:logout', function() {
                done();
            });
        });

        it('should notify user', function(done) {
            var message;
            client1.emit('user:login', username1, function() {
                spyMessageNew1.callCount.should.equal(1);
                message = spyMessageNew1.firstCall.args[0];
                message.should.have.property('text', 'You have connected to the chat server');
                message.should.have.property('username', null);
                message.time.should.be.ok();
                done();
            });
        });

        it('should notify other users in channel', function(done) {
            var message;
            function completeTest() {
                spyMessageNew1.callCount.should.equal(2);
                message = spyMessageNew1.secondCall.args[0];
                message.should.have.property('text', username2 + ' has joined chat');
                message.should.have.property('username', null);
                message.time.should.be.ok();
                client2.emit('user:logout', function() {
                    done();
                });
            }
            client1.emit('user:login', username1, function() {
                client2.emit('user:login', username2, function() {
                    setTimeout(completeTest, DELAY);
                });
            });
        });

        it('should emit updated users list', function(done) {
            var users;
            client1.emit('user:login', username1, function() {
                spyUpdateUsers1.callCount.should.equal(1);
                users = spyUpdateUsers1.firstCall.args[0];
                users.should.have.length(1);
                users[0].should.deep.equal({
                    name: username1,
                    avatar: '/img/placeholder-64x64.svg',
                    channel: 'default'
                });
                done();
            });
        });
    });

    describe('on user update', function() {
        var newUsername = 'New Name';

        beforeEach(function(done) {
            client1.emit('user:login', username1, function() {
                resetSpies();
                done();
            });
        });

        afterEach(function(done) {
            client1.emit('user:logout', function() {
                done();
            });
        });

        it('should notify user', function(done) {
            var message;
            client1.emit('user:update', newUsername, function() {
                spyMessageNew1.callCount.should.equal(1);
                message = spyMessageNew1.firstCall.args[0];
                message.should.have.property('text', 'You have changed your name to ' + newUsername);
                message.should.have.property('username', null);
                message.time.should.be.ok();
                done();
            });
        });

        it('should notify other users in channel', function(done) {
            var message;
            function completeTest() {
                spyMessageNew1.callCount.should.equal(2);
                message = spyMessageNew1.secondCall.args[0];
                message.should.have.property('text', username2 + ' has changed their name to ' + newUsername);
                message.should.have.property('username', null);
                message.time.should.be.ok();
                client2.emit('user:logout', function() {
                    done();
                });
            }
            client2.emit('user:login', username2, function() {
                client2.emit('user:update', newUsername, function() {
                    setTimeout(completeTest, DELAY);
                });
            });
        });

        it('should emit updated users list', function(done) {
            var users;
            function completeTest() {
                spyUpdateUsers1.callCount.should.equal(2);
                // before update
                users = spyUpdateUsers1.firstCall.args[0];
                users.should.have.length(2);
                users[1].should.deep.equal({
                    name: username2,
                    avatar: '/img/placeholder-64x64.svg',
                    channel: 'default'
                });
                // after update
                users = spyUpdateUsers1.secondCall.args[0];
                users.should.have.length(2);
                users[1].should.deep.equal({
                    name: newUsername,
                    avatar: '/img/placeholder-64x64.svg',
                    channel: 'default'
                });
                done();
            }
            client2.emit('user:login', username2, function() {
                client2.emit('user:update', newUsername, function() {
                    setTimeout(completeTest, DELAY);
                });
            });
        });
    });

    describe('on user logout', function() {

        beforeEach(function(done) {
            client1.emit('user:login', username1, function() {
                resetSpies();
                done();
            });
        });

        it('should notify user', function(done) {
            var message;
            client1.emit('user:logout', function() {
                spyMessageNew1.callCount.should.equal(1);
                message = spyMessageNew1.firstCall.args[0];
                message.should.have.property('text', 'You have left the chat server');
                message.should.have.property('username', null);
                message.time.should.be.ok();
                done();
            });
        });

        it('should notify other users in channel', function(done) {
            var message;
            function completeTest() {
                spyMessageNew1.callCount.should.equal(2);
                message = spyMessageNew1.secondCall.args[0];
                message.should.have.property('text', username2 + ' has left chat');
                message.should.have.property('username', null);
                message.time.should.be.ok();
                client1.emit('user:logout', function() {
                    done();
                });
            }
            client2.emit('user:login', username2, function() {
                client2.emit('user:logout', function() {
                    setTimeout(completeTest, DELAY);
                });
            });
        });

        it('should emit updated users list', function(done) {
            var users;
            client1.emit('user:logout', function() {
                spyUpdateUsers1.callCount.should.equal(1);
                users = spyUpdateUsers1.firstCall.args[0];
                users.should.be.empty();
                done();
            });
        });
    });

    describe('on channel create', function() {
        var newChannelName = 'New Channel',
            newChannelDescription = 'This is a new channel';

        beforeEach(function(done) {
            client1.emit('user:login', username1, function() {
                client2.emit('user:login', username2, function() {
                    resetSpies();
                    done();
                });
            });
        });

        afterEach(function(done) {
            client1.emit('user:logout', function() {
                client2.emit('user:logout', function() {
                    done();
                });
            });
        });

        it('should notify all users', function(done) {
            var message1,
                message2;
            function completeTest() {
                spyMessageNew1.callCount.should.equal(1);
                message1 = spyMessageNew1.firstCall.args[0];
                message1.should.have.property('text', username1 + ' created new channel ' + newChannelName);
                message1.should.have.property('username', null);
                message1.time.should.be.ok();

                spyMessageNew2.callCount.should.equal(1);
                message2 = spyMessageNew2.firstCall.args[0];
                message2.should.have.property('text', username1 + ' created new channel ' + newChannelName);
                message2.should.have.property('username', null);
                message2.time.should.be.ok();
                client1.emit('channel:delete', newChannelName, 'Home', function() {
                    done();
                });
            }
            client1.emit('channel:create', newChannelName, newChannelDescription, function() {
                setTimeout(completeTest, DELAY);
            });
        });

        it('should emit updated channels list', function(done) {
            var channels;
            client1.emit('channel:create', newChannelName, newChannelDescription, function() {
                client1.emit('channel:delete', newChannelName, 'Home', function() {
                    spyUpdateChannels1.callCount.should.equal(2);
                    channels = spyUpdateChannels1.firstCall.args[0];
                    channels.should.have.length(2);
                    channels[0].should.deep.equal({
                        name: 'Home',
                        description: 'The default channel',
                        usersTyping: []
                    });
                    channels[1].should.deep.equal({
                        name: newChannelName,
                        description: newChannelDescription,
                        usersTyping: []
                    });
                    spyUpdateChannels1.secondCall.args[0].should.have.length(1);
                    done();
                });
            });
        });
    });

});
