/* 
    Created on : Jan 16, 2016, 10:55:43 PM
    Author     : Vladimir
*/
(function(win, doc){

    /**
     * Simple websocket wrapper
     * @param {constructor} SocketConstructor
     */
    function Chat(SocketConstructor) {
        var self = this,
            socket = new SocketConstructor('ws://' + doc.location.host),
            messageHandlers = [];
    

        self.init = function(){
            socket.onmessage = function(event) {
                for (var i = 0; i < messageHandlers.length; i++ ) {
                    messageHandlers[i](event.data);
                }
            };
        };
        
        self.sendMessage = function (event, message) {
            socket.send(JSON.stringify({
                event: event,
                message: message
            }));
        };
        
        self.messageSubscribe = function (handler) {
            if ('function' === typeof handler) {
                messageHandlers.push(handler);
            }
        };
    };
    
    /**
     * Chat Room controller constructor
     * @param {Object} chat
     */
    function ChatRoomController(chat) {
        var self = this;
        
        self.username = '';
        
        var chat = chat,
            historyContainer = doc.querySelector('.message-list'),
            userList = doc.querySelector('.user-box-list'),
            messageContainer = doc.querySelector('#send-message'),
            sendButton = doc.querySelector('#send-button'),
            welcomePopup = doc.querySelector('#welcome-popup'),
            popupErrMsg = welcomePopup.querySelector('.err-message'),
            usernameInput = doc.querySelector('#username'),
            usernameSubmit = doc.querySelector('#change-name');


        self.init = function(){
            chat.init();
            chat.messageSubscribe(handleMessages);
            
            sendButton.onclick = function(event) {
                event.preventDefault();
                if (!!messageContainer.value) {
                    chat.sendMessage('message', messageContainer.value);
                    messageContainer.value = '';                    
                }
            };
        };

        /**
         * 
         * @param {String} response - response from server
         */
        function handleMessages(response) {
            var data = JSON.parse(response),
                html;  
        
            if ('messages' in data) {
                html = '';
                for (var i = 0; i < data.messages.length; i++) {
                    html += generateMessage(data.messages[i]);
                }
                historyContainer.innerHTML += html;  
                historyContainer.scrollIntoView(false);
            }
            
            if ('action' in data) {
                switch(data.action.type) {
                    case 'getName': self.changeName(data.action);break;
                    case 'confirmName': self.setName(data.action.name); break;
                }
            }
            
            if ('users' in data) {
                html = '';
                for (var j = 0; j < data.users.length; j++) {
                    html += generateUserElement(data.users[j]);
                }
                
                userList.innerHTML = html;
            }
            
            if ('alerts' in data) {
                html = '';
                for (var k = 0; k < data.alerts.length; k++) {
                    html += generateAlert(data.alerts[k]);
                }
                
                historyContainer.innerHTML += html;
                historyContainer.scrollIntoView(false);
            }


            /** templates **/
           
            /**
             * @param {Object} message
             * @returns {String}
             */
            function generateMessage (message) {
                return '<div class="message"><pre>' + 
                        message.text + 
                        '</pre><div class="message-header">' +
                            '<span class="username">' + (message.username || '') + '</span>' + 
                            '<span class="date">' + generateDate(message.timestamp) + '</span>' + 
                        '</div>' +
                        '</div>';
            };
            
            /**
             * @param {Strign} name
             * @returns {String}
             */
            function generateUserElement (name) {
                return '<div class="username">' + name + '</div>';
            }

            /**
             * @param {Object} message
             * @returns {String}
             */
            function generateAlert (message) {
                return '<div class="alert-message">' + 
                            '<div class="date">' + 
                                generateDate(message.timestamp) + 
                            '</div>' + 
                            message.text + 
                        '</div>';
            };
            
            /**
             * @param {Number} timestamp
             * @returns {String}
             */
            function generateDate (timestamp) {
                var timeString = '',
                    date, currentDate;

                if (!timestamp) {
                    return '';
                }
                date = new Date(timestamp);
                currentDate = new Date();

                timeString += date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2);

                if (date.getDate() !== currentDate.getDate() || 
                    date.getMonth() !== currentDate.getMonth() || 
                    date.getFullYear() !== currentDate.getFullYear()) 
                {
                    timeString += ' ' + ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear();
                }

                return timeString;
            }
        }
        
        /**
         * @param {Object} data
         * @returns {undefined}
         */
        self.changeName = function (data) {
            welcomePopup.className = welcomePopup.className.replace('hidden', '');
            usernameInput.value = data.name;

            if (data.text) {
               popupErrMsg.className = popupErrMsg.className.replace('hidden', '');
               popupErrMsg.innerHTML = data.text;
            } else {
                if (!popupErrMsg.className.match('hidden')) {
                    popupErrMsg.className = popupErrMsg.className + ' hidden';
                }
            }
            
            usernameSubmit.onclick = function(event) {
                event.preventDefault();
                chat.sendMessage('setName', usernameInput.value);
                usernameInput.value = '';
                
            };
        };
        
        self.setName = function (name) {
            welcomePopup.className = welcomePopup.className + ' hidden';
            self.userName = name;
        };
    }
    
    win.onload = function(){
        var chat = new Chat(win.WebSocket),
            room = new ChatRoomController(chat);
    
        room.init();
    };
 
})(window, document);