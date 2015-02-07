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
            error: ''
        };
    },

    getDefaultProps: function() {
        return {
            typingTimeoutDelay: 5000
        }
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
        this.setState({self: {username: null}, loggedIn: false});
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
        this.setState({self: {username: username}, loggedIn: true, error: ''});
    },

    userLoginFailure: function(message) {
        this.setState({error: message});
    },

    userUpdateSuccess: function(username) {
        this.setState({self: {username: username}, error: ''});
    },

    userUpdateFailure: function(message) {
        this.setState({error: message});
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
        var errorAlert = (
            <div className="alert alert-danger alert-dismissible" role="alert">
                <button className="close" type="button" data-dismiss="alert">&times;</button>
                <strong>Error!</strong> {this.state.error}
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
                    {this.state.error ? errorAlert : null}
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
