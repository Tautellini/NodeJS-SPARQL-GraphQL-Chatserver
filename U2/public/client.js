function bla() {
    console.log("bla");
}

var socket = new WebSocket("ws://localhost:3000");

function socket(socket){
    console.log(socket);
}

socket();
        // Status anzeigen
        socket.onopen = function () {
            message('Socket Status =' + socket.readyState + '(open)');
            console.log('Socket Status= ' + socket.readyState);
        }

        socket.onmessage = function (msg) {
            message('Recieved:'+ msg.data);
            console.log('Recieved: ' + msg.data)
        }

        function linkUser() {
            var user = $('#name').val();
            console.log(user);
        }

        function send() {
            var text = $('#text').val();
            console.log(text);
            socket.send(text);
            message('Sended :' + text);
            $('#text').val("");
        }

        function message(msg) {
            $('#log').append(msg+'</br>');
        }

        $('#text').keypress(function(event) {
            if (event.keyCode == '13')
            {
                send();
            }
        });


onLoad();