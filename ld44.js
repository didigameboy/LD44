// title:  game title
// author: game developer
// desc:   short description
// script: js
//dofile("./ld44/ld44.js")
var rescale = 1; //game rescale
var anim_default_speed = 10; //anim speed, bigger is slower
var objects = [];  //store all game objects
var drawtable = []; //array of sprites to draw. the idea is to use index to order objects
var drawfirst = []; // array of sprites to draw before objects as shadows
var btn4pressed = false;
var btn5pressed = false;
var btn5released = false;
var debugmsg = "";
var debug_t = 0;
var gamestate = 0; //splash screen, - intro - menu - game - pause
var step = 0; //count step frames
var palette = "210b2e3a655a77af68dcfecfae6c37f5b7845a1991a675f60052807b7b7bcf3c71fec9ed5c3c0dcc8f15ffbb31ffffff";
var allplayers = [];
var teamplayers = [];
var sintheta = 0;
var costheta = 0;
var gamespeed = 1;
var randomItem = []; 
var score = 0;

/** Animator constructor */ //TODO make proper anim for bigger sprites (h or w >1)
function Anim(name, init, end){
 	var a = new Object();
	a.name = name; //name of the animation
	a.init = init; //index for inicial frame
	a.end = end == undefined ? init : end; //index for last animation frame
	a.speed = anim_default_speed; //anim specific speed, bigger is slower
	a.loop = true; //loop animation true|false
	a.count = 0; //count how many loops it did
	a.size = 3;
	return a;
}

/** Extended animator constructor*/
function Anim_ext(name, init, end, speed, loop){
	var a = new Anim(name, init, end);
	a.speed = speed;
	a.loop = loop;
	return a;
}

/**
 * Basic game object
 * @param {*x position} lcx 
 * @param {*y position} lcy 
 */
function GameObject(x,y){
	var obj = new Object();
	obj.name = ""; //used to identify a specific instance
	obj.tag = ""; //used to specify a group of instances
	obj.sprites = []; //store animation objects
	obj.curr = -1; //current frame playing
	obj.anim = null; //current anim to play (object Anim) {name, init, end}
	obj.spd = 1; //object spd (using for moving)
 	obj.vspeed = 0; //object vertical speed
	obj.hspeed = 0; //object horizontal speed
	obj.children = [];
	obj.parent = [];
	obj.mask = {};
	obj.x = x;
	obj.y = y;
	obj.flip = 0; //(0,1,2,3)
	obj.tcolor = 0; //index of transparent color
	obj.scale = rescale; //game rescale, rescale all sprites one by one
	obj.visible = true; //set false 
	obj.rotate = 0; 
	obj.w = 1;
	obj.h = 1;
	obj.depth = 1; //using for z order
    obj.framestep = 0; //using to animate
    obj.colided = false;
	obj.addAnim = function(a){this.sprites.push(a)}
	obj.draw = function(){
		if (this.sprites.length > 0 && this.visible) {
			if (this.anim == null) this.anim = this.sprites[0];
			this.curr = this.anim.init + Math.floor(this.framestep/this.anim.speed);
			if (this.curr >= (this.anim.end + 1)){
				this.curr = this.anim.init;
				this.framestep = 0;
				this.anim.count++;
			}
			if (typeof(camera) != "undefined") {				
				spr(this.curr, this.x - camera.x, this.y - camera.y, this.tcolor, this.scale, this.flip, this.rotate, this.w, this.h);				
			} else {
				spr(this.curr, this.x, this.y , this.tcolor, this.scale, this.flip, this.rotate, this.w, this.h);
			}
		}
		this.framestep++;
	}
	obj.setAnim = function(name){
		for (var i=0; i<this.sprites.length; i++){
			if (name == this.sprites[i].name)
				this.anim = this.sprites[i];
				this.framestep = 0;
		}
	}
	obj.getCurrentAnim = function(){ 
		return this.anim != null ? this.anim.name : "";
	}
	obj.getAnim = function(name){
		if (name == undefined) name = this.getCurrentAnim();
		for (var i=0; i<this.sprites.length; i++){
			if (name == this.sprites[i].name)
				return this.sprites[i];
		}
	}
	obj.update = function(args){}
	return obj;
}

function init(){     
    score = 0;
    trace("thanks for playing");
    var maxY = 136 - 32 -1;
    var minY = 1;
    player = new GameObject(10,10);
    player.name = "player";
    player.blood = 100;
    player.invencible = false;
    player.t_inv = 0;    
	player.w = 4;
	player.h = 4;
	player.addAnim(new Anim("idle", 42, 42));
    player.setAnim("idle");
    player.addAnim(new Anim("hurt", 170, 170));
    player.addAnim(new Anim("score", 106, 106));
	player.update = function(){
		if (btn(0)) {
            player.y--;
            if (player.y <= minY) player.y = minY;
        }
		if (btn(1)) {
            player.y++;
            if (player.y >= maxY) player.y = maxY;
        }
        if (btn(3)) {
            gamespeed = 2;
        } else gamespeed = 1;
        if (this.invencible) {
            this.t_inv++;
            if (this.t_inv > 59) {
                this.t_inv = 0;
                this.invencible = false;
                player.setAnim("idle");
            }
        } else {
            this.t_inv = 0;
        }
	}	
    objects.push(player);
}

function pixel(){
    var yp  = Math.floor(Math.random() * 136);
    var p = new GameObject(241,yp);
    var elements = [234, 235, 236, 237, 238];
    var l = Math.floor(Math.random() * 5); 
    p.addAnim(new Anim("pixel", elements[l], elements[l]));
    p.name = "pixel";
    p.hspeed = 1 + Math.floor(Math.random() * 2); 
    p.update = function(){  
        this.x = this.x - this.hspeed*gamespeed;          
    }
    return p;
}

function item(){
    var hPositions = [16, 48, 80, 112];
    var xInit = 240;
    var r  = Math.floor(Math.random() * 4);     // returns a random integer from 0 to 9
    var item  = new GameObject(xInit, hPositions[r]);
    item.colided = false;
    //garlic cross fire water knife rotten heart blood
    var elements = [2, 4, 6, 8, 10, 34, 36, 38];
    var l = Math.floor(Math.random() * 8); 
    var type = elements[l] > 11 ? "blood" : "bleed";
    item.addAnim(new Anim(type, elements[l], elements[l]));
    item.name = type;
    item.w = 2;
    item.h = 2;
    item.hspeed = 1 + Math.floor(Math.random() * 2); 
    item.update = function(){        
        this.x = this.x - this.hspeed*gamespeed;
        if ((this.x <= player.x+32 && this.x >= player.x) && (player.y-16 < this.y && player.y+32 > this.y) && !this.colided){            
            this.colided = true;
            //trace("colided: " + this.name, 1, 1);
            if (!player.invencible) {
                if (this.name == "blood") {
                    sfx(1,1,15);
                    player.blood += 10;
                    if (player.blood >= 100) player.blood = 100;
                    score +=10;
                    player.setAnim("score");
                }
                if (this.name == "bleed") {
                    sfx(0,1,15);
                    player.blood -= 20;
                    player.invencible = true;
                    player.setAnim("hurt");
                    //if (player.blood >= 100) player.blood = 100;
                }
            }
            
        }

    }
    return item;
}

function drawBegin(){	
       
	for (var i=0; i<drawfirst.length; i++){
		drawfirst[i].draw();
	}
}

function draw() {
	cls(0); //clear tranparent color /bg color

	//draw first stuff
	//drawBegin();

	//organize drawtable simulate layers with the draw call
	for (var i = 0; i < drawtable.length; i++) {
		drawtable[i] = undefined;
    }
    var removables = [];
	for (var i = 0; i < objects.length; i++) {

        if (objects[i].x < -16 || objects[i].colided) {
            removables.push(i); 
            //TODO REMOVE OBJS
            //objects[i].update = function(){this = undefined};         
        }
		var depth = Math.floor(objects[i].y); //if already has a object at this index/depth/y		 
		if (depth < 0) depth = 0; //cant have negative array index 
		while (typeof (drawtable[depth]) != "undefined") {
			depth++;
		}
		objects[i].depth = depth;
		//store the object athe the right index/depth/y --put the ball on first object to be draw
		if (objects[i].name == "player") { //the ball receive the depth player plus something
			depth = 200;
		}
		drawtable[depth] = objects[i];
    }
    //removables
    
    for (var i = removables.length-1; i > 0; i--) {
        objects.splice(removables[i], 1);
    }
    

	//draw objects
	var aux = 110;
	for (var i = 0; i < drawtable.length; i++) {
		if (typeof (drawtable[i]) != "undefined") {
			drawtable[i].draw();
			//print(drawtable[i].name + ".draw() ", 1, aux);
			aux += 10;
		}
	}
	//debug
	if (debug_t > 0) {
		print(debugmsg, 0, 80);
		debug_t--;
	}
	//debug pints on screen
	//pal(15,0); //switch 
    //print("number objects:" + objects.length, 1, 100);
    rect(32,0,(player.blood/100)*100,6, 1);
    print("blood:" + player.blood, 56, 1, 3);
    print("score:" + score, 156, 1, 3);
	//print("X:" + player.x + " Y:" + player.y, 1, 108);
	//print("ball state:"+ball.state, 1, 115);
	//pal(); //reset

}


function update(){
    if (player.blood < 0) {
        gamestate = 4;
        step = 0;
    }
    if (step % (30/gamespeed) == 0) {
        var el = new item();
        objects.push(el);        
        player.blood--;
        score++;
    }
    if (step % 10 == 0) {
        var p = new pixel();
        objects.push(p);
    }

	//update animation states	
	for (var i=0; i<objects.length; i++) {
		objects[i].update();
	}
    step++;    
}

function splashscreen(){

}

function intro(){	
    cls(0);
    spr(64, 85, 17, 0, 1, 0, 0, 10, 10);
    //title screen
    spr(416, 60, 100, 0, 1, 0, 0, 7, 2);
    spr(448, 132, 100, 0, 1, 0, 0, 9, 2);
    if ((btn(0) || btn(1) || btn(4) || btn(5) || btn(6)) && step > 60) {
        step = 0;
        init();	        
        gamestate = 1;
    }
    step++;
}

function menu(){
    cls(0);
    spr(224, 85, 18, 0, 1, 0, 0, 10, 10);
    if ((btn(0) || btn(1) || btn(4) || btn(5) || btn(6)) && step > 60) {
        step = 0;
        gamestate = 2;
    }	
    step++; 
    var text = "I have awaken.. mwahaha.. ha .h-ha \n I'm so hungry.. \nEat the good bloody stuff!\nAvoid the gross stuff!";
    print(text.substr(0,Math.floor(step/6)),60,100);
}

function pause(){
	
}

function gameover(){
    //spr id x  y   [colorkey=-1] [scale=1] [flip=0] [rotate=0] [w=1 h=1]
    rect(75,34, 84, 42, 0);
    spr(480, 91, 37, 0, 1, 0, 0, 7, 2);	
    spr(004, 75, 34, 0, 1, 0, 0, 2, 2);	
    spr(004, 146, 34, 0, 1, 0, 0, 2, 2);	
    if ((btn(0) || btn(1) || btn(4) || btn(5) || btn(6)) && step > 60) {
        step = 0;
        score = 0;
        gamestate = 0;
    }
    print("00" + score, 108, 56,3);
    step++;
}

/**
 * call init
 */
//init();
/**
 * Main LOOP //60fps \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */
function TIC()
{	
	switch (gamestate) {
		case 0:
			intro();
			break;
		case 1: 
			menu();
			break;
		case 2:  //gameloop			
			update();//update objects
			draw(); //update screen
			break;
        case 3:
			pause();
            break;
        case 4:
			gameover();
			break;
		default:
			break;
	}
	
 }
 /////////////// end Main \\\\\\\\\\\\\\\\\\\\\\\\

 //UTILS
function approach(start, end, step){
	if (start < end){
		return Math.min(start + step, end);
	} else {
		return Math.max(start - step, end);
	}
}

/**
 * EaseQuadin, function from http://www.gizma.com/easing/
 * t:time, b:start value(0), c:change in value(1), d:duration
 */
function easeQuadin(t,b,c,d){	
	t /= d;
	return c*t*t + b;
}
/**
 * Swap color C0 with C1
 * https://github.com/nesbox/TIC-80/wiki/Code-examples-and-snippets#palette-swapping
 */
function pal(c0,c1){
	if(c0 === undefined && c1 === undefined){
		for(var i=0; i<16; i++){poke4(32736 + i, i)}
	} else poke4(32736+c0,c1);	
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function toDegrees (angle) {
	return angle * (180 / Math.PI);
  }

function toRadians (angle) {
	return angle * (Math.PI / 180);
  }

function sound(id, t) {
	if (typeof (playingsfx) == "undefined") playingsfx = [];
	if (playingsfx[id] == undefined){
		sfx(0);
		playingsfx[id] = Date.now();
	} else {
		t = t === undefined ? 1 : t;
		if (((Date.now() - playingsfx[id]) / 1000) > t) {
			sfx(0);
			playingsfx[id] = Date.now();
		} 
	}
}

function lerp(a,b,t){
	return (1-t)*a + t*b;
}

function ArrayContains(arr, el) {
    for (var i=0; i < arr.length; i++){
        if (arr[i] == el){
            return true;
        }
    }
    return false;
}
