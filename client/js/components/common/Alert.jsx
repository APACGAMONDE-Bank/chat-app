'use strict';

var React = require('react');

var Alert = React.createClass({

    getDefaultProps: function() {
        return {
            error: false,
            dismissible: true
        };
    },

    render: function() {
        var alertClass = 'alert alert-' + (this.props.error ? 'danger' : 'success');
        if (this.props.dismissible) {
            alertClass += ' alert-dismissible';
        }
        return (
            <div className={alertClass} role="alert">
                <button className="close" type="button" data-dismiss="alert">&times;</button>
                <strong>{this.props.error ? 'Error!' : ''}</strong> {this.props.message}
            </div>
        );
    }
});

module.exports = Alert;
