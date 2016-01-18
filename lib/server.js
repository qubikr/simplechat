/* 
    Created on : Jan 16, 2016, 10:55:43 PM
    Author     : Vladimir
*/

var server = require('http').createServer(),
    port = 8000,
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    cache = {},
    WebSocket = require('ws').Server,
    ws = new WebSocket({server: server}),
    history = [],
    userNamesList = [];


/**
 * Server request handler
 * @param {Obj} request
 * @param {Obj} response
 * @returns {undefined}
 */
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

/**
 * return file content
 * @param {Object} response - server response
 * @param {String} filePath
 * @param {Object} cache
 */
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

/**
 * New web socket connection handler
 * @param {Object} io
 */
function handleConnection(io) {
    var userName = generateGuestName(userNamesList);
    
    assignGuestName(io, userName);
    handleRecievedMessages(io);
    handleCloseConnection(io);

    /**
     * sending Guest uername
     * @param {Object} socket
     * @param {String} name
     * @param {String} oldName
     */
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

    /**
     * Choose name logic
     * @param {type} socket
     * @param {String} name
     * @param {Array} userNamesList
     */
    function handleName(socket, name, userNamesList) {
        if (~userNamesList.indexOf(name)) {
            if (name === userName) {
                userName = generateGuestName();
            }
            assignGuestName(socket, userName, name);
        } else {
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
    
    /**
     * set socket listener
     * @param {Object} socket
     */
    function handleRecievedMessages(socket) {
        socket.on('message', function(message) {

            request = JSON.parse(message);
            
            switch(request.event) {
                case 'setName' : 
                    handleName(socket, request.message, userNamesList); 
                    break;
                case 'message' : 
                    handleMessage(request.message); 
                    break;
            }
        });
    }
    
    /**
     * Send given message to all users
     * @param {Object} message
     */
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

    /**
     * Guest name generator
     * @returns {String}
     */
    function generateGuestName(userNamesList) {
        var name, index = 1;

        while(~userNamesList.indexOf(name = 'Guest_' + index)){
            index++;
        };

        return name;
    }
    
    /**
     * Close connection handler
     * @param {Object} socket
     */
    function handleCloseConnection(socket) {
        socket.on('close', function(){
            
            userNamesList.splice(userNamesList.indexOf(userName), 1);
            
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
    
    /**
     * 
     * @param {Object} data
     */
    function broadcast (data) {
        ws.clients.forEach(function(client){
            client.send(JSON.stringify(data));
        });
    }
}

function start() {
    ws.on('connection', handleConnection);
    server.on('request', handleRequest).listen(port, function(){
        console.log('SimpleChat: server start at port ' + port);
    });
    
    return ws;
}

exports.start = start;
    

