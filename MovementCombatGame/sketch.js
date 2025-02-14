let player; // define player variable
// global forces
let friction = 0.8;
let airResistance = 0.2;
let gravity = 1.2;
// Arrays for holding objects, enemies, items, and particles
let objs = [];
let enemies = [];
let items = [];
let parts = [];

// cameraVars
let cameraX = 0;
let cameraY = 0;
let cameraBorder = 120;

let testWeapon;
let level1;

function setup() {
  createCanvas(1350, 600);

  // define weapons
  defineWeapons();
  // define player
  player = new playerC();

  // define new objects
  new object(400, 500, 200, 200);
  new object(800, 450, 200, 200);
  new object(600, 400, 200, 100);
  new object(-500, 600, 5000, 50);
  new object(1000, 200, 100, 50);
  new object(1500, 200, 1000, 50);
  new object(1200, -100, 300, 50);

  // test enemy
  new enemy(100, 300, "Test");

  // test level
  level1 = new level(300, -500, objs, enemies);
}

function draw() {
  background(50);

  // call player functions
  player.updatePhysics();
  player.drawSelf();

  // draw all objects
  for(let i = 0; i < objs.length; i++){
    objs[i].drawSelf();
  }

  // call functions for enemies
  for(let i = 0; i < enemies.length; i++){
    enemies[i].drawSelf();
    enemies[i].updatePhysics();
  }
  
  // call functions for enemies
  for(let i = 0; i < items.length; i++){
    items[i].drawSelf();
    items[i].updatePhysics();
  }
  
  // Draw All Particles
  for(let i = 0; i < parts.length; i++){
    parts[i].drawSelf();
  }
}

function keyPressed(){
  if(checkKeysPressed(player.sprintKeys) == true){
    if(player.maxSpeed == 10) player.maxSpeed = 18;
    else player.maxSpeed = 10;
  }
  if(keyCode === 76) level1.loadSelf();
  if(keyCode === 75) player.respawn();
  if(keyCode === 69) new enemy(random(200, 1500), 0, "Test");
  if(keyCode === 77) player.attack();

}

function defineWeapons(){
  testWeapon = new weapon(50, 10, 150, undefined);
}

function mousePressed(){
  player.attack();
}

function newParticleSwarm(x, y, w, h, minPartSize, maxPartSize, shape, speedMax, baseColor, fadeColor, lifeSpan, easing, folowCamera, applyGravity, amnt){
  for(let i = 0; i < amnt; i++){
    let ps = random(minPartSize, maxPartSize);
    new particle(random(x, x+w), random(y, y+h), ps, ps, shape, random(-speedMax, speedMax), random(-speedMax, speedMax), baseColor, fadeColor, lifeSpan, easing, folowCamera, applyGravity);
  }
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
    this.w = 35;
    this.h = 100;
    // for crouching
    this.maxHeight = this.h;
    this.minHeight = this.h/2;

    // sprint / sliding vars
    this.slideTimer = 0;

    // define movement vars
    this.moveVec = createVector(0, 0);
    this.acceleration = 2;
    this.jumpForce = 20;
    this.maxSpeed = 10;
    this.isGrounded = false;
    this.jumps = 0;
    this.jumpKeyPressed = false;

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

    this.weapon = testWeapon; // define the currently holding weapon

    this.health = 200; // define health variable
    this.maxHealth = this.health; // define health variable
    this.attackTimer = 0;

  }
  controls(){
    //if(this.y + this.h > height - 1) this.isGrounded = true;
    this.attackTimer ++;
    for(let i = 0; i < this.keybinds.length; i++){
      if(checkKeysPressed(this.keybinds[i]) == true){
        // determine the type of control and the apropriate reaction for the player to take
        switch(i){
          case 0: this.moveVec.x -= this.acceleration; this.lastDir = "Left"; break; // move left
          case 1: this.moveVec.x += this.acceleration; this.lastDir = "Right"; break; // move left
          case 2: if(this.isGrounded == true || (this.jumps < 2 && this.jumpKeyPressed == false)) {
            this.jumps ++; 
            this.jumpKeyPressed = true; 
            this.moveVec.y = -this.jumpForce; 
            this.isGrounded = false;
            newParticleSwarm(this.x - 10, this.y + this.h, this.w + 20, 10, 5, 10, "Circle", 3, [200, 200, 200, 255], [100, 100, 100, 0], 30, "Linear", true, true, 10);
          } break; // Jump
          case 3: if(this.maxSpeed == 18 && this.isGrounded == true) this.slideTimer ++; if(this.h > this.minHeight){this.h -= 10; this.w += 7;}break; // Crouch
          // case 4: this.maxSpeed = 18; break; // Sprint
        }
      } else {  
        // reverse crouch or sprint if the keys are not pressed
        if(i == 3 && this.h < this.maxHeight) {this.h += 10; this.y -= 10; this.w -= 7;}
        if(i == 3) this.slideTimer = 0;
        if(i == 2) this.jumpKeyPressed = false;
        //if(i == 4) this.maxSpeed = 10; 
      }
    }
  }
  applyMovementVector(){
    // make the player move faster whenever they slide
    let slideChangeAmnt = constrain((20-this.slideTimer), (-this.maxSpeed + 2), 5);
    if(this.slideTimer == 0) slideChangeAmnt = 0;


    // constrain the speed of the player to a reasonable amount
    this.moveVec.x = constrain(this.moveVec.x, -this.maxSpeed - slideChangeAmnt, this.maxSpeed + slideChangeAmnt);
    this.moveVec.y = constrain(this.moveVec.y, -this.maxSpeed*3, this.maxSpeed*3);

    // apply force
    this.x += this.moveVec.x;
    this.y += this.moveVec.y;

    // constrain the position within the screen
    //this.x = constrain(this.x, 0, width - this.w);
    //this.y = constrain(this.y, 0, height - this.h);

    this.colider.updatePosition(this.x, this.y, this.w, this.h); // update colider
    if(this.y >5000) this.health -= 1;
  }
  applyResistance(){
    // grounded / apply friction
    if(this.isGrounded == true){
      // apply x friction
      if(this.moveVec.x > 0) this.moveVec.x -= friction;
      else this.moveVec.x += friction;
    }

    
    // In the air / apply Air resistance
    if(this.isGrounded == false){
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
      if(this.colider.isColiding(objs[i].colider) == true){
        let obj = objs[i];

        let objCenterX = obj.x + obj.w/2;
        let objCenterY = obj.y + obj.h/2;
        // get the angle from the center of the object to all of the corners
        // pre-defined to save computation
        let botLeftAng = obj.colider.BLA;
        let topLeftAng = obj.colider.TLA;
        let botRightAng = obj.colider.BRA;
        let topRightAng = obj.colider.TRA;

        // Starts at a vertical line, rotates 1/3 to the left, -1/3 to the right to get the bot left and right angles

        let colisionAng = atan2(objCenterX - (this.x + this.w/2), objCenterY - (this.y + this.h/2)) / PI;
        
        // collisions from this to the object
        // Top Collisions
        if(colisionAng >= topRightAng && 
          colisionAng <= topLeftAng
          ){
          this.moveVec.y = 0; 
          this.y = obj.y - this.h; 
          this.isGrounded = true; 
          this.jumps = 0;
        }
        else
        //Bottom Collisions
        if((colisionAng >= botLeftAng || 
          colisionAng <= botRightAng)
        ){
          this.moveVec.y = 0; 
          this.y = obj.y + obj.h;
        }
        else
        //Right Collisions
        if(colisionAng <= topRightAng && 
          colisionAng >= botRightAng
        
          ){ 
          this.moveVec.x = 0; 
          this.x = obj.x + obj.w
        }
        else
        // Left Collisions
        if(colisionAng >= topLeftAng && 
          colisionAng <= botLeftAng
        ){
          this.moveVec.x = 0; 
          this.x = obj.x - this.w
        }
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
    if(this.health <= 0) this.respawn();
  }
  updateCamera(){
    let xChange = max(abs(this.moveVec.x), 1);
    if(this.x - cameraX > width - this.w - cameraBorder*2) cameraX += xChange;
    else if(this.x - cameraX < this.w + cameraBorder*2) cameraX -= xChange;

    let yChange = max(abs(this.moveVec.y), 1);
    if(this.y - cameraY > height - this.h - cameraBorder) cameraY += yChange;
    else if(this.y - cameraY < this.h + cameraBorder) cameraY -= yChange;
  }
  respawn(){
    this.x = this.startX;
    this.y = this.startY;
    this.moveVec.x = 0;
    this.moveVec.y = 0;
    cameraX = 0;
    cameraY = 0;
    this.health = this.maxHealth
  }
  attack(){
    if(this.attackTimer > this.weapon.cooldown){
      switch(this.lastDir){
        case "Left" : 
        for(let i = 0; i < enemies.length; i++){
          if(collc(this.x - this.weapon.range, this.y, this.weapon.range, this.h, enemies[i].x, enemies[i].y, enemies[i].w, enemies[i].h) == true){
            enemies[i].health -= this.weapon.damage;
            newParticleSwarm(enemies[i].x, enemies[i].y, enemies[i].w, enemies[i].h, 1, 15, "Circle", 5, [200, 10, 10, 255], [255, 10, 10, 0], 30, "Linear", true, true, 30);
          }
        }
        break;
        case "Right" : 
        for(let i = 0; i < enemies.length; i++){
          if(collc(this.x + this.w, this.y, this.weapon.range, this.h, enemies[i].x, enemies[i].y, enemies[i].w, enemies[i].h) == true){
            enemies[i].health -= this.weapon.damage;
            newParticleSwarm(enemies[i].x, enemies[i].y, enemies[i].w, enemies[i].h, 1, 15, "Circle", 5, [200, 10, 10, 255], [255, 10, 10, 0], 30, "Linear", true, true, 30);
          } 
        }
        break;
      }
    }
  }
  // TEMP
  drawSelf(){
    //formatting
    fill(255);
    stroke(0);
    if(keyIsDown(72)) noFill();
    rect(this.x - cameraX, this.y - cameraY, this.w, this.h);

    // player UI
    fill(255);
    stroke(0);
    rect(20, 20, 220, 30);
    fill(200, 50, 50);
    rect(30, 25, (this.health/this.maxHealth)*200, 20);
    fill(255);
    text(this.health, 35, 38);

    // sliding trail
    if(this.slideTimer != 0 && this.isGrounded == true && abs(this.moveVec.x) > 4){
      newParticleSwarm(this.x + this.w/2-5, this.y + this.h - 10, 10, 10, 1, 10, "Circle", 3, [200, 200, 200, 255], [100, 100, 100, 0], 30, "Linear", true, false, 1);
    }

    // falling "Speed Lines"
    if(this.moveVec.y >= this.maxSpeed - 10){
      //new particle()
    }
  }
}

class weapon{
  constructor(damage, cooldown, range, texture){
    // base variables
    this.damage = damage;
    this.cooldown = cooldown;
    this.range = range;
    this.texture = texture;
  }
}

class object{
  constructor(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.colider = new rectColider(this.x, this.y, this.w, this.h);
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

    // used for collisions
    let objCenterX = this.x + this.w/2;
    let objCenterY = this.y + this.h/2;
    this.BLA = atan2(objCenterX - this.x, objCenterY - (this.y + this.h)) / PI; // 0.75 PI approx
    this.BRA = atan2(objCenterX - (this.x + this.w), objCenterY - (this.y + this.h)) / PI; // -0.75 PI approx
    this.TRA = atan2(objCenterX - (this.x + this.w), objCenterY - this.y) / PI; // -0.25 PI approx
    this.TLA = atan2(objCenterX - this.x, objCenterY - this.y) / PI; // 0.25 PI approx
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

class enemy {
  constructor(x, y, type){
    // position
    this.x = x;
    this.y = y;
    
    this.type = type;

    // things like size, speed, attack speed, vary from enemy type to enemy type
    this.typeDefinitions();
    this.colider = new rectColider(this.x, this.y, this.w, this.h);

    // movement vars similar to player functionality
    this.isGrounded = false;
    this.moveVec = createVector(0, 0);
    this.maxSpeed = 10;
    this.acceleration = 5;

    // idling is just walking around, attacking targets the player
    this.currentMoveType = "Idle";

    // moving around target positions
    this.targetX = this.x;
    this.targetY = this.y;

    // idle timing, determines how long it waits before moving again
    this.idleTimer = 0;
    this.idelWait = 10;
    
    // if it has colided with a block.
    this.hasColided = false;

    this.id = enemies.length;
    enemies.push(this); // add to the enemy array
  }
  // defines different variables dependent on the enemy type
  typeDefinitions(){
    // size
    this.w = 100;
    this.h = 100;
    // define the enemy loot table
    this.lootTable = new lootTable(["AN ITEM", "ANOTHER ITEM", "IM A THIRD ITEM", "empty"], [10, 10, 20, 60]);
    this.health = 200; // health of the enemy
    this.maxHealth = this.health; // health of the enemy
  }
  movement(){
    // determined by the movement type
    switch(this.currentMoveType){
      case "Idle":
        this.idle();
      break;
    }
  }
  idle(){
    // move towards the target position
    if(this.x < this.targetX) this.moveVec.x += this.acceleration;
    else if(this.x > this.targetX) this.moveVec.x -= this.acceleration;

    // if the enemy is close enough to the target position, dont move
    if(dist(this.x, 0, this.targetX, 0) < abs(this.moveVec.x)) this.moveVec.x = 0;
    // update wait timer once it reaches its target postion
    if(this.moveVec.x == 0 && this.moveVec.y == 0) this.idleTimer ++; 

    // reset idle values whenever it has waited the propper amount
    if(this.idleTimer > this.idelWait) {
      this.targetX = random(0, 1000);
      this.idleTimer = 0;
      this.idelWait = random(50, 100);
    }
  }
  drawSelf(){
    //formating
    fill(0);
    stroke(0);

    rect(this.x - cameraX, this.y - cameraY, this.w, this.h);

    // draw the health bar
    if(this.health < this.maxHealth) {
      fill(255);
      stroke(0);
      rect(this.x - 10 - cameraX, this.y - 30 - cameraY, this.w + 20, 20);
      fill(200, 50, 50);
      rect(this.x - cameraX, this.y - 25 - cameraY, this.w * (this.health / this.maxHealth), 10);
    }
  }
  checkCollisions(){
    // reset variable to determine if the enemy has colided and should jump
    this.hasColided = false;

    // itterate over all the objects
    for(let i = 0; i < objs.length; i++){
      // if the coliders intersect
      if(this.colider.isColiding(objs[i].colider) == true){

        // simpler object refference
        let obj = objs[i];

        // simpler refference to the center of the object
        let objCenterX = obj.x + obj.w/2;
        let objCenterY = obj.y + obj.h/2;

        // get the angle from the center of the object to all of the corners
        // pre-defined to save computation
        let botLeftAng = obj.colider.BLA;
        let topLeftAng = obj.colider.TLA;
        let botRightAng = obj.colider.BRA;
        let topRightAng = obj.colider.TRA;

        // Starts at a vertical line, rotates 1/3 to the left, -1/3 to the right to get the bot left and right angles

        let colisionAng = atan2(objCenterX - (this.x + this.w/2), objCenterY - (this.y + this.h/2)) / PI;
        
        // collisions from this to the object

        // Top Collisions
        if(colisionAng >= topRightAng && colisionAng <= topLeftAng){
          this.moveVec.y = 0; 
          this.y = obj.y - this.h; 
          this.isGrounded = true; 
        }
        else
        //Bottom Collisions
        if((colisionAng >= botLeftAng || colisionAng <= botRightAng)){
          this.moveVec.y = 0; 
          this.y = obj.y + obj.h;
          this.moveVec.y = -20;
        }
        else
        //Right Collisions
        if(colisionAng <= topRightAng && colisionAng >= botRightAng){ 
          this.moveVec.x = 0; 
          this.x = obj.x + obj.w + 2;
          this.moveVec.y = -20;
        }
        else
        // Left Collisions
        if(colisionAng >= topLeftAng && colisionAng <= botLeftAng){
          this.moveVec.x = 0; 
          this.x = obj.x - this.w;
          this.moveVec.y = -20;
          this.idleTimer ++; 
        }
      }
    }
  }
  updatePhysics(){
    this.movement();
    this.moveVec.y += gravity;
    this.applyResistance();
    this.checkCollisions();
    this.applyMovementVector();
    if(this.health <= 0) this.die();
  }
  applyResistance(){
    // grounded / apply friction
    if(this.isGrounded == true){
      // apply x friction
      if(this.moveVec.x > 0) this.moveVec.x -= friction;
      else this.moveVec.x += friction;
    }

    
    // In the air / apply Air resistance
    if(this.isGrounded == false){
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
  applyMovementVector(){

    // constrain the speed of the player to a reasonable amount
    this.moveVec.x = constrain(this.moveVec.x, -this.maxSpeed, this.maxSpeed);
    this.moveVec.y = constrain(this.moveVec.y, -this.maxSpeed*3, this.maxSpeed*3);

    // apply force
    this.x += this.moveVec.x;
    this.y += this.moveVec.y;

    // constrain the position within the screen
    //this.x = constrain(this.x, 0, width - this.w);
    //this.y = constrain(this.y, 0, height - this.h);

    this.colider.updatePosition(this.x, this.y, this.w, this.h); // update colider
  }
  // pass in variables for the enemy to it's loot table to drop said loot
  dropLoot(){
    this.lootTable.dropLoot(this.x + this.w/2, this.y + this.h/2, 15);
  }
  die(){
    this.dropLoot();
    enemies = del(enemies, this.id);
  }
}

class lootTable {
  constructor(items, chances){
    this.items = items; // array holding the types of items it can spawn

    // total of all chances should be 100
    this.chances = chances; // array holding the chances for each item to spawn
    // each array should be 1:1 with the other

    // generate a weighted array based off of the items and chacnes
    this.weightedItems = [];

    // itterate over items
    for(let i = 0; i < this.items.length; i++){

      // for the given chance of that item push it into the array
      for(let i2 = 0; i2 < this.chances[i]; i++){
        this.weightedItems.push(this.items[i]);
      }
    }
  }
  getItem(){
    // return a random item from the array
    return this.weightedItems[round(random(0, 100))];
  }
  dropLoot(x, y, amnt){
    // for the inputed amount of items, spawn a new item with a random type from the weighted items array
    for(let i = 0; i < amnt; i++){
      new inWorldItem(x + random(-50, 50), y + random(-50, 50), this.getItem());
    }
  }
}

class inWorldItem{
  constructor(x, y, type){
    this.x = x;
    this.y = y;
    this.type = type;
    this.id = items.length;
    if(this.type != "Empty") items.push(this);
    this.moveVec = createVector(random(-5, 5), random(-5, 5));
  }
  updatePhysics(){
    // if it has not colided with the ground, fall
    this.hasColided = false;

    // itterate over objects
    for(let i = 0; i < objs.length; i++){

      // if the two are coliding
      if(collc(this.x, this.y, 15, 15, objs[i].colider.x, objs[i].colider.y, objs[i].colider.w, objs[i].colider.h) == true){
        this.hasColided = true; // the item has colided with something
        break; // dont itterate over more objects than nescesary
      }
    }
    if(this.hasColided == false) this.moveVec.y += gravity; // if it hasnt colided, apply gravity
    
    // if it colides with the player, get collected
    if(collc(this.x, this.y, 15, 15, player.x, player.y, player.w, player.h, 20, 20) == true){
      this.collect();
    }

    // constrain the movement speed between -10 and 10
    this.moveVec.x = constrain(this.moveVec.x, -10, 10);
    this.moveVec.y = constrain(this.moveVec.y, -10, 10);

    // apply the move vectors if it hasnt colided
    if(this.hasColided == false) {
      this.x += this.moveVec.x;
      this.y += this.moveVec.y;
    }
  }
  drawSelf(){
    // formatting
    fill(255);
    stroke(0);

    rect(this.x-cameraX, this.y-cameraY, 15, 15);
  }
  collect(){
    //player.h += 7;
    //player.maxHeight += 7;
    items = del(items, this.id);
  }
}

// keybinds are defined as arrays because multiple keys can do one action, like w and space bar for jump
// funciton to itterate over said array to determine if that key is pressed
function checkKeysPressed(keys){
  for(let i = 0; i < keys.length; i++){
    if(keyIsDown(keys[i])) return true;
  }
  return false
}
