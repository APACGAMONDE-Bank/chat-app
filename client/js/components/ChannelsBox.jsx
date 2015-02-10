'use strict';

var React = require('react');

var Panel = require('./common/Panel.jsx');
var Modal = require('./common/Modal.jsx');

var ChannelBox = React.createClass({

    render: function() {
        var header = (
            <a data-toggle="collapse" href="#channel-list">
                <div>
                    <span className="badge">{this.props.channels.length}</span>
                    <span className="text-uppercase"> Channels</span>
                    <span className="glyphicon glyphicon-chevron-down pull-right"></span>
                </div>
            </a>
        );
        return (
            <Panel header={header}>
                <ChannelList
                    loggedIn={this.props.loggedIn}
                    channels={this.props.channels}
                    currChannel={this.props.currChannel}
                    ownChannel={this.props.ownChannel}
                    onChannelJoin={this.props.onChannelJoin}
                    onChannelCreate={this.props.onChannelCreate}
                    onChannelDelete={this.props.onChannelDelete}
                />
            </Panel>
        );
    }
});

var ChannelModal = React.createClass({

    handleSubmit: function(e) {
        e.preventDefault();
        var name = this.refs.text.getDOMNode().value.trim(),
            description = this.refs.textarea.getDOMNode().value.trim();
        if (name !== '') {
            this.refs.modal.hideModal();
            this.props.onChannelCreate(name, description);
            this.refs.text.getDOMNode().value = '';
            this.refs.textarea.getDOMNode().value = ''
        }
    },

    render: function() {
        return (
            <Modal title="Create a channel" ref="modal">
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input className="form-control" type="text" placeholder="Channel Name" autoComplete="off" ref="text" required/>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-control" rows="3" placeholder="Optional" ref="textarea"></textarea>
                    </div>
                    <button className="btn btn-primary btn-block text-uppercase" type="submit">Create</button>
                </form>
            </Modal>
        );
    }
});

var ChannelList = React.createClass({

    handleCreateChannel: function(e) {
        e.preventDefault();
        $(this.refs.modal.getDOMNode()).modal('show');
    },

    render: function() {
        var createChannel = (
                <div className="panel-footer" >
                    <button className="btn btn-sm btn-default btn-block text-center" type="button" onClick={this.handleCreateChannel}>
                        <span className="glyphicon glyphicon-plus"></span>
                        <span className="text-uppercase">Create New Channel</span>
                    </button>
                </div>
            ),
            renderChannel = function(channel, index) {
                return (
                    <ChannelItem
                        key={index}
                        channel={channel}
                        loggedIn={this.props.loggedIn}
                        onChannelJoin={this.props.onChannelJoin}
                        onChannelDelete={this.props.onChannelDelete}
                        currChannel={this.props.currChannel}
                        ownChannel={this.props.ownChannel}
                    />
                );
        };
        return (
            <div id="channel-list" className="panel-collapse collapse">
                <ul className="list-group" >
                    {this.props.channels.map(renderChannel, this)}
                </ul>
                {this.props.loggedIn ? createChannel : null}
                <ChannelModal onChannelCreate={this.props.onChannelCreate} ref="modal"/>
            </div>
        );
    }
});

var ChannelItem = React.createClass({

    handleJoinChannel: function() {
        var channelName = this.props.channel.name;
        this.props.onChannelJoin(channelName);
    },

    handleDeleteChannel: function() {
        var channelName = this.props.channel.name;
        this.props.onChannelDelete(channelName);
    },

    render: function() {
        var currChannel = (this.props.currChannel === this.props.channel.name),
            ownChannel = (this.props.ownChannel === this.props.channel.name),
            joinChannel = (
                <button className="btn btn-xs btn-default pull-right" type="button" onClick={this.handleJoinChannel} disabled={currChannel}>Join</button>
            ),
            deleteChannel = (
                <button className="btn btn-xs btn-default pull-right" type="button" onClick={this.handleDeleteChannel}>Delete</button>
            );
        return (
            <li className="list-group-item">
                <span ref="channel">{this.props.channel.name}</span>
                {this.props.loggedIn ? joinChannel : null}
                <span>  </span>
                {this.props.loggedIn && ownChannel ? deleteChannel : null}
            </li>
        );
    }
});

module.exports = ChannelBox;
