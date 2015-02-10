'use strict';

var React = require('react');

var Panel = require('./common/Panel.jsx');
var Modal = require('./common/Modal.jsx');

var ChatBox = React.createClass({

    render: function() {
        var usersTypingMessage = '',
            numUsersTyping = this.props.usersTyping.length,
            header,
            footer;
        if (numUsersTyping > 3) {
            usersTypingMessage = 'Several people are typing...';
        } else if (numUsersTyping > 1) {
            usersTypingMessage = this.props.usersTyping.join(', ') + ' are typing...';
        } else if (numUsersTyping > 0) {
            usersTypingMessage = this.props.usersTyping[0] + ' is typing...';
        }
        header = (
            <div>
                <span className="text-uppercase">Chat</span>
                <ChatSettings
                    loggedIn={this.props.loggedIn}
                    onLogin={this.props.onLogin}
                    onLogout={this.props.onLogout}
                    onChangeUsername={this.props.onChangeUsername}
                />
            </div>
        );
        footer = (
            <ChatForm
                loggedIn={this.props.loggedIn}
                onMessageSubmit={this.props.onMessageSubmit}
                onUserTyping={this.props.onUserTyping}
            />
        );
        return (
            <Panel class="primary" header={header} footer={footer}>
                <ChatMessageList messages={this.props.messages}/>
                <div className="text-muted" id="users-typing"><small>{usersTypingMessage}</small></div>
            </Panel>
        );
    }
});

var ChatModal = React.createClass({

    handleSubmit: function(e) {
        e.preventDefault();
        var username = this.refs.text.getDOMNode().value.trim();
        if (username !== '') {
            this.refs.modal.hideModal();
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
            <Modal title="Enter a username" ref="modal">
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <div className="input-group">
                            <span className="input-group-addon">@</span>
                            <input className="form-control" type="text" placeholder="Username" autoComplete="off" ref="text" required/>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-block" type="submit">OK</button>
                </form>
            </Modal>
        );
    }
});

var ChatSettings = React.createClass({

    handleShowModal: function(e) {
        e.preventDefault();
        $(this.refs.modal.getDOMNode()).modal('show');
    },

    handleLogout: function(e) {
        e.preventDefault();
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
                        <li role="presentation"><a role="menuitem" onClick={this.handleShowModal}>Change Username</a></li>
                        <li role="presentation" className="divider"></li>
                        <li role="presentation"><a role="menuitem" onClick={this.handleLogout}>Logout</a></li>
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
                />
            </span>
        );
    }
});

var ChatMessageList = React.createClass({

    componentDidUpdate: function() {
        // auto scroll to bottom
        var l = $('#chat-message-list');
        l.scrollTop(l.prop('scrollHeight'));
    },

    render: function() {
        var renderMessage = function(message, index) {
            return (
                <ChatMessageItem
                    key={index}
                    username={message.username}
                    message={message.text}
                    time={message.time}
                />
            );
        };
        return (
            <ul className="list-group" id="chat-message-list">
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

module.exports = ChatBox;
