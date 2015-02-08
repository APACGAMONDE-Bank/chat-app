'use strict';

var React = require('react');

var Panel = require('./common/Panel.jsx');

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
                    channels={this.props.channels}
                    currChannel={this.props.currChannel}
                    onChannelJoin={this.props.onChannelJoin}
                />
            </Panel>
        );
    }
});

var ChannelList = React.createClass({

    render: function() {
        var onChannelJoin = this.props.onChannelJoin,
            currChannel = this.props.currChannel,
            renderChannel = function(channel, index) {
                return (
                    <ChannelItem
                        key={index}
                        channel={channel}
                        onChannelJoin={this.props.onChannelJoin}
                        currChannel={this.props.currChannel}
                    />
                );
        };
        return (
            <div id="channel-list" className="panel-collapse collapse in">
                <ul className="list-group">
                    {this.props.channels.map(renderChannel, this)}
                </ul>
            </div>
        );
    }
});

var ChannelItem = React.createClass({

    handleJoinChannel: function() {
        var channelName = this.props.channel.name;
        this.props.onChannelJoin(channelName);
    },

    render: function() {
        var currChannel = (this.props.currChannel === this.props.channel.name),
            joinChannel = (
                <button className="btn btn-xs btn-default pull-right" type="button" onClick={this.handleJoinChannel} disabled={currChannel}>Join</button>
            );
        return (
            <li className="list-group-item">
                <span ref="channel">{this.props.channel.name}</span>
                {this.props.currChannel ? joinChannel : null}
            </li>
        );
    }
});

module.exports = ChannelBox;
