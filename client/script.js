var socket;

$(document).ready(function() {
	socket = io();

    $('#waitingScreen').hide(); //Hides the waitingscreen
    $('#transitionScreen').hide();
    $('#playScreen').hide(); //Hides the playscreen
    $('#gameOverScreen').hide();
    $('#startGameBTN').hide(); //Hides the start game button, shows it again if host

    socket.on('newRoomID', function(roomID){
        console.log('New room ID' + roomID);
        $('#startScreen').hide();   //Hides the startscreen and shows the waitingscreen
        $('#waitingScreen').show();
        $('#roomID').text(roomID); //Change the text to the room ID
    });

    socket.on('alert', function(errorMessage){
        alert(errorMessage);
    });

    socket.on('startGame', function(){
        console.log("START");
        $('#transitionScreen').hide();
        $('#playScreen').show();
    });

    socket.on('newLevel', function(newLevel){
        $('#playScreen').hide();
        $('#waitingScreen').hide();
        $('#transitionScreen').show();
        console.log("NEW LEVEL: " + newLevel)
        $('#transitionScreen div div p').text("Level " + newLevel);
    });

    socket.on('newPlayerCount', function(newPlayerCount){
        $('#playerCount').text(newPlayerCount + "/8");
    });

    socket.on('newBoard', function(newBoard){
        console.log(newBoard);
        for(var i=0;i<newBoard.length;i++){ //Cycle through all the elements
            var element = newBoard[i];
            if(element.type === "switch"){ //If type
                $('#element' + (i+1)).html('<div><p>' + element.displayName + '</p><img src="/client/img/toggleSwitchOff.png" class="img-responsive toggleSwitchImg" onClick=\'toggleSwitchPress("' + element.id + '", this.id)\' ' /*onTouchEnd=\'toggleSwitchPress("' + element.id + '", this.id);\''*/ + ' id="ts_' + element.id + '"/></div>');
            }else if(element.type === "button"){
                $('#element' + (i+1)).html('<div><p>' + element.displayName + '</p><img src="/client/img/button.png" class="img-responsive buttonImg" onclick=\'buttonPress("' + element.id + '");\''/* ontouchend=\'buttonPress("' + element.id + '");\'*/ + '></div>');
            }else if(element.type === "slider"){
                var sliderMarkers = null; //The markers beneath the slider
                for(var j=0;j<element.options;j++){
                    if(sliderMarkers === null){
                        sliderMarkers = "<td>" + j + "</td>";
                    }else{
                        sliderMarkers = sliderMarkers + "<td>" + j + "</td>";
                    }
                    $('#element'+ (i+1)).html('<div><p>' + element.displayName + '</p><input type="range" min="0" max="' + (element.options - 1) + '" value="0" step="1" onmouseup=\'sliderChange("' + element.id + '",this.value);\' ontouchend=\'sliderChange("' + element.id + '",this.value);\'/><table class="markers"><tr>' + sliderMarkers + '</tr></table></div>');
                }
            }
        } //You don't want to look at this...
    });

    socket.on('newTask', function(newTask){
        console.log(newTask);
        console.log(taskMSG);
        $('#taskMSG').html((newTask.taskMSG).replace("<wbr>", ""));
    })

    socket.on('newPlayerData', function(data){
        updateMasterHealth(data.masterHealth);
        updatePlayerHealth(data.playerHealth);
        updateCounters(data.totalCompleted, data.totalFailed);
    });

    socket.on('gameOver', function(){
        console.log("GAMEOVER");
        $('#playScreen').hide();
        $('#gameOverScreen').show();
    });

});

function createRoom(){
	socket.emit('createRoom');
    $('#startGameBTN').show();
}

function joinRoom(){
    var roomID = document.getElementById("roomIDInput").value;
    socket.emit('joinRoom', roomID); 
}

function leaveRoom(){
    socket.emit('leaveRoom');
    $('#startScreen').show();   //Shows the startscreen and hides the waitingscreen
    $('#waitingScreen').hide();
    $('#startGameBTN').hide();
    $('#gameOverScreen').hide();
    $('#roomID').text("PIZZA"); //Change the text to the room ID
}

function startGame(){
    socket.emit('startGame');
}

function toggleSwitchPress(switchID, element){
    var self = {
        id: switchID
    }

    socket.emit('elementChange', self);

    socket.emit('requestState', switchID);  //Register the current state of the switch after it has changed
    socket.once('requestReply', function(currentState){ //change the direction of the switch depending on the state
        if(currentState == false){
            $("#" + element).attr('src', '/client/img/toggleSwitchOff.png');
        }else{
            $('#' + element).attr('src', '/client/img/toggleSwitchOn.png');
        }
    });
}

function buttonPress(buttonID, element){
    var self = {
        id: buttonID
    }

    socket.emit('elementChange', self);
}

function sliderChange(sliderID, newValue){
    var self = {
        id: sliderID,
        value: newValue
    }
    socket.emit('elementChange', self);
}

function updateMasterHealth(newHealth){
    if(newHealth < 0){
        $("#masterHealth div").width("0%");
        $("#masterHealthTXT").text("0%");
    }else if(newHealth > 100){
        $("#masterHealth div").width("100%");
        $("#masterHealthTXT").text("100%");
    }else{
        $("#masterHealth div").width(newHealth + "%");
        $("#masterHealthTXT").text(Math.round(newHealth) + "%");
    }
}

function updatePlayerHealth(newHealth){
    if(newHealth < 0){
        $("#playerHealth div").width("0%");
        $("#playerHealthTXT").text("0%");
    }else if(newHealth > 100){
        $("#playerHealth div").width("100%");
        $("#playerHealthTXT").text("100%");
    }else{
        $("#playerHealth div").width(newHealth + "%");
        $("#playerHealthTXT").text(Math.round(newHealth) + "%");
    }
}

function updateCounters(totalCompleted, totalFailed){
    if(totalCompleted > 999){
        $("#totalCompleted").text("999+");
    }else{
        $("#totalCompleted").text(totalCompleted);
    }

    if(totalFailed > 999){
        $("#totalFailed").text("999+");
    }else{
        $("#totalFailed").text(totalFailed);
    }
}

