var socket = require('socket.io'),
    io,
    guestNumber,
    nickNames = {},
    namesUsed = [];

exports.listen = function(server) {
    io = socket.listen(server);
    io.set('log level', 1);
    
    io.sockets.on('connection', function(socket){
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        handleMessageBroadcasting(socket, nickNames);
        handleClientDisconection(socket, nickNames, namesUsed);
    });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest_' + guestNumber;
    
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    
    namesUsed.push(name);
    return guestNumber++;
}

function handleMessageBroadcasting(socket, nickNames) {
    socket.on('message', function(message){
       socket.broadcast.emit('message', {
           text: nickNames[socket.id] + ': ' + message.text
       });
    });
}

function handleClientDisconection(socket, nickNames, namesUsed) {
    socket.on('disconnect', function(){
        var index = namesUsed.indexOf(nickNames[socket.id]);
        
        delete(namesUsed[index]);
        delete(nickNames[socket.id]);
    });
}


