(function(win, doc){

    function Chat(SocketConstructor) {
        var self = this,
            socket = new SocketConstructor('ws://' + doc.location.hostname + ':8001'),
            messageHandlers = [];
    

        self.init = function(){
            
            socket.onopen = function() {
               socket.send('Test');
            };
            
            socket.onmessage = function(event) {
                for (var i = 0; i < messageHandlers.length; i++ ) {
                    messageHandlers[i](event.data);
                }
            };
        };
        
        self.sendMessage = function (message) {
            socket.send(message);
        };
        
        self.messageSubscribe = function (handler) {
            if ('function' === typeof handler) {
                messageHandlers.push(handler);
            }
        };
    };
    
    
    function ChatRoomController(chat) {
        var self = this;
        
        var chat = chat,
            historyContainer = doc.querySelector('.message-box'),
            userList = doc.querySelector('.user-box'),
            messageContainer = doc.querySelector('#send-message'),
            sendButton = doc.querySelector('#send-button');

        self.init = function(){
            chat.init();
            chat.messageSubscribe(function(message){
                historyContainer.innerHTML += self.generateMessage(message);
            });
            
            sendButton.onclick = function(event) {
                event.preventDefault();
                
                chat.sendMessage(messageContainer.value);
            };
        };
        
        self.generateMessage = function(message) {
            return '<div class="message">' + message + '</div>';
        };
    }
    
    win.onload = function(){
        var chat = new Chat(win.WebSocket),
            room = new ChatRoomController(chat);
    
        room.init();
    };
 
})(window, document);