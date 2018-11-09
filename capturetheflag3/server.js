"use strict";
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

//http.set('port', (process.env.PORT || 5000));

//app.set('port', (process.env.PORT || 5000));

//app.use(express.static(__dirname + '/public'));


var users = 0;
var user_numbers = [0];
var user_ids = [0];
var user_waiting = 0;
var user_requesting = 0;
var games = 0;

var movingOrange1 = [0];
var movingOrange2 = [0];
var movingGreen1 = [0];
var movingGreen2 = [0];
var orange1direction = [0];
var orange2direction = [0];
var green1direction = [0];
var green2direction = [0];
var o1 = [0];
var o2 = [0];
var o3 = [0];
var g1 = [0];
var g2 = [0];
var g3 = [0];
var flag1 = [0];
var flag2 = [0];
var winner = [0];
var background1 = [0];
var background2 = [0];
var player1 = [0];
var player1left = [0];
var player1right = [0];
var player1up = [0];
var player1down = [0];
var player2 = [0];
var player2left = [0];
var player2right = [0];
var player2up = [0];
var player2down = [0];
var game_over = [0];
var start_time = [0];
var new_time = [0];
var timer = [0];
var t1 = [0];
var t2 = [0];
var deltatime = [0];
//var speed1 = 1/15;
var speed1 = 1/30;


//game
function sqrt(number){return Math.sqrt(number);}
function pow(base, exponent){return Math.pow(base, exponent);}

var settings = {
  gridSize: 10,
  width: 100,
  height: 40
};

var object_list = [];
var circle_list = [];
var rectangle_list = [];
var player_list = [];
var C_player_list = [];
var R_player_list = [];

class Object{
    constructor(x,y,team,type, game){
/* type =
   0: background
   1: defender
   2: player
   3: flag
*/
       this.x = x;
       this.y = y;
       this.team = team;
       this.type = type;
this.game = game;
       if (type == 2){
       this.time_in_enemy_territory = 0;
       }
      
    }
}
class Rectangle extends Object{
    constructor(x, y, team, type, width, height, game){
        super(x,y,team,type, game);
        this.width = width;
        this.height = height;
        rectangle_list.push(this);
    }
    static touching_rectangle(rectA, rectB){
    return (rectA.x + rectA.width > rectB.x && rectA.x < rectB.x + rectB.width && rectA.y + rectA.height> rectB.y && rectA.y < rectB.y + rectB.height);    
    }
}
class Circle extends Object{
    constructor(x, y, team, type, radius, game){
        super(x,y,team,type, game);
        this.radius = radius;
        circle_list.push(this);
        }
   
   static touching_circle(circleA, circleB){
        if (sqrt(pow((circleA.x - circleB.x),2) + pow((circleA.y - circleB.y),2)) < (circleA.radius + circleB.radius)){
            return true
            }
        else {
            return false
        }

     }
   static r_touching_circle(circle, rectangle){
       var circleDistance = {};
       var rectCenter = {};
       var radius = circle.radius/settings.gridsize
       rectCenter.x = rectangle.x + rectangle.width/2
       rectCenter.y = rectangle.y + rectangle.height/2
       circleDistance.x = Math.abs(circle.x - rectCenter.x)
       circleDistance.y = Math.abs(circle.y - rectCenter.y)
       if (circleDistance.x > (rectangle.width/2 + circle.r)) {return false;}
       if (circleDistance.y > (rectangle.height/2 + circle.r)) {return false;}
       if (circleDistance.x - circle.radius <= (rectangle.width/2)) {
           if (circleDistance.y - circle.radius <= (rectangle.height/2)) {
           return true; } 
       }
       var cornerDistance = Math.pow((circleDistance.x - rectangle.width/2),2) + Math.pow((circleDistance.y - rectangle.height/2),2);
       return (cornerDistance <= Math.pow(circle.radius,2));
    }
}

var enemy_number;
function touchingEnemyOfType(object, type, game){
if (object instanceof Circle){
//console.log(player1.team);
//debug = debug + object.team.toString() + type;
    for (i = 0; i < circle_list.length; i++){
      if (object.team != circle_list[i].team && Number(circle_list[i].type) == Number(type) && circle_list[i].game == game){
            if (Circle.touching_circle(object, circle_list[i])){
            enemy_number = circle_list[i];
            return true;
            }
        }
    }
    for (i = 0; i < rectangle_list.length; i++){
        if (object.team != rectangle_list[i].team && rectangle_list[i].type == type && rectangle_list[i].game == game){
            if (Circle.r_touching_circle(object, rectangle_list[i])){
                enemy_number = rectangle_list[i];
                return true;
                }
        }
    }
}
if (object instanceof Rectangle){
    for (i = 0; i < circle_list.length; i++){
        if (object.team =! circle_list[i].team && circle_list[i].game == game){
            if (Circle.r_touching_circle(circle_list[i], object)){
                enemy_number = circle_list[i];
                return true;
                }
        }
    }
    for (i = 0; i < rectangle_list.length; i++){
        if (object.team =! rectangle_list[i].team && rectangle_list[i].game == game){
            if (Rectangle.touching_rectangle(rectangle_list[i], object)){
                enemy_number = rectangle_list[i];
                return true;
                }
        }
    }
}
return false;
}

function onCanvas(object){
if (object.x > settings.width){return false;}
else if(object.x < 0){return false;}
else if(object.y > settings.height){return false;}
else if(object.y < 0){return false;}
else {return true;}
}

function stayOnCanvas(object){
if (object.x > settings.width){object.x = settings.width;}
else if(object.x < 0){object.x = 0;}
else if(object.y > settings.height){object.y = settings.height;}
else if(object.y < 0){object.y = 0;}
}

function movePlayer(object, speed, deltatime, left, right, up, down, remainOnCanvas){
var distance = deltatime * speed;
//console.log('distance ' + distance);
var partial_distance = distance / Math.sqrt(2);
if ((left || right) && (up || down)){
    if (left){
    object.x -= partial_distance;
    }
    if (right){
    object.x += partial_distance;
    }
    if (up){
    object.y -= partial_distance;
    }
    if (down){
    object.y += partial_distance;
    }
}
else{
    if (left){
    object.x -= distance;
    }
    if (right){
    object.x += distance;
    }
    if (up){
    object.y -= distance;
    }
    if (down){
    object.y += distance;
    }
}
if (remainOnCanvas){stayOnCanvas(object);}
//console.log('x ' + object.x);
//console.log('y ' + object.y);
}

function moveDefenders(game, deltatime){
movingOrange1[game].y += speed1 * orange1direction[game] * deltatime;
if (!onCanvas(movingOrange1[game])){orange1direction[game] *= -1;
movingOrange1[game].y += speed1 * orange1direction[game] * deltatime;}

movingOrange2[game].y += speed1 * orange2direction[game] * deltatime;
if (!onCanvas(movingOrange2[game])){orange2direction[game] *= -1;
movingOrange2[game].y += speed1 * orange2direction[game] * deltatime;}

movingGreen1[game].y += speed1 * green1direction[game] * deltatime;
if (!onCanvas(movingGreen1[game])){green1direction[game] *= -1;
movingGreen1[game].y += speed1 * green1direction[game] * deltatime;}

movingGreen2[game].y += speed1 * green2direction[game] * deltatime;
if (!onCanvas(movingGreen2[game])){green2direction[game] *= -1;
movingGreen2[game].y += speed1 * green2direction[game] * deltatime;}
}
 
function movePlayerNumber(player, startX, startY, left, right, up, down, deltatime, game){
movePlayer(player, speed1, deltatime, left, right, up, down, true);
//console.log(player.team);
if (touchingEnemyOfType(player, 1, game)){
    player.x = startX;
    player.y = startY;
//console.log('player sent back to start');
    }
else if (touchingEnemyOfType(player, 0, game) && touchingEnemyOfType(player, 2, game)){
    player.x = startX;
    player.y = startY;
//console.log('player sent back to start');
    }
else if (touchingEnemyOfType(player, 0, game)){
    player.time_in_enemy_territory += deltatime;
    }
}

function moveFlag(flag, game){
if (touchingEnemyOfType(flag, 2, game)){
    flag.x = enemy_number.x;
    flag.y = enemy_number.y;
    if (touchingEnemyOfType(flag, 0, game)){
        winner[game] = enemy_number.team;
        game_over[game] = true;
        }
    }
}

function moveFlags(game){
moveFlag(flag1[game], game);
moveFlag(flag2[game], game);
}

var time_sent;
var old_number_used;
var i;

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, '/', 'capturetheflag.html'));
});

io.on('connection', function(socket){
  console.log('a user connected');

 // users++;
 // user_numbers.push(users);

old_number_used = false;
for(i = 1; i <= users; i++){

if(!io.sockets.connected[user_ids[i]]){
user_ids[i] = socket.id;
io.to(socket.id).emit('setUserNumber', i);
old_number_used = true;
break;
}

}

if(!old_number_used){
users++;
user_numbers.push(users);
user_ids[users] = socket.id;
}

 io.to(socket.id).emit('setUserNumber', users);
 // console.log('users: ' + users);
 // var sessionid = socket.id;
 // console.log('session id: ' + sessionid);

//user_ids[users] = socket.id;
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
   // users--;
    //console.log('users: ' + users);
  });

/*
socket.on('player 1 position update', function(x, y, game){
	io.emit('player 1 position update', x, y, game);
});

socket.on('player 2 position update', function(x, y, game){
	io.emit('player 2 position update', x, y, game);
});
*/

socket.on('waiting for opponent', function(user_requesting){
//console.log('user ' + user_requesting + ' waiting for opponent');
	if (user_waiting == 0){
		user_waiting = user_requesting;
		console.log('user ' + user_waiting +' waiting');
		}
	else if(io.sockets.connected[user_ids[user_waiting]]){
		games++;
		console.log('opponent found immediatly for user ' + user_requesting + ' and ' + user_waiting + '  games: ' + games);
		io.to(user_ids[user_waiting]).emit('start game', games, user_waiting, 1, user_requesting);
		io.to(user_ids[user_requesting]).emit('start game', games, user_requesting, 2, user_waiting);
		user_waiting = 0;

		//game//
		movingOrange1[games] = new Circle(settings.width - 30, settings.height, 1, 1, 1, games);
		movingOrange2[games] = new Circle(settings.width - 10, 0, 1, 1, 1, games);
		movingGreen1[games] = new Circle(10, 0, 2, 1, 1, games);
		movingGreen2[games] = new Circle(30, settings.height, 2, 1, 1, games);
		orange1direction[games] = -1;
		orange2direction[games] = 1;
		green1direction[games] = 1;
		green2direction[games] = -1;

		o1[games] = new Rectangle(settings.width - 40 - 5, settings.height - 0 - 10, 1, 1, 5, 10, games);
		o2[games] = new Rectangle(settings.width - 40 - 5, settings.height - 30 - 10, 1, 1, 5, 10, games);
		o3[games] = new Rectangle(settings.width - 20 - 5, settings.height - 15 - 10, 1, 1, 5, 10, games);

		g1[games] = new Rectangle(40, 0, 2, 1, 5, 10, games);
		g2[games] = new Rectangle(40, 30, 2, 1, 5, 10, games);
		g3[games] = new Rectangle(20, 15, 2, 1, 5, 10, games);

		flag1[games] = new Circle(settings.width - 1, settings.height/2, 1, 3, 1, games);
		flag2[games] = new Circle(1, settings.height/2, 2, 3, 1, games);

		winner[games] = 0;

		background1[games] = new Rectangle(50, 0, 1, 0, 50, 40, games);
		background2[games] = new Rectangle(0, 0, 2, 0, 50, 40, games);

		player1[games] = new Circle(settings.width - 2, settings.height - 2, 1, 2, 2, games);
		player2[games] = new Circle(2, 2, 2, 2, 2, games);

		new_time[games] = start_time[games] = t1[games] = new Date().getTime();
		game_over[games] = false;
		timer[games] = 0;
		
		player1left[games] = false;
		player1right[games] = false;
		player1up[games] = false;
		player1down[games] = false;

		player2left[games] = false;
		player2right[games] = false;
		player2up[games] = false;
		player2down[games] = false;
	}
	else{
		user_waiting = user_requesting;
		console.log('user waiting replaced because previous user waiting disconnected');		
	}
});

socket.on('update all positions', function(game, player, user, opponent, left, right, up, down){

//console.log(opponent);


if(!io.sockets.connected[user_ids[opponent]]){
console.log('user ' + opponent + ' disconnected');
game_over[game] = true;
winner[game] = 3;
}


if (!game_over[game]){

time_sent = new Date().getTime();
t2[game] = new Date().getTime();
deltatime[game] = t2[game] - t1[game];
t1[game] = t2[game];

if (new Date().getTime() - new_time[game] > 1000){
timer[game]++;
new_time[game] = new Date().getTime();
}

if (timer[game] > 119){
    game_over[game] = true;
    if (player2[game].time_in_enemy_territory > player1[game].time_in_enemy_territory){winner[game] = 2;}
    else if (player1[game].time_in_enemy_territory > player2[game].time_in_enemy_territory){winner[game] = 1;}
    }

//move defenders
moveDefenders(game, deltatime[game]);

//move players
if (player == 1){
movePlayerNumber(player1[game], settings.width - 2, settings.height - 2, left, right, up, down, deltatime[game], game);
player1left[game] = left;
player1right[game] = right;
player1up[game] = up;
player1down[game] = down;
movePlayerNumber(player2[game], 2, 2, player2left[game], player2right[game], player2up[game], player2down[game], deltatime[game], game);
}
if (player == 2){
movePlayerNumber(player2[game], 2, 2, left, right, up, down, deltatime[game], game);
player2left[game] = left;
player2right[game] = right;
player2up[game] = up;
player2down[game] = down;
movePlayerNumber(player1[game], settings.width - 2, settings.height - 2, player1left[game], player1right[game], player1up[game], player1down[game], deltatime[game], game);
}

//move flags
moveFlags(game);

//send new locations
io.to(user_ids[user]).emit('position update (everything)', game, player, time_sent, player1[game].x, player1[game].y, player2[game].x, player2[game].y, movingOrange1[game].y, movingOrange2[game].y, movingGreen1[game].y, movingGreen2[game].y, orange1direction[game], orange2direction[game], green1direction[game], green2direction[game], flag1[game].x, flag1[game].y, flag2[game].x, flag2[game].y, timer[game], game_over[game], winner[game], player1[game].time_in_enemy_territory, player2[game].time_in_enemy_territory);
//console.log(player1[game].x);
//console.log(player2[game].x);

}

else{
io.to(user_ids[user]).emit('position update (everything)', game, player, time_sent, player1[game].x, player1[game].y, player2[game].x, player2[game].y, movingOrange1[game].y, movingOrange2[game].y, movingGreen1[game].y, movingGreen2[game].y, orange1direction[game], orange2direction[game], green1direction[game], green2direction[game], flag1[game].x, flag1[game].y, flag2[game].x, flag2[game].y, timer[game], game_over[game], winner[game], player1[game].time_in_enemy_territory, player2[game].time_in_enemy_territory);
}

});


});

console.log("process.env.PORT || 5000");
console.log(process.env.PORT || 5000);
http.listen(process.env.PORT || 5000, function() {
  console.log('Node app is running on port', process.env.PORT || 5000);
});

/*
//http.listen(http.get('port'), function() {
  //console.log('Node app is running on port', http.get('port'));
//});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
*/

