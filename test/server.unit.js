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
    var client1, client2, client3,
        username1 = 'User 1',
        username2 = 'User 2';

    beforeEach(function(done) {
        client1 = io.connect(socketURL, options);
        client1.on('connect', function() {
            client2 = io.connect(socketURL, options);
            client2.on('connect', function() {
                done();
            });
        });
    });

    afterEach(function() {
        client1.disconnect();
        client2.disconnect();
    });

    describe('on client connection', function() {
        it('should emit initial users list', function(done) {
            client3 = io.connect(socketURL, options);
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
            client3 = io.connect(socketURL, options);
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
        it('should notify user', function(done) {
            client1.on('message:new', function(message) {
                message.should.have.property('text', 'You have connected to the chat server');
                message.should.have.property('username', null);
                message.time.should.be.ok();
                done();
            });
            client1.emit('user:login', username1, function() {});
        });

        it('should notify other users in channel', function(done) {
            var spy = sinon.spy(),
                message;
            function completeTest() {
                spy.calledTwice.should.be.true();
                message = spy.secondCall.args[0];
                message.should.have.property('text', username2 + ' has joined chat');
                message.should.have.property('username', null);
                message.time.should.be.ok();
                done();
            }
            client1.on('message:new', spy);
            client1.emit('user:login', username1, function() {
                client2.emit('user:login', username2, function() {
                    setTimeout(completeTest, DELAY);
                });
            });
        });

        it('should emit updated users list', function(done) {
            client1.on('update-users', function(users) {
                users.should.have.length(1);
                users[0].should.deep.equal({
                    name: username1,
                    avatar: '/img/placeholder-64x64.svg',
                    channel: 'default'
                });
                done();
            });
            client1.emit('user:login', username1, function() {});
        });
    });

    describe('on user update', function() {
        var newUsername = 'New Name';

        it('should notify user', function(done) {
            var spy = sinon.spy(),
                message;
            client1.on('message:new', spy);
            client1.emit('user:login', username1, function() {
                client1.emit('user:update', newUsername, function() {
                    spy.calledTwice.should.be.true();
                    message = spy.secondCall.args[0];
                    message.should.have.property('text', 'You have changed your name to ' + newUsername);
                    message.should.have.property('username', null);
                    message.time.should.be.ok();
                    done();
                });
            });
        });

        it('should notify other users in channel', function(done) {
            var spy = sinon.spy(),
                message;
            function completeTest() {
                spy.calledThrice.should.be.true();
                message = spy.thirdCall.args[0];
                message.should.have.property('text', username2 + ' has changed their name to ' + newUsername);
                message.should.have.property('username', null);
                message.time.should.be.ok();
                done();
            }
            client1.on('message:new', spy);
            client1.emit('user:login', username1, function() {
                client2.emit('user:login', username2, function() {
                    client2.emit('user:update', newUsername, function() {
                        setTimeout(completeTest, DELAY);
                    });
                });
            });
        });

        it('should emit updated users list', function(done) {
            var spy = sinon.spy(),
                users;
            function completeTest() {
                spy.calledThrice.should.be.true();
                // before update
                users = spy.secondCall.args[0];
                users.should.have.length(2);
                users[1].should.deep.equal({
                    name: username2,
                    avatar: '/img/placeholder-64x64.svg',
                    channel: 'default'
                });
                // after update
                users = spy.thirdCall.args[0];
                users.should.have.length(2);
                users[1].should.deep.equal({
                    name: newUsername,
                    avatar: '/img/placeholder-64x64.svg',
                    channel: 'default'
                });
                done();
            }
            client1.on('update-users', spy);
            client1.emit('user:login', username1, function() {
                client2.emit('user:login', username2, function() {
                    client2.emit('user:update', newUsername, function() {
                        setTimeout(completeTest, DELAY);
                    });
                });
            });
        });
    });

    describe('on user logout', function() {
        var spy = sinon.spy();

        beforeEach(function(done) {
            spy.reset();
            client1.on('message:new', spy);
            client1.emit('user:login', username1, function() {
                done();
            });
        });

        it('should notify user', function(done) {
            var message;
            client1.emit('user:logout', function() {
                spy.calledTwice.should.be.true();
                message = spy.secondCall.args[0];
                message.should.have.property('text', 'You have left the chat server');
                message.should.have.property('username', null);
                message.time.should.be.ok();
                done();
            });
        });

        it('should notify other users in channel', function(done) {
            var message;
            function completeTest() {
                spy.calledThrice.should.be.true();
                message = spy.thirdCall.args[0];
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
            client1.on('update-users', function(users) {
                users.should.be.empty();
                done();
            });
            client1.emit('user:logout', function() {});
        });
    });

});
