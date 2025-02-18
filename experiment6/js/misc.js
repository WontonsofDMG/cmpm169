
let carSpriteSheet,npcSpriteSheet1,npcSpriteSheet2;
let carFrames = [];
let npcFrames = [];
let npcCars = [];
let lightPoles = [];
let roadEdges = [];
let baseCurve = 0;
let curveAmount = 100;
let laneSpeed = 0.02;
let roadWidth = 300;
let car;
let maxCars = 5;
let spawnInterval = 150; // Frames between each new car spawn
let spawnCounter = 0;
let minVerticalGap = 150; // Strict vertical gap

let lightPoleSwitchCounter = 0;
let lightPoleSwitchThreshold = 15; // Adjust switch interval as needed
let switchPoles = false; // State to track switching

function preload() {
  carSpriteSheet = loadImage('../experiment6/spr_red_coupe_0.png'); // Load spritesheet
  dashboard = loadImage('../experiment6/cardash.png');
  npcSpriteSheet1= loadImage('../experiment6/jeep_trailcat.png'); // Load spritesheet
  npcSpriteSheet2= loadImage('../experiment6/ferrari_laferrari-export.png'); // Load spritesheet
  engineSound = loadSound('../experiment6/engine-47745.mp3');
  crashSound = loadSound('../experiment6/crash.wav');
  textSound = loadSound('../experiment6/text.wav');
  textSound.setVolume(0.5);

}

class NpcCar {
  constructor(npcCars = []) {
    const laneData = this.assignRandomLane(npcCars);
    this.lane = laneData.lane;
    this.x = laneData.x;
    this.targetX = this.x; // Ensure correct initial positioning
    this.hasCollided = false; // Flag to track collision
    this.y = height / 300; // Fixed spawn height
    this.speed = 1;
    this.frame = floor(random(2)) // Random sprite frame
  }

  // Assign NPC to a random lane while ensuring two cars don't spawn in the same lane
  assignRandomLane(npcCars) {
    let availableLanes = [0, 1, 2]; // Left, Center, Right
    let usedLanes = new Set(npcCars.map(npc => npc.lane));
    let possibleLanes = availableLanes.filter(lane => !usedLanes.has(lane));

    let chosenLane = possibleLanes.length > 0 ? random(possibleLanes) : random(availableLanes);

    // Determine initial X position based on lane choice
    let closestEdge = roadEdges.find(edge => edge.y >= height / 3);
    let x = width / 2; // Default to center

    if (closestEdge) {
      let leftLane = closestEdge.left + roadWidth / 6;
      let centerLane = (closestEdge.left + closestEdge.right) / 2;
      let rightLane = closestEdge.right - roadWidth / 6;
      
      let lanePositions = [leftLane, centerLane, rightLane];
      x = lanePositions[chosenLane];
    }

    return { lane: chosenLane, x: x };
  }

  update() {
    this.y += this.speed;

    // Smoothly adjust the X position based on updated perspective
    let closestEdge = roadEdges.find(edge => edge.y >= this.y);
    if (closestEdge) {
      let leftLane = closestEdge.left + roadWidth / 6;
      let centerLane = (closestEdge.left + closestEdge.right) / 2;
      let rightLane = closestEdge.right - roadWidth / 6;

      let lanePositions = [leftLane, centerLane, rightLane];
      this.targetX = lanePositions[this.lane];
    }

      this.x = lerp(this.x, this.targetX, 1.1);
    
  }

  display() {
    let scaleFactor = map(this.y, height / 3, height, 0.5, 1); // Shrink when far away
    let w = (roadWidth/1.5) * scaleFactor;
    let h = 100 * scaleFactor;

    if (!isNaN(this.y)) {
      imageMode(CENTER);
      image(npcFrames[this.frame], this.x-20, this.y, w/1.5, h/1.5);
    }
     // Draw hitbox for debugging
    //push();
    //noFill();
    //stroke(255, 0, 0);
    //rectMode(CENTER);
    //rect(this.x-20, this.y+5, w/2.6, h/3);
    //pop();
  }
  getHitbox() {
    let scaleFactor = map(this.y, height / 3, height, 0.5, 1);
    let w = (roadWidth / 1.5) * scaleFactor;
    let h = 100 * scaleFactor;
    return {
      x: this.x-20 - w / 2.6, // Adjusted hitbox center
      y: this.y + 5 - h/1.9,
      w: w / 2.6,
      h: h / 3
    };
  }
}


// **Extract frames from the spritesheet**
function extractCarFrames() {
  let cols = 6;
  let rows = 4;
  let frameWidth = carSpriteSheet.width / cols;
  let frameHeight = carSpriteSheet.height / rows;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let frame = carSpriteSheet.get(x * frameWidth, y * frameHeight, frameWidth, frameHeight);
      carFrames.push(frame);
    }
  }
  cols = 10;
  rows = 5;
  frameWidth = carSpriteSheet.width / cols;
  frameHeight = carSpriteSheet.height / rows;
  frame = npcSpriteSheet1.get(0 * frameWidth, 0 * frameHeight, frameWidth, frameHeight);
  npcFrames.push(frame);
  frame = npcSpriteSheet1.get(6 * frameWidth-17, 0 * frameHeight, frameWidth, frameHeight);
  npcFrames.push(frame);
  
}

// **Car Class**
class Car {
  constructor() {
    this.x = 0;
  }

  update() {
    let targetX = map(mouseX, 0, width, -roadWidth / 2, roadWidth / 2);
    this.x = lerp(this.x, targetX, 0.1);
  }

  display() {
    let screenX = width / 2 + this.x;
    let screenY = height - 210;
    let w = roadWidth / 2.5;
    let h = 80;

    imageMode(CENTER);
    image(carFrames[0], screenX, screenY, w, h);
     // Draw hitbox for debugging (Adjusted)
    //push();
    //noFill();
    //stroke(0, 255, 0);
    //rectMode(CENTER);
    //rect(screenX - 20, screenY+20, w / 2.5, h / 3);
    //pop();
    
  }
  
  getHitbox() {
    let screenX = width / 2 + this.x;
    let screenY = height - 210;
    let w = roadWidth / 2.5;
    let h = 80;
    return {
      x: screenX - 20 - w / 2.6, // Adjusted hitbox center
      y: screenY - 20 - h / 24,
      w: w / 2.5,
      h: h / 3
    };
  }
}

// Collision Detection Function
function checkCollision(car, npc) {
  if (npc.hasCollided) return; // Skip if already collided
  let carBox = car.getHitbox();
  let npcBox = npc.getHitbox();

  let collided =
    carBox.x < npcBox.x + npcBox.w &&
    carBox.x + carBox.w > npcBox.x &&
    carBox.y < npcBox.y + npcBox.h &&
    carBox.y + carBox.h > npcBox.y;

  if (collided) {
    npc.hasCollided = true; // Mark as collided to prevent multiple detections
  }

  return collided;
}

// **dash Class**
class Dash {
  constructor() {
    this.x = 0;
  }

  update() {
    let targetX = map(0, 0, width, -roadWidth / 2, roadWidth / 2);
  }

  display() {
    let screenX = width / 2 + this.x;
    let screenY = height - 95;
    let w = roadWidth*2;
    let h = 200;

    imageMode(CENTER);
    image(dashboard, screenX, screenY, w, h);
  }
}

// **Light Pole Class with Switching Effect**
class LightPole {
  constructor(index) {
    this.xLeft = 0;
    this.xRight = 0;
    this.y = 0;
    this.height = 70;
    this.index = index;
    this.startSide = index % 2 === 0 ? "left" : "right"; // Staggered start
  }

  setPosition(leftX, rightX, y) {
    this.xLeft = leftX;
    this.xRight = rightX;
    this.y = y - this.height;
  }

  update() {
    this.y += laneSpeed * 50;
    if (this.y > height) {
      this.y = height / 3 - this.height;
    }
  }
  
  display() {
    fill(255, 255, 0);
    let side = switchPoles ? (this.startSide === "left" ? "right" : "left") : this.startSide;

    let scaleFactor = map(this.y+140, height / 3, height, 0.4, 1);
    let yOffset = (1 - scaleFactor) * this.height;
    if (side === "left") {
      rect(this.xLeft, this.y+ yOffset, 10*scaleFactor, this.height*scaleFactor);
    } else {
      rect(this.xRight, this.y+ yOffset, 10*scaleFactor, this.height*scaleFactor);
    }
  }
}

function drawScene() {
  let roadWidthTop = 90;
  let roadWidthBottom = roadWidth + 10;
  let horizonY = -100;
  let bottomY = height + 450;
  let roadHeight = bottomY + horizonY;
  let horizonX = width / 2;

  //fill(50, 180, 50);
  //rect(0, height / 3, width, height);

  fill(60);
  stroke(60);

  roadEdges = [];
  extraRoadEdges = [];

  let totalVertexCount = 50;

  for (let i = 0; i < totalVertexCount; i++) {
    let y1 = horizonY + (i / totalVertexCount) * roadHeight / 2.2;
    let y2 = horizonY + ((i + 1) / totalVertexCount) * roadHeight / 2.2;

    let scale1 = i/ totalVertexCount;
    let scale2 = (i + 1) / totalVertexCount;

    let w1 = lerp(roadWidthTop, roadWidthBottom, scale1);
    let w2 = lerp(roadWidthTop, roadWidthBottom, scale2);

    let curveOffset1 = sin((frameCount * 0.005) + scale1 * 2) * curveAmount * (1 - scale1);
    let curveOffset2 = sin((frameCount * 0.005) + scale2 * 2) * curveAmount * (1 - scale2);

    let x1L = horizonX - w1 / 2 + curveOffset1;
    let x1R = horizonX + w1 / 2 + curveOffset1;
    let x2L = horizonX - w2 / 2 + curveOffset2;
    let x2R = horizonX + w2 / 2 + curveOffset2;

    // Store road edges for cars to use
    roadEdges.push({ y: y1, left: x1L, right: x1R });
    if (i>1){
    quad(x1L, y1, x1R, y1, x2R, y2, x2L, y2);
    }
    
      for (let i = 0; i < lightPoles.length; i++) {
  let index = (i * 6)+16; // Change this to 3 or 4 for spacing
  if (roadEdges[index]) {
    lightPoles[i].setPosition(roadEdges[index].left-20, roadEdges[index].right+20, roadEdges[index].y);
  }
  }
  }
  fill(250, 0,0);
  rect(-50, height / 1.7, width+100, height,140);
}
