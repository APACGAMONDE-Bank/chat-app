'use strict';

// Vendors
window.$ = window.jQuery = require('jquery');
var bootstrap = require('bootstrap');
var io = require('socket.io-client');
var React = require('react');

// ReactJS components
var ChatBox = require('./components/ChatBox.jsx');
var UsersBox = require('./components/UsersBox.jsx');

// Setup socket.io connection
var client = io();

// Globals
var typingTimeout;

var ChatApp = React.createClass({

    getInitialState: function() {
        client.on('connect_error', this.onConnectError);
        client.on('reconnect', this.onReconnect);

        client.on('user:login:success', this.userLoginSuccess);
        client.on('user:login:failure', this.userLoginFailure);
        client.on('user:update:success', this.userUpdateSuccess);
        client.on('user:update:failure', this.userUpdateFailure);
        client.on('update-users', this.updateUsers);
        client.on('message:new', this.updateMessages);
        client.on('update-users-typing', this.updateUsersTyping);

        return {
            self: {username: null},
            users: [],
            messages: [],
            loggedIn: false,
            isTyping: false,
            usersTyping: [],
            alert: {error: false, message: ''}
        };
    },

    getDefaultProps: function() {
        return {
            typingTimeoutDelay: 5000
        }
    },

    onConnectError: function() {
        this.setState({
            loggedIn: false,
            isTyping: false,
            usersTyping: [],
            alert: {error: true, message: 'Connection to the server lost'}
        });
    },

    onReconnect: function() {
        this.setState({
            self: {username: null},
            users: [],
            messages: [],
            alert: {error: false, message: 'Successfully reconnected!'}
        });
    },

    onLogin: function(username) {
        client.emit('user:login', username);
    },

    onChangeUsername: function(username) {
        client.emit('user:update', username);
    },

    onMessageSubmit: function(message) {
        clearTimeout(typingTimeout);
        this.onUserDoneTyping();
        client.emit('message:send', message);
    },

    onLogout: function() {
        client.emit('user:logout');
        this.setState({
            self: {username: null},
            loggedIn: false
        });
    },

    onUserTyping: function() {
        if (!this.state.isTyping) {
            this.setState({isTyping: true});
            client.emit('user:typing');
            typingTimeout = setTimeout(this.onUserDoneTyping, this.props.typingTimeoutDelay);
        } else {
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(this.onUserDoneTyping, this.props.typingTimeoutDelay);
        }
    },

    onUserDoneTyping: function() {
        this.setState({isTyping: false});
        client.emit('user:typing:done');
    },

    userLoginSuccess: function(username) {
        this.setState({
            self: {username: username},
            loggedIn: true,
            alert: {error: false, message: ''}
        });
    },

    userLoginFailure: function(message) {
        this.setState({alert: {error: true, message: message}});
    },

    userUpdateSuccess: function(username) {
        this.setState({
            self: {username: username},
            alert: {error: false, message: ''}
        });
    },

    userUpdateFailure: function(message) {
        this.setState({alert: {error: true, message: message}});
    },

    updateUsers: function(users) {
        this.setState({users: users});
    },

    updateMessages: function(message) {
        var newMessages = this.state.messages;
        newMessages.push(message);
        this.setState({messages: newMessages});
    },

    updateUsersTyping: function(users) {
        var ownUsername = this.state.self.username,
            otherUsers = users.filter(function(username) {
                return (username !== ownUsername);
            });
        this.setState({usersTyping: otherUsers});
    },

    render: function() {
        var alertClass = this.state.alert.error ? 'alert alert-danger alert-dismissible' : 'alert alert-success alert-dismissible';
        var alert = (
            <div className={alertClass} role="alert">
                <button className="close" type="button" data-dismiss="alert">&times;</button>
                <strong>{this.state.alert.error ? 'Error!' : ''}</strong> {this.state.alert.message}
            </div>
        );
        return (
            <div className="container">
                <div className="row">
                    <div className="page-header center">
                        <h1>Chat Application</h1>
                    </div>
                </div>
                <div className="row">
                    {this.state.alert.message ? alert : null}
                </div>
                <div className="row">
                    <div className="col-md-8 col-md-push-4" id="chat-box">
                        <ChatBox
                            messages={this.state.messages}
                            loggedIn={this.state.loggedIn}
                            usersTyping={this.state.usersTyping}
                            onLogin={this.onLogin}
                            onChangeUsername={this.onChangeUsername}
                            onMessageSubmit={this.onMessageSubmit}
                            onLogout={this.onLogout}
                            onUserTyping={this.onUserTyping}
                        />
                    </div>
                    <div className="col-md-4 col-md-pull-8">
                        <UsersBox users={this.state.users}/>
                    </div>
                </div>
            </div>
        );
    }
});

React.render(<ChatApp/>, document.body);
