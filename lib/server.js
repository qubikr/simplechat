var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    cache = {};
    
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

function start(){
    var server = http.createServer(function(request, response){
        var filePath;
        if (request.url === '/') {
            filePath = './public/index.html';
        } else {
            filePath = './public' + request.url;
        }
        getFile(response, filePath, cache);
    }).listen(8000, function(){
        console.log('SimpleChat: main server start at port 8000');
    });
    return server;
}
exports.start = start;
