function connectSocket() {
    var socket = new WebSocket("ws://localhost:3000");

    socket.onopen = function () {
        var username = $('#name').val();
        connectUser(username, socket);
        console.log(username);
        console.log('Socket Status = ' + socket.readyState);

        // If you enter too fast, and the socket isnt established already
        // the server will just crash with an error while trying to send smth back to the socket.
        // This is an reminder to wait some time.
        message('Please wait some seconds for the socket to connect.')
        setTimeout(function (){
            message('Socket Status: ' + socket.readyState);
            message('Thank you for waiting! Have fun chatting.')
        }, 2000);
    }

    socket.onmessage = function (msg) {
        message('RECIEVED:'+ msg.data);
    }

    $('#text').keypress(function(event) {
        if (event.keyCode == '13') {
            send();
        }
    });
    function send() {
        var text = $('#text').val();
        socket.send(text);
        message('SENDED: ' + text);
        $('#text').val("");
        }
}

function message(msg) {
    $('#log').append(msg+'</br>');
}

function connectUser(username, socket) {
    message('Trying to connect as User: '+username);
    console.log(socket);
}

        // function connectUser() {
        //     var user = $('#name').val();
        //     username(user);
        // }

        // function send() {
        //     var text = $('#text').val();
        //     console.log(text);
        //     socket.send(text);
        //     message('Sended :' + text);
        //     $('#text').val("");
        // }

        // $('#text').keypress(function(event) {
        //     if (event.keyCode == '13')
        //     {
        //         send();
        //     }
        // });