/**
 * 
 * @type Module server|Module server
 */
var server = require('./lib/server.js');
var socketServer = require('./lib/sockets.js');

server.start();
socketServer.start();

