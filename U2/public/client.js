// connectSocket is called when user clicks the connect button
function connectSocket() {
    $(document).unbind();
    // open socket
    var socket = new WebSocket("ws://localhost:3000");
    // is called when socket is opened
    socket.onopen = function () {
        // get the username via jquery
        var username = $('#name').val();
        // call our connectUser function
        connectUser(username, socket);
        // If you enter a message too fast and the socket isnt connected already
        // the server will just crash with an error while trying to send smth back to the socket.
        // This is an reminder to wait some time as a workaround.
        // message('Please wait some seconds for the socket to connect.')
        // setTimeout(function (){
        //     message('Socket Status: ' + socket.readyState);
        //     message('Thank you for waiting! Have fun chatting.')
        // }, 2000);
    }
    // is called when socket gets a message
    socket.onmessage = function (msg) {
        console.log(msg);
        // calls our message function
        message('RECIEVED:'+ msg.data);
    }

    $('#disconnectButton').click(function() {
        console.log("clicked disco button");
        socket.close();
        message(socket.readyState);
        message("connection closed");
        console.log(socket.readyState);
    });
    $('#message').keypress(function(event) {
        if (event.keyCode == '13') {
            send();
        }
    });

    // disconnect function to close the socket, can be called from disconnect button
    function send() {
        var input = {
            "sender" : $('#name').val(),
            "recipient" : $('#recipient').val(),
            "message" : $('#message').val()
        }
        console.log(input);
        console.log(socket);
        socket.send(JSON.stringify(input));
        message('SENDED: ' + input.message + " / TO: " + input.recipient);
    }
}

// our message function to append a message to our LOG
function message(msg) {
    $('#log').append(msg+'</br>');
}

function connectUser(username, socket) {
    message('Trying to connect as User: '+username);
    var userJson = {
        "name": username
    }
    socket.send(JSON.stringify(userJson));
}