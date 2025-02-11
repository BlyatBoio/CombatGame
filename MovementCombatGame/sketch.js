let player; // define player variable
// global forces
let friction = 0.5;
let airResistance = 0.2;
let gravity = 1.2;
// object definitions
let objs = [];

// cameraVars
let cameraX = 0;
let cameraY = 0;
let cameraBorder = 120;

let level1;

function setup() {
  createCanvas(1350, 600);
  player = new playerC();
  new object(400, 500, 200, 200);
  new object(600, 250, 200, 100);
  level1 = new level(300, -500, objs, []);
  objs = [];
}

function draw() {
  background(50);
  player.updatePhysics();
  player.drawSelf();
  for(let i = 0; i < objs.length; i++){
    objs[i].drawSelf();
  }
}

function keyPressed(){
  if(checkKeysPressed(player.sprintKeys) == true){
    if(player.maxSpeed == 10) player.maxSpeed = 18;
    else player.maxSpeed = 10;
  }
  if(keyCode === 76) level1.loadSelf();
  if(keyCode === 75) player.respawn();

}

class playerC{
  constructor(){
    // define position
    this.x = 300;
    this.y = 100;

    // define Respawn Location
    this.startX = this.x;
    this.startY = this.y;

    // define size
    this.w = 50;
    this.h = 150;
    // for crouching
    this.maxHeight = this.h;
    this.minHeight = this.h/2;

    // sprint / sliding vars
    this.slideTimer = 0;

    // define movement vars
    this.moveVec = createVector(0, 0);
    this.acceleration = 2;
    this.jumpForce = 18;
    this.maxSpeed = 10;
    this.isGrounded = false;

    // keybinds for movement
    this.leftKeys = [65, 37]; // A and Left Arrow
    this.rightKeys = [68, 39]; // D and Right Arrow
    this.jumpKeys = [87, 32, 38]; // W, Space Bar, and Up Arrow
    this.crouchKeys = [83, 16, 40]; // S, Shift, and Down Arrow
    this.sprintKeys = [82, 17]; // R and CTRL

    // complete array of the different keybinds, itterated over in controls
    this.keybinds = [this.leftKeys, this.rightKeys, this.jumpKeys, this.crouchKeys, this.sprintKeys];

    // variable to determine the last direction the player was facing in order to tell where to attack
    this.lastDir = "Right";

    // define colider
    this.colider = new rectColider(this.x, this.y, this.w, this.h);
  }
  controls(){
    if(this.y + this.h > height - 1) this.isGrounded = true;
    for(let i = 0; i < this.keybinds.length; i++){
      if(checkKeysPressed(this.keybinds[i]) == true){
        // determine the type of control and the apropriate reaction for the player to take
        switch(i){
          case 0: this.moveVec.x -= this.acceleration; this.lastDir = "Left"; break; // move left
          case 1: this.moveVec.x += this.acceleration; this.lastDir = "Right"; break; // move left
          case 2: if(this.isGrounded) {this.moveVec.y = -this.jumpForce; this.isGrounded = false;} break; // Jump
          case 3: if(this.maxSpeed == 18 && this.isGrounded) this.slideTimer ++; if(this.h > this.minHeight){this.h -= 10; this.y += 10; this.w += 7;}break; // Crouch
          // case 4: this.maxSpeed = 18; break; // Sprint
        }
      } else {  
        // reverse crouch or sprint if the keys are not pressed
        if(i == 3 && this.h < this.maxHeight) {this.h += 10; this.y -= 10; this.w -= 7;}
        if(i == 3) this.slideTimer = 0;
        //if(i == 4) this.maxSpeed = 10; 
      }
    }
  }
  applyMovementVector(){
    // make the player move faster whenever they slide
    let slideChangeAmnt = constrain((40-this.slideTimer), (-this.maxSpeed + 2), 10);
    if(this.slideTimer == 0) slideChangeAmnt = 0;


    // constrain the speed of the player to a reasonable amount
    this.moveVec.x = constrain(this.moveVec.x, -this.maxSpeed - slideChangeAmnt, this.maxSpeed + slideChangeAmnt);
    this.moveVec.y = constrain(this.moveVec.y, -this.maxSpeed*3, this.maxSpeed*3);

    // apply force
    this.x += this.moveVec.x;
    this.y += this.moveVec.y;

    // constrain the position within the screen
    //this.x = constrain(this.x, 0, width - this.w);
    this.y = constrain(this.y, 0, height - this.h);

    this.colider.updatePosition(this.x, this.y, this.w, this.h); // update colider
  }
  applyResistance(){
    // grounded / apply friction
    if(this.isGrounded == true){
      // apply x friction
      if(this.moveVec.x > 0) this.moveVec.x -= friction;
      else this.moveVec.x += friction;
    }

    
    // In the air / apply Air resistance
    if(this.isGrounded == true){
      // apply x air Resistance
      if(this.moveVec.x > 0) this.moveVec.x -= airResistance;
      else this.moveVec.x += airResistance;

      // apply Y air Resistance
      if(this.moveVec.y > 0) this.moveVec.y -= airResistance;
      else this.moveVec.y += airResistance;
    }

    // ensure it does not continuously apply tiny forces
    if(abs(this.moveVec.x) < 1) this.moveVec.x = 0;
    if(abs(this.moveVec.y) < 1) this.moveVec.y = 0;
  }
  checkCollisions(){
    for(let i = 0; i < objs.length; i++){
      if(this.colider.isColiding(objs[i].coldier)){
        let obj = objs[i];

        let objCenterX = obj.x + obj.w/2;
        let objCenterY = obj.y + obj.h/2;
        // get the angle from the center of the object to all of the corners
        let botLeftAng = atan2(objCenterX - obj.x, objCenterY - (obj.y + obj.h)) / PI; // 0.75 PI approx
        let botRightAng = atan2(objCenterX - (obj.x + obj.w), objCenterY - (obj.y + obj.h)) / PI; // -0.75 PI approx
        let topRightAng = atan2(objCenterX - (obj.x + obj.w), objCenterY - obj.y) / PI; // -0.25 PI approx
        let topLeftAng = atan2(objCenterX - obj.x, objCenterY - obj.y) / PI; // 0.25 PI approx

        // All angles divided by PI for simpler numbers

        // Starts at a vertical line, rotates 1/3 to the left, -1/3 to the right to get the bot left and right angles

        let colisionAng = atan2(objCenterX - (this.x + this.w/2), objCenterY - (this.y + this.h/2)) / PI;
        
        // Top Collisions
        if(colisionAng >= topRightAng && colisionAng <= topLeftAng){ this.moveVec.y = 0; this.y = obj.y - this.h; this.isGrounded = true;}
        else
        //Bottom Collisions
        if(colisionAng >= botLeftAng || colisionAng <= botRightAng){ this.moveVec.y = 0; this.y = obj.y + obj.h;}
        else
        //Right Collisions
        if(colisionAng <= topRightAng && colisionAng >= botRightAng){ this.moveVec.x = 0; this.x = obj.x + obj.w}
        else
        // Left Collisions
        if(colisionAng >= topLeftAng && colisionAng <= botLeftAng){ this.moveVec.x = 0; this.x = obj.x - this.w}
      }
    }
  }
  updatePhysics(){
    this.controls();
    this.moveVec.y += gravity;
    this.applyResistance();
    this.checkCollisions();
    this.applyMovementVector();
    this.updateCamera();
  }
  updateCamera(){
    if(dist(this.x, this.y, width/2, height/2)){
      
    }
    let xChange = abs(this.moveVec.x);
    if(this.x - cameraX > width - this.w - cameraBorder) cameraX += xChange;
    else if(this.x - cameraX < this.w + cameraBorder) cameraX -= xChange;

    let yChange = abs(this.moveVec.y);
    if(this.y - cameraY > height - this.h - cameraBorder) cameraY += yChange;
    else if(this.y - cameraY < this.h + cameraBorder) cameraY -= yChange;
  }
  respawn(){
    this.x = this.startX;
    this.y = this.startY;
    this.moveVec.x = 0;
    this.moveVec.y = 0;
  }
  // TEMP
  drawSelf(){
    //formatting
    fill(255);
    stroke(0);
    if(keyIsDown(72)) noFill();
    rect(this.x - cameraX, this.y - cameraY, this.w, this.h);
  }
}

class object{
  constructor(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.coldier = new rectColider(this.x, this.y, this.w, this.h);
    this.id = objs.length;
    objs.push(this);
  }
  drawSelf(){
    // formatting
    fill(255);
    stroke(0);

    if(keyIsDown(72)) noFill();
    rect(this.x - cameraX, this.y - cameraY, this.w, this.h);
  }
}

class rectColider{
  constructor(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  drawBounds(){
    fill(200, 50, 50, 150);
    noStroke();
    rect(this.x, this.y, this.w, this.h);
  }
  // provide another colider to determine if they are coliding
  isColiding(Colider){
    return collc(this.x, this.y, this.w, this.h, Colider.x, Colider.y, Colider.w, Colider.h);
  }
  updatePosition(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

class level {
  constructor(startX, startY, objects, enemies){
    this.objects = objects;
    this.enemies = enemies;
    this.startX = startX;
    this.startY = startY;
  }
  loadSelf(){
    // load objects
    objs = this.objects;
    // move player to the start location
    player.x = this.startX;
    player.y = this.startY;

    // reset the player to the spawn location
    player.respawn();
  }
}

function collc(x, y, w, h, x2, y2, w2, h2, bx, by)
{
  // apply the bezzle to the xs
  if (bx != 0 && bx != undefined)
  {
    x = x - bx / 2;
    x2 = x2 - bx / 2;
    w = w + bx;
    w2 = w2 + bx;
  }

  // apply the bezzle to the ys
  if (by != 0 && by != undefined)
  {
    y = y - by / 2;
    y2 = y2 - by / 2;
    h = h + by;
    h2 = h2 + by;
  }

  // draw hit boxes if debug mode is on and H is pressed
  if (keyIsDown(72)) {fill(200, 50, 50, 100); rect(x, y, w, h); rect(x2, y2, w2, h2) }

  // actual collisions
  if (x + w > x2 && x < x2 + w2 && y + h > y2 && y < y2 + h2) return true;

  return false;
}

// keybinds are defined as arrays because multiple keys can do one action, like w and space bar for jump
// //funciton to itterate over said array to determine if that key is pressed
function checkKeysPressed(keys){
  for(let i = 0; i < keys.length; i++){
    if(keyIsDown(keys[i])) return true;
  }
  return false
}