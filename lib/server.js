var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    chatServer = require('./chat_server.js'),
    cache = {};

function send404(response) {
    response.writeHead(404, {'Content-Type' : 'text/plain'});
    response.write('Eror404: resource not found');
    response.end();
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200,
        {'Content-Type' : mime.lookup(path.basename(filePath))}
    );
    response.end(fileContents);
}

function getStatic(response, cache, filePath) {
    if (cache[filePath]) {
        sendFile(response, filePath, cache[filePath]);
    } else {
        fs.exists(filePath, function(exists){
            if(exists) {
                fs.readFile(filePath, function(err, data){
                    if (err) {
                        send404(response);
                    } else {
                        cache[filePath] = data;
                        sendFile(response, filePath, data);
                    }
                });
            }
        });
    }
}

function start() {
    var server = http.createServer(requestHandler).listen(8000, function(){
        console.log('simplechat: main server started at port 8000');
    });
    chatServer.listen(server, function(){
        console.log('simplechat: chat server started at port 8000');
    });
}

function requestHandler(request, response) {
    console.log('handle new request with url:' + request.url);
    if (request.url === '/') {
        filePath = './public/index.html';
    } else {
        filePath = './public' + request.url;
    }
    getStatic(response, cache, filePath);
}

exports.start = start;

