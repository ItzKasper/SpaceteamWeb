var socket;
var currentLevel = 0;

$(document).ready(function() {
	socket = io();

    $('#waitingScreen').hide(); //Hides the waitingscreen
    $('#transitionScreen').hide();
    $('#playScreen').hide(); //Hides the playscreen
    $('#gameOverScreen').hide();
    $('#startGameBTN').hide(); //Hides the start game button, shows it again if host
    $('#langSelect').hide();

    socket.on('newRoomID', function(roomID){
        $('#startScreen').hide();   //Hides the startscreen and shows the waitingscreen
        $('#waitingScreen').show();
        $('.roomID').text(roomID); //Change the text to the room ID
    });

    socket.on('alert', function(errorMessage){
        alert(errorMessage);
    });

    socket.on('startGame', function(){
        $('#transitionScreen').hide();
        $('#playScreen').show();
    });

    socket.on('newLevel', function(newLevel){
        currentLevel = newLevel;
        $('#playScreen').hide();
        $('#waitingScreen').hide();
        $('#transitionScreen').show();
        $('#transitionScreen div div p').text("Sector " + newLevel);
    });

    socket.on('newPlayerCount', function(newPlayerCount){
        $('#playerCount').text(newPlayerCount + "/8");
    });

    socket.on('newBoard', function(newBoard){
        for(var i=0;i<newBoard.length;i++){ //Cycle through all the elements
            var element = newBoard[i];
            if(element.type === "switch"){ //If type
                $('#element' + (i+1)).html('<div><p>' + element.displayName + '</p><img src="/client/img/toggleSwitchOff.png" class="img-responsive toggleSwitchImg" onClick=\'toggleSwitchPress("' + element.id + '", this.id)\' ' /*onTouchEnd=\'toggleSwitchPress("' + element.id + '", this.id);\''*/ + ' id="ts_' + element.id + '"/></div>');
            }else if(element.type === "button"){
                $('#element' + (i+1)).html('<div><p>' + element.displayName + '</p><img src="/client/img/button.png" class="img-responsive buttonImg" onClick=\'buttonPress("' + element.id + '");\''/* ontouchend=\'buttonPress("' + element.id + '");\'*/ + '></div>');
            }else if(element.type === "slider"){
                var sliderMarkers = null; //The markers beneath the slider
                for(var j=0;j<element.options;j++){
                    if(sliderMarkers === null){
                        sliderMarkers = "<td>" + j + "</td>";
                    }else{
                        sliderMarkers += "<td>" + j + "</td>";
                    }
                    $('#element'+ (i+1)).html('<div><p>' + element.displayName + '</p><input type="range" min="0" max="' + (element.options - 1) + '" value="0" step="1" onmouseup=\'sliderChange("' + element.id + '",this.value);\' ontouchend=\'sliderChange("' + element.id + '",this.value);\'/><table class="markers"><tr>' + sliderMarkers + '</tr></table></div>');
                }
            }else if(element.type === "selectionSwitch"){
                var innerHTML = '<div><p>' + element.displayName + '</p><div class="row selectionSwitch">';
                for(var j=0;j<element.options;j++){
                    innerHTML += '<div class="col-4"><button class="btn-secondary" onClick=\'selectionSwitchChange("' + element.id + '",' + j + ',this.id);\' id="ss_' + element.id + '_' + j + '">' + j + '</button></div>';
                }
                innerHTML += '</div>';
                $('#element' + (i+1)).html(innerHTML);
            }
        } //You don't want to look at this...
    });

    socket.on('newTask', function(newTask){
        $('#taskMSG').html((newTask.taskMSG).replace("<wbr>", ""));
    })

    socket.on('newPlayerData', function(data){
        updateMasterHealth(data.masterHealth);
        updatePlayerHealth(data.playerHealth);
        updateCounters(data.totalCompleted, data.totalFailed);
    });

    socket.on('gameOver', function(){
        $('#playScreen').hide();
        $('#gameOverScreen .row p:eq(1)').text("You came to sector " + currentLevel);
        $('#gameOverScreen').show();
    });

});

function createRoom(){
	socket.emit('createRoom');
    $('#startGameBTN').show();
    $('#langSelect').show();
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
    socket.emit('startGame', $('#langSelect').children('option:selected').data('id')); //Sends the id from the language select with it
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

function selectionSwitchChange(switchID, newValue, elementID){
    var self = {
        id: switchID,
        value: newValue
    }

    socket.emit('elementChange', self);
    $('#' + elementID).addClass('active').parent().siblings().children().removeClass('active');
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

