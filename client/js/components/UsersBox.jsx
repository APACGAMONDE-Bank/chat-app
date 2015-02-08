'use strict';

var React = require('react');

var Panel = require('./common/Panel.jsx');

var UsersBox = React.createClass({

    render: function() {
        var header = (
            <div>
                <span className="badge">{this.props.users.length}</span>
                <span className="text-uppercase"> Online Users</span>
            </div>
        );
        return (
            <Panel class='info' header={header}>
                <UserList users={this.props.users}/>
            </Panel>
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
            <ul className="list-group" id="user-list">
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

module.exports = UsersBox;