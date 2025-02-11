let velocities = [];
let positions = [];
let numRaindrops = 512;
let rainHeight = 10;
let gravity = 0.9;
let wind = 0.0;
let buildings = [];
let cars = [];
let windSlider, gravitySlider;
let noiseOffset = 0;
let maxCars = 4;
let carSpawnTimer = 0;
let spawnCooldown = 120; // Time between car spawns
let spawnDistance = 150; // Minimum distance to next car at spawn
let minCarGap = 60; // Minimum gap between cars while moving
let buildingLights = {}; // Store active lights on buildings
let lightGridSize = 20; // Size of grid spacing for lights

function setup() {
  
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(600, 600, WEBGL);
  canvas.parent("canvas-container");
  // resize canvas is the page is resized
  
  windSlider = createSlider(-5, 5, 0, 0.1);
  windSlider.position(40, height + 110);
  windSlider.style('width', '100px');

  gravitySlider = createSlider(0.1, 5, 1, 0.1);
  gravitySlider.position(40, height + 140);
  gravitySlider.style('width', '100px');
  
  camera(-400, -400, 400, 0, 0, 0, 0, 1, 0);
  
  for (let i = 0; i < numRaindrops; i++) {
    positions.push(createVector(random(-width / 2, width / 2), random(-height / 2, height / 2), random(-200, 200)));
    velocities.push(createVector(random(-0.5, 0.5), random(1, 3), 0));
  }
  
  let streetZ = 50;
  for (let i = -width / 2; i < width / 2; i += 100) {
    let building = {
      x: i,
      z: streetZ,
      w: 80,
      h: random(100, 250),
      d: 80
    };
    buildings.push(building);
    buildingLights[building.x] = [];
  }
}

function draw() {
  background(20);
  orbitControl();
  gravity = gravitySlider.value();
  wind = windSlider.value();
  noiseOffset += 0.01;
  carSpawnTimer++;
  
  if (carSpawnTimer >= spawnCooldown && cars.length < maxCars) {
    let newCarX = -width / 2;
    let newCarSpeed = random(1, 3);
    let canSpawn = true;
    
    for (let car of cars) {
      if (abs(car.x - newCarX) < spawnDistance) {
        canSpawn = false;
        break;
      }
    }
    
    if (canSpawn) {
      cars.push({
        x: newCarX,
        z: 50,
        speed: newCarSpeed,
        baseSpeed: newCarSpeed,
        color: color(random(100, 255), random(100, 255), random(100, 255))
      });
      carSpawnTimer = 0;
    }
  }
  
  cars = cars.filter(car => car.x < width / 2);
  
  // Generate grid-based building lights with Perlin noise timing
  // Draw street
  push();
  translate(0, 1, 50);
  fill(50);
  box(width, 2, 100);
  pop();

  // Draw cars with smooth collision avoidance, keeping them traveling as a pack
  for (let i = 0; i < cars.length; i++) {
    let c = cars[i];
    let noiseFactor = noise(noiseOffset + i) * 0.5 + 0.5;
    c.speed = max(c.baseSpeed * (0.8 + noiseFactor * 0.4), c.speed);
    
    for (let j = 0; j < cars.length; j++) {
      if (i !== j && cars[j].x - c.x < minCarGap) {
        let targetSpeed = cars[j].speed * 0.95;
        c.speed = max(targetSpeed, c.baseSpeed * 0.8);
      }
    }
    
    c.x += c.speed;
    
    push();
    translate(c.x, -10, c.z);
    fill(c.color);
    box(40, 15, 20);
    
    // Headlights
    push();
    translate(20, 0, -5);
    rotateZ(HALF_PI);
    fill(255, 255, 100, 100);
    noStroke();
    cone(10, 50);
    pop();
    
    push();
    translate(20, 0, 5);
    rotateZ(HALF_PI);
    fill(255, 255, 100, 100);
    noStroke();
    cone(10, 50);
    pop();
    
    pop();
  }

  for (let b of buildings) {
    let lightSpawnChance = noise((frameCount + noise(b.x) * 500) * 0.008 + b.x) * 1.0;
    if (lightSpawnChance > 0.5 && frameCount % int(map(noise(b.x), 0, 1, 180, 400)) === 0) {
      let numLights = int(map(lightSpawnChance, 0.5, 1.0, 1, 3)); // Random 1 to 3 lights per cycle {
      let lightStartDelay = int(random(30, 90)); // Delay between lights in a group
      for (let i = 0; i < numLights; i++) {
        let cols = int(b.w / lightGridSize);
        let rows = int(b.h / lightGridSize);
        let availableGridX = [];
        for (let x = -b.w / 2 + 10; x <= b.w / 2 - 10; x += lightGridSize * 1.05) {
          availableGridX.push(x);
        }
        let gridX = random(availableGridX);
        let availableGridY = [];
        for (let y = -b.h / 2 + 10; y <= b.h / 2 - 10; y += lightGridSize * 0.8) {
          availableGridY.push(y);
        }
        let gridY = random(availableGridY);
        let lightDelay = frameCount + lightStartDelay + int(map(noise(b.x * 0.1), 0, 1, 200, 450)); // Delay between spawns
        let newLight = {
          x: gridX,
          y: gridY,
          timer: frameCount + lightDelay
        };
        
        let overlapping = buildingLights[b.x].some(light => light.x === newLight.x && light.y === newLight.y);
        if (!overlapping) {
          buildingLights[b.x].push(newLight);
        }
      }
    }
    
    buildingLights[b.x] = buildingLights[b.x].filter(light => light.timer > frameCount);
  }
  
  for (let b of buildings) {
    push();
    translate(b.x, -b.h / 2, -b.z);
    fill(100);
    box(b.w, b.h, b.d);
    
    for (let light of buildingLights[b.x]) {
      push();
      translate(light.x, light.y, b.d / 2 + 1);
      fill(255, 255, 100);
      box(10, 10, 2);
      pop();
    }
    
    pop();
  }
  
  for (let i = 0; i < positions.length; i++) {
    let pos = positions[i];
    let vel = velocities[i];
    
    pos.y += vel.y * gravity;
    pos.x += vel.x + wind * 0.5;
    
    if (pos.y > height / 2) {
      pos.y = -height / 2;
      pos.x = random(-width / 2 - abs(wind * 10), width / 2 + abs(wind * 10));
    }
    
    push();
    translate(pos.x, pos.y, pos.z);
    rotateZ(-atan2(wind * 0.5, vel.y));
    fill(110, 150, 255);
    box(2, rainHeight, 2);
    pop();
  }
}

