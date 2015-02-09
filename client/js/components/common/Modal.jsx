'use strict';

var React = require('react');

var ModalMixin = {

    showModal: function() {
        $(this.getDOMNode()).modal('show');
    },

    hideModal: function() {
        $(this.getDOMNode()).modal('hide');
    }
};

var Modal = React.createClass({
    mixins: [ModalMixin],

    render: function() {
        return (
            <div className="modal fade" role="dialog">
                <div className="modal-dialog modal-sm modal-vertical-center">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button className="close" type="button" data-dismiss="modal">&times;</button>
                            <h4 className="modal-title">{this.props.title}</h4>
                        </div>
                        <div className="modal-body">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Modal;
