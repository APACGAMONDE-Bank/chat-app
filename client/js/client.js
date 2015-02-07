'use strict';

var io = require('socket.io-client');
var $ = global.jQuery = require('jquery');
var bootstrap = require('bootstrap');
var React = require('react');

var client = io();
var typingTimeout;

var TYPING_TIMEOUT_DELAY = 5000;

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
            typingTimeout = setTimeout(this.onUserDoneTyping, TYPING_TIMEOUT_DELAY);
        } else {
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(this.onUserDoneTyping, TYPING_TIMEOUT_DELAY);
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

var ChatBox = React.createClass({

    render: function() {
        var usersTypingMessage = '',
            numUsersTyping = this.props.usersTyping.length;
        if (numUsersTyping > 3) {
            usersTypingMessage = 'Several people are typing...';
        } else if (numUsersTyping > 1) {
            usersTypingMessage = this.props.usersTyping.join(', ') + ' are typing...';
        } else if (numUsersTyping > 0) {
            usersTypingMessage = this.props.usersTyping[0] + ' is typing...';
        }
        return (
            <div className="panel panel-primary">
                <div className="panel-heading">
                    <span className="text-uppercase">Chat</span>
                    <ChatSettings
                        loggedIn={this.props.loggedIn}
                        onLogin={this.props.onLogin}
                        onLogout={this.props.onLogout}
                        onChangeUsername={this.props.onChangeUsername}
                    />
                </div>
                <div className="panel-body">
                    <ChatMessageList messages={this.props.messages}/>
                    <div className="text-muted" id="users-typing"><small>{usersTypingMessage}</small></div>
                </div>
                <div className="panel-footer">
                    <ChatForm
                        loggedIn={this.props.loggedIn}
                        onMessageSubmit={this.props.onMessageSubmit}
                        onUserTyping={this.props.onUserTyping}
                    />
                </div>
            </div>
        );
    }
});

var ChatModal = React.createClass({

    handleSubmit: function(e) {
        e.preventDefault();
        var username = this.refs.text.getDOMNode().value.trim();
        if (username !== '') {
            this.props.handleHideModal();
            if (this.props.loggedIn) {
                this.props.onChangeUsername(username);
            } else {
                this.props.onLogin(username);
            }
            this.refs.text.getDOMNode().value = '';
        }
    },

    render: function() {
        return (
            <div className="modal fade" role="dialog">
                <div className="modal-dialog modal-sm modal-vertical-center">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button className="close" type="button" data-dismiss="modal">&times;</button>
                            <h4 className="modal-title">Enter a username</h4>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={this.handleSubmit}>
                                <div className="form-group has-feedback">
                                    <div className="input-group">
                                        <span className="input-group-addon">@</span>
                                        <input className="form-control" type="text" placeholder="Username" autoComplete="off" ref="text"/>
                                        <span className="glyphicon glyphicon-lg glyphicon-remove form-control-feedback"></span>
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-block" type="submit">OK</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

var ChatSettings = React.createClass({

    handleShowModal: function() {
        $(this.refs.modal.getDOMNode()).modal('show');
    },

    handleHideModal: function() {
        $(this.refs.modal.getDOMNode()).modal('hide');
    },

    handleLogout: function() {
        this.props.onLogout();
    },

    render: function() {
        var chatSettings;
        if (this.props.loggedIn) {
            chatSettings = (
                <div className="dropdown pull-right">
                    <button className="btn btn-xs btn-info dropdown-toggle" type="button" data-toggle="dropdown">
                        <span className="glyphicon glyphicon-cog"></span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-right" role="menu">
                        <li role="presentation"><a role="menuitem" href="#">Refresh</a></li>
                        <li role="presentation"><a role="menuitem" href="#" onClick={this.handleShowModal}>Change Username</a></li>
                        <li role="presentation" className="divider"></li>
                        <li role="presentation"><a role="menuitem" href="#" onClick={this.handleLogout}>Logout</a></li>
                    </ul>
                </div>
            );
        } else {
            chatSettings = (
                <button className="btn btn-xs btn-default pull-right" type="button" onClick={this.handleShowModal}>Join Chat</button>
            );
        }
        return (
            <span>
                {chatSettings}
                <ChatModal ref="modal"
                loggedIn={this.props.loggedIn}
                onLogin={this.props.onLogin}
                onChangeUsername={this.props.onChangeUsername}
                handleHideModal={this.handleHideModal}
                />
            </span>
        );
    }
});

var ChatMessageList = React.createClass({

    render: function() {
        var renderMessage = function(message, index) {
            return (
                <ChatMessageItem key={index} username={message.username} message={message.text} time={message.time}/>
            );
        };
        return (
            <ul className="list-group" id="chat-messages">
                {this.props.messages.map(renderMessage)}
            </ul>
        );
    }
});

var ChatMessageItem = React.createClass({

    render: function() {
        if (this.props.username !== null) {
            return (
                <li>
                    <span className="pull-left message-username">{this.props.username}: </span>
                    <span className="pull-left message-text">{this.props.message}</span>
                    <span className="pull-right text-muted message-time">{this.props.time}</span>
                    <div className="clearfix"></div>
                </li>
            );
        } else {
            return (
                <li>
                    <span className="pull-left message-text"><cite>{this.props.message}</cite></span>
                    <span className="pull-right text-muted message-time">{this.props.time}</span>
                    <div className="clearfix"></div>
                </li>
            );
        }
    }
});

var ChatForm = React.createClass({

    handleSubmit: function(e) {
        e.preventDefault();
        var message = this.refs.text.getDOMNode().value.trim();
        if (message !== '') {
            this.props.onMessageSubmit(message);
            this.refs.text.getDOMNode().value = '';
        }
    },

    handleTyping: function() {
        this.props.onUserTyping();
    },

    render: function() {
        return (
            <form onSubmit={this.handleSubmit}>
                <fieldset disabled={!this.props.loggedIn}>
                    <div className="form-group">
                        <div className="input-group">
                            <input className="form-control" onChange={this.handleTyping} type="text" placeholder="Type your message here" ref="text" autoComplete="off"/>
                            <span className="input-group-btn">
                                <button className="btn btn-primary" type="submit">SEND</button>
                            </span>
                        </div>
                    </div>
                </fieldset>
            </form>
        );
    }
});

var UsersBox = React.createClass({

    render: function() {
        return (
            <div className="panel panel-info">
                <div className="panel-heading">
                    <span className="badge">{this.props.users.length}</span>
                    <span className="text-uppercase"> Online Users</span>
                </div>
                <div className="panel-body">
                    <UserList users={this.props.users}/>
                </div>
            </div>
        );
    }
});

var UserList = React.createClass({

    render: function() {
        var renderUser = function(user, index){
            return (
                <UserItem key={index} user={user}/>
            );
        };
        return (
            <ul className="list-group" id="chat-users">
                {this.props.users.map(renderUser)}
            </ul>
        );
    }
});

var UserItem = React.createClass({

    render: function() {
        return (
            <li className="list-group-item">
                <div className="media">
                    <div className="media-left media-middle">
                        <img className="media-object" src={this.props.user.avatar} alt="Avatar"/>
                    </div>
                    <div className="media-body media-middle">
                        <h4 className="media-heading">{this.props.user.name}</h4>
                    </div>
                </div>
            </li>
        );
    }
});

React.render(<ChatApp/>, document.body);
