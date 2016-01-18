var WebSocket = require('ws').Server,
    url = require('url'),
    ws = new WebSocket({port: 8001}),
    history = [],
    userNames = {},
    userNamesList = [];

function handleConnection(io) {
    var userName = generateGuestName();
    
    assignGuestName(io, userName);
    handleRecievedMessages(io);

    function assignGuestName(socket, name) {
        socket.send(JSON.stringify({
            action:{
                type: 'getName',
                name: name
            }
        }));
    }

    function handleName(socket, name,  userNames, userNamesList) {
        if (userNames[name]) {
            if (name === userName) {
                userName = genetareGuestName();
            }
            assignGuestName(socket, userName);
        } else {
            userNames[name] = socket;
            userName = name;
            userNamesList.push(name);
            
            socket.send(JSON.stringify({
                action: {
                    type: 'confirmName',
                    name: name
                },
                messages: history,
                users : userNamesList
            }));
            
            broadcast({
                alerts : [
                    {
                        text: 'В чат вошел новый участник: <b>' + name + '</b>',
                        timestamp: new Date().getTime()
                    }
                ]
            });
        }
    }
    function handleRecievedMessages(socket) {
        socket.on('message', function(message) {

            request = JSON.parse(message);
            
            switch(request.event) {
                case 'setName' : 
                    handleName(socket, request.message, userNames, userNamesList); 
                    break;
                case 'message' : 
                    handleMessage(request.message); 
                    break;
            }
        });
    }

    function handleMessage(message) {
        var data = {
            text: message,
            username: userName,
            timestamp: new Date().getTime()
        };
        history.push(data);
        broadcast({
            messages: [data]
        });
    }

    function generateGuestName() {
        var name, index = 1;

        while(userNames[name = 'Guest_' + index]){
            index++;
        };

        return name;
    }

    function broadcast (data) {
        ws.clients.forEach(function(client){
            client.send(JSON.stringify(data));
        });
    }
}

function start() {
    ws.on('connection', handleConnection);
    return ws;
}

exports.start = start;
    

