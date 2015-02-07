'use strict';

var React = require('react');

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

module.exports = UsersBox;