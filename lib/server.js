/* 
    Created on : Jan 16, 2016, 10:55:43 PM
    Author     : Vladimir
*/

var server = require('http').createServer(),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    cache = {},
    WebSocket = require('ws').Server,
    ws = new WebSocket({server: server}),
    history = [],
    userNames = {},
    userNamesList = [];


function handleRequest(request, response) {
        var filePath;
        if (request.url === '/') {
            filePath = './public/index.html';
        } else {
            filePath = './public' + request.url;
        }
        getFile(response, filePath, cache);
}

function send404(response) {
    response.writeHead(404, {'Content-Type' : 'text/plain'});
    response.write('Eror404: resource not found');
    response.end();
}

function sendFile(response, filePath, fileContent) {
    response.writeHead(
        200,
        {'Content-Type': mime.lookup(path.basename(filePath))}
    );
    response.end(fileContent);
};

function getFile(response, filePath, cache) {
    if (cache[filePath]) {
        sendFile(response, filePath, cache[filePath]);
    } else {
        fs.exists(filePath, function(exists){
            if (exists) {
                fs.readFile(filePath, function(err, data) {
                    if (err) {
                        send404(response);
                    } else {
                        cache[filePath] = data;
                        sendFile(response, filePath, data);
                    }
                });
            } else {
                send404(response);
            }
        });
    }
}

function handleConnection(io) {
    var userName = generateGuestName();
    
    assignGuestName(io, userName);
    handleRecievedMessages(io);
    handleCloseConnection(io);

    function assignGuestName(socket, name, oldName) {
        var data = {
            action:{
                type: 'getName',
                name: name
            }            
        };
        
        if (oldName) {
            data.action.text = 'Введеный псевдоним <strong>' + oldName + '</strong>, уже занят, придумайте другой псевдоним.';
        }
        socket.send(JSON.stringify(data));
    }

    function handleName(socket, name,  userNames, userNamesList) {
        if (userNames[name]) {
            if (name === userName) {
                userName = generateGuestName();
            }
            assignGuestName(socket, userName, name);
        } else {
            userNames[name] = socket;
            userName = name;
            userNamesList.push(name);
            
            socket.send(JSON.stringify({
                action: {
                    type: 'confirmName',
                    name: name
                },
                messages: history

            }));
            
            broadcast({
                users : userNamesList,                
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
            text: message.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
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
    
    function handleCloseConnection(socket) {
        socket.on('close', function(){
            
            userNamesList.splice(userNamesList.indexOf(userName), 1);
            delete(userNames[userName]);
            
            broadcast({
                users: userNamesList,
                alerts : [
                    {
                        text: 'Участник <b>' + userName + '</b> покинул чат',
                        timestamp: new Date().getTime()
                    }
                ]
            });
        });
    }
    
    function broadcast (data) {
        ws.clients.forEach(function(client){
            client.send(JSON.stringify(data));
        });
    }
}

function start() {
    ws.on('connection', handleConnection);
    server.on('request', handleRequest).listen(8000, function(){
        console.log('SimpleChat: main server start at port 8000');
    });
    
    return ws;
}

exports.start = start;
    

