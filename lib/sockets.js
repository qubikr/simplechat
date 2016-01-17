var WebSocket = require('ws').Server,
    ws = new WebSocket({port: 8001});

function handleConnection(io) {
    io.on('message', function(message){
        console.log('recieved: %s', message);
        broadcast(message);
    });
}

function broadcast (message) {
    console.log('broadcasting message');
    ws.clients.forEach(function(client){
        client.send(message);
    });
}

function start() {
    ws.on('connection', handleConnection);
    return ws;
}

exports.start = start;
    

