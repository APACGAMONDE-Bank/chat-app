'use strict';

// Vendors
window.$ = window.jQuery = require('jquery');
var bootstrap = require('bootstrap');
var io = require('socket.io-client');
var React = require('react');

// ReactJS components
var Alert = require('./components/common/Alert.jsx');
var ChatBox = require('./components/ChatBox.jsx');
var UsersBox = require('./components/UsersBox.jsx');
var ChannelsBox = require('./components/ChannelsBox.jsx');

// Setup socket.io connection
var client = io();

// Globals
var typingTimeout;

var ChatApp = React.createClass({

    getInitialState: function() {
        client.on('connect_error', this.onConnectError);
        client.on('reconnect', this.onReconnect);

        client.on('update-users', this.updateUsers);
        client.on('update-channels', this.updateChannels);
        client.on('message:new', this.updateMessages);
        client.on('update-users-typing', this.updateUsersTyping);

        return {
            username: null,
            currChannel: null,
            users: [],
            messages: [],
            channels: [],
            loggedIn: false,
            isTyping: false,
            usersTyping: [],
            alert: {error: false, message: ''}
        };
    },

    getDefaultProps: function() {
        return {
            defaultChannel: 'Home',
            typingTimeoutDelay: 5000
        };
    },

    onConnectError: function() {
        this.setState({
            currChannel: null,
            loggedIn: false,
            isTyping: false,
            usersTyping: [],
            alert: {error: true, message: 'Connection to the server lost'}
        });
    },

    onReconnect: function() {
        this.setState({
            username: null,
            users: [],
            messages: [],
            alert: {error: false, message: 'Reconnected to the server'}
        });
    },

    onLogin: function(username) {
        var that = this;
        client.emit('user:login', username, function(error) {
            if (!error) {
                that.setState({
                    username: username,
                    currChannel: that.props.defaultChannel,
                    loggedIn: true,
                    alert: {error: false, message: 'Logged in'}
                });
            } else {
                that.setState({alert: {error: true, message: error}});
            }
        });
    },

    onChangeUsername: function(username) {
        var that = this;
        client.emit('user:update', username, function(error) {
            if (!error) {
                that.setState({
                    username: username,
                    alert: {error: false, message: 'Settings updated'}
                });
            } else {
                that.setState({alert: {error: true, message: error}});
            }
        });
    },

    onChannelJoin: function(channelName) {
        var that = this;
        client.emit('channel:join', channelName, function(error) {
            if (!error) {
                that.setState({currChannel: channelName});
            }
        });
    },

    onChannelCreate: function(name, description) {
        var that = this;
        client.emit('channel:create', name, description, function(error) {
            if (error) {
                that.setState({alert: {error: true, message: error}});
            } else {
                that.setState({alert: {error: false, message: 'Channel created'}});
            }
        });
    },

    onMessageSubmit: function(message) {
        clearTimeout(typingTimeout);
        this.onUserDoneTyping();
        client.emit('message:send', message);
    },

    onLogout: function() {
        var that = this;
        client.emit('user:logout', function(error) {
            if (!error) {
                that.setState({
                    username: null,
                    currChannel: null,
                    loggedIn: false,
                    alert: {error: false, message: 'Logged out'}
                });
            }
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

    updateChannels: function(channels) {
        this.setState({channels: channels});
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
        var ownUsername = this.state.username,
            otherUsers = users.filter(function(username) {
                return (username !== ownUsername);
            });
        this.setState({usersTyping: otherUsers});
    },

    render: function() {
        var alert = <Alert error={this.state.alert.error} message={this.state.alert.message}/>;
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
                    <div className="col-md-4 col-md-pull-8" id="channels-box">
                        <ChannelsBox
                            loggedIn={this.state.loggedIn}
                            channels={this.state.channels}
                            currChannel={this.state.currChannel}
                            onChannelJoin={this.onChannelJoin}
                            onChannelCreate={this.onChannelCreate}
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
