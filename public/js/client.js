$(document).ready(function() {
    var client = io();

    // disable chat until user joins
    $('#chat-message-form fieldset').prop('disabled', true);
    
    $('#chat-modal').on('shown.bs.modal', function () {
        $('#chat-modal-input').focus();
    });

    $('#chat-modal-form').submit(function(event) {
        var username = $('#chat-modal-input').val();

        if (username != '') {
            client.emit('join', username);
        }
        // prevent page from reloading due to form submit
        event.preventDefault();
    }); 

    $('#chat-message-form').submit(function(event) {
        var msg = $('#chat-message-input').val();

        if (msg != '') {
            client.emit('send-message', msg);
            $('#chat-message-input').val('');
        }
        // prevent page from reloading due to form submit
        event.preventDefault();
    });
    
    $('#change-name-btn').click(function() {
        $('#chat-modal').modal('toggle');
    });
    
    $('#sign-out-btn').click(function() {
        // disable chat
        toggle_chat();
        
        // hide menu
        toggle_settings();
        client.emit('leave');
    });
    
    client.on('join:success', function() {
        // clear error message
        clear_modal_error();
        $('#chat-modal').modal('toggle');
        
        // enable chat
        toggle_chat();
        $('#chat-message-input').focus();
        
        // show menu
        toggle_settings();
    });
    
    client.on('join:update', function() {
        clear_modal_error();
        $('#chat-modal').modal('toggle');
    });
    
    client.on('join:failure', function(msg) {
        show_modal_error(msg);
    });

    client.on('update-users', function(users) {
        // TODO fix hacky solution, empties list and re-adds all users
        $('#chat-users').empty();
        $('#user-count').text(Object.keys(users).length);
        $.each(users, function(clientId, user) {
            var userListItem = $('<div class="media"></div>')
                                    .append($('<div class="media-left media-middle">')
                                        .append($('<img class="media-object" src="/images/placeholder-64x64.svg" alt="Avatar">')))
                                    .append($('<div class="media-body media-middle"></div>')
                                        .append($('<h4 class="media-heading">' + user['name'] + '</h4>')));
            $('#chat-users').append($('<li>').addClass('list-group-item').append(userListItem));
        });
    });

    client.on('update-message', function(msg) {
        $('#chat-messages').append($('<li><p><cite>' + msg + '</cite></p></li>'));
    });
    
    client.on('new-message', function(username, msg, time) {
        var messageList = $('#chat-messages'),
            lastMessage = $('#chat-messages li:last-child'),
            timestamp = time,
            lastTimestamp;
        
        // check if last message is from the same user
        if (lastMessage.hasClass(client.id + ':' + username)) {
            // check if last time stamp is same and don't print again
            lastTimestamp = lastMessage.find('span.message-time:not(:empty)').filter(':last').text();
            if (lastTimestamp != '' && lastTimestamp === time) {
                timestamp = '';
            }
            lastMessage.append($('<div>').addClass('list-group-item-text')
                            .append($('<span>').text(msg).addClass('pull-left message'))
                            .append($('<span>').text(timestamp).addClass('pull-right text-muted message-time'))
                            .append($('<div>').addClass('clearfix'))
                        )
        } else {
            messageList.append($('<li>').addClass('list-group-item').addClass(client.id + ':' + username)
                                    .append($('<h4 class="list-group-item-heading"><b>' + username + '</b></h4>'))
                                    .append($('<div>').addClass('list-group-item-text')
                                        .append($('<span>').text(msg).addClass('pull-left message'))
                                        .append($('<span>').text(timestamp).addClass('pull-right text-muted message-time'))
                                        .append($('<div>').addClass('clearfix'))
                                    )
                                );
        }
        
        // auto scroll chat window
        messageList.scrollTop(messageList.prop("scrollHeight"));
    });
    
    function toggle_chat() {
        var chatForm = $('#chat-message-form fieldset');
        if (chatForm.prop('disabled')) {
            chatForm.prop('disabled', false);
        } else {
            chatForm.prop('disabled', true);
        }
    }

    function toggle_settings() {
        $('#settings-menu').toggle();
        $('#chat-join-btn').toggle();
    }

    function show_modal_error(msg) {
        $('#chat-modal-form').addClass('has-error');
        $('#chat-modal-form .has-feedback .glyphicon').show();
        $('#chat-modal .modal-footer').show();
        $('#chat-modal-error').text(msg);
    }

    function clear_modal_error() {
        $('#chat-modal-form').removeClass('has-error');
        $('#chat-modal-form .has-feedback .glyphicon').hide();
        $('#chat-modal .modal-footer').hide();
        $('#chat-modal-error').text('');
    }

});
