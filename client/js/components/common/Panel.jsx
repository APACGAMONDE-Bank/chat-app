'use strict';

var React = require('react');

var Panel = React.createClass({

    getDefaultProps: function() {
        return {class: 'primary', header: null, footer: null};
    },

    render: function() {
        var panelClass = 'panel panel-' + this.props.class;
        var footer = (
            <div className="panel-footer">
                {this.props.footer}
            </div>
        );
        return (
            <div className={panelClass}>
                <div className="panel-heading">
                    {this.props.header}
                </div>
                <div className="panel-body">
                    {this.props.children}
                </div>
                {this.props.footer ? footer : null}
            </div>
        );
    }
});

module.exports = Panel;
