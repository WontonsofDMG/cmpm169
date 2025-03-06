let mic;
let fft;
let city;
let prevEnergy = 0;
let noiseOffsets = [];
let buildings = [];
let buildingLights = {}; // Store active lights on buildings
let lightGridSize = 30;

let headImg, bodyImg, guysImg;
let runners = [];
let frameTimer = 0;
let frameIndex = 0;

let skulls = [];
let ghosts = [];
let fireParticles = [];
let fireLocations = {}; 

const SPRITE_COLUMNS = 8;
const CHARACTER_COUNT = 4;

let prevBeamColor;
let smoothedBeamLength = 0; // Global variable for smoothed beam length
let smoothedSoundVolume = 0; // Global variable for smoothed sound volume
let smoothedBeamThickness = 0; // Global variable for smoothed beam thickness
let smoothedZigzagAmount = 0; // Global variable for smoothed zigzag amount
let smoothedZigzagCount = 0; // Global variable for smoothed zigzag count
let smoothingFactor = 0.2; // Global smoothing factor

let micSensitivitySlider, trebleSensitivitySlider, midSensitivitySlider, bassSensitivitySlider;

function preload() {
  headImg = loadImage('../experiment8/headlol.png');
  bodyImg = loadImage('../experiment8/body.png');
  guysImg = loadImage('../experiment8/guys.png');
  nightImg = loadImage('../experiment8/starrynight.png');
}

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(800, 600);
  canvas.parent("canvas-container");
  mic = new p5.AudioIn();
  mic.start();
  getAudioContext().suspend();
  textAlign(CENTER, CENTER);
  textSize(18);
  fill(255);
  text("Click to start the mic", width/2, height/2);
  generateCity2D();
  generateRunners();
  canvas.mousePressed(() => {
    getAudioContext().resume();
  });
  fft = new p5.FFT();
  fft.setInput(mic);
  prevBeamColor = color(255, 165, 0);

  createDiv('Mic Sensitivity').position(width+60, height- 100);
  micSensitivitySlider = createSlider(0.6, 10, 1.5, 0.1).position(width+60, height-80);

  createDiv('Mid Sensitivity').position(width+60, height-60);
  midSensitivitySlider = createSlider(0.1, 5, 0.5, 0.1).position(width+60, height-40);

  createDiv('Treble Sensitivity').position(width+60, height-20);
  trebleSensitivitySlider = createSlider(0.1, 1, 0.5, 0.1).position(width+60, height);

  createDiv('Bass Sensitivity').position(width+60, height+20);
  bassSensitivitySlider = createSlider(0.1, 1.5, 1, 0.05).position(width+60, height+40);

}

function interpolateColor(color1, color2, factor) {
  let r = lerp(red(color1), red(color2), factor);
  let g = lerp(green(color1), green(color2), factor);
  let b = lerp(blue(color1), blue(color2), factor);
  return color(r, g, b);
}

function draw() {
  background(0);
  push();
  imageMode(CENTER);
  image(nightImg, width/2, height/2, width, height);
  pop();
  drawCity();
  drawFloor();
  drawRunners();
  drawSkulls();
  drawGhosts();
  respawnRunners();

  let bodyX = width / 10;
  let bodyY = height/1.13;
  
  let headX = width / 13; // Adjusted for correct positioning
  let headY = height / 1.195; // Adjusted to better align with mouth

  let angle = atan2(mouseY - headY, mouseX - headX);

  // Draw body
  imageMode(CENTER);
  image(bodyImg, bodyX, bodyY, 150, 150);

  let spectrum = fft.analyze();
  let soundVolume = mic.getLevel() * micSensitivitySlider.value();
  let bass = fft.getEnergy('bass') * bassSensitivitySlider.value();
  let treble = fft.getEnergy('treble') * trebleSensitivitySlider.value();
  let mid = fft.getEnergy('mid') * midSensitivitySlider.value();

  let beatDetected = bass > prevEnergy * 1.2;
  prevEnergy = bass;

  let targetBeamThickness = map(bass, 0, 255, 2, 20);
  let targetBeamLength = map(soundVolume, 0, 1, 20, 1000);
  let targetZigzagAmount = map(treble, 0, 255, 5, 100);
  let targetZigzagCount = floor(map(treble, 0, 255, 1, 10));

  // Smoothly transition to the target values only when retracting
  smoothedBeamLength = targetBeamLength < smoothedBeamLength ? lerp(smoothedBeamLength, targetBeamLength, smoothingFactor) : targetBeamLength;
  smoothedSoundVolume = targetBeamLength < smoothedSoundVolume ? lerp(smoothedSoundVolume, soundVolume, smoothingFactor) : soundVolume;
  smoothedBeamThickness = targetBeamThickness < smoothedBeamThickness ? lerp(smoothedBeamThickness, targetBeamThickness, smoothingFactor) : targetBeamThickness;
  smoothedZigzagAmount = targetZigzagAmount < smoothedZigzagAmount ? lerp(smoothedZigzagAmount, targetZigzagAmount, smoothingFactor) : targetZigzagAmount;
  smoothedZigzagCount = targetZigzagCount < smoothedZigzagCount ? lerp(smoothedZigzagCount, targetZigzagCount, smoothingFactor) : targetZigzagCount;

  // Define the colors for the gradient
  let colorStart = color(255, 165, 0); // Orange
  let colorMid = color(255, 0, 0); // Red
  let colorEnd = color(0, 0, 255); // Blue

  // Map the beam length to a factor between 0 and 1
  let colorFactor = map(smoothedBeamLength, 20, 1000, 0, 1);

  // Interpolate between orange and red for the first quarter, then red and blue for the last quarter
  let targetBeamColor;
  if (colorFactor < 0.25) {
    targetBeamColor = interpolateColor(colorStart, colorMid, colorFactor / 0.25);
  } else if (colorFactor < 0.75) {
    targetBeamColor = interpolateColor(colorMid, colorMid, (colorFactor - 0.25) / 0.5);
  } else {
    targetBeamColor = interpolateColor(colorMid, colorEnd, (colorFactor - 0.75) / 0.25);
  }

  // Smoothly transition to the target color
  beamColor = interpolateColor(prevBeamColor, targetBeamColor, smoothingFactor);
  prevBeamColor = beamColor;

  if (noiseOffsets.length < smoothedZigzagCount) {
    for (let i = noiseOffsets.length; i < smoothedZigzagCount; i++) {
      noiseOffsets.push(random(1000));
    }
  }

  let endX = headX + cos(angle) * smoothedBeamLength;
  let endY = headY + sin(angle) * smoothedBeamLength;

  if (smoothedSoundVolume > 0.05) {
    drawBaseLaser(headX, headY, endX, endY, smoothedBeamThickness, beamColor, beatDetected);
    for (let i = 0; i < smoothedZigzagCount; i++) {
      let noiseOffset = noiseOffsets[i];
      drawElectricZigzag(headX, headY, endX, endY, smoothedBeamThickness / (i + 1), beamColor, smoothedZigzagAmount, noiseOffset, beatDetected);
    }
    drawOrbs(headX, headY, endX, endY, mid, smoothedBeamThickness);
    checkRunnerHits(headX, headY, endX, endY);
  }

  // Draw head
  push();
  translate(headX, headY);
  rotate(angle+6);
  image(headImg, 0, 0, 150, 90);
  pop();
}

function generateRunners() {
  for (let i = 0; i < 5; i++) {
    let direction = random() > 0.5 ? 1 : -1;
    let runner = {
      x: random(width),
      y: height - 40,
      speed: random(1, 3) * direction,
      flipped: direction === -1,
      characterIndex: floor(random(CHARACTER_COUNT)), // Picks one of 4 characters
      alive: true,
      respawnTimer: 0,
    };
    runners.push(runner);
  }
}

function drawRunners() {
  frameTimer++;
  if (frameTimer > 10) {
    frameIndex = (frameIndex + 1) % 2; // Toggle between 2 frames per character
    frameTimer = 0;
  }

  for (let runner of runners) {
    if (!runner.alive) 
    {
      continue;
    }
    runner.x += runner.speed;

    if (runner.x < -20) runner.x = width + 20;
    if (runner.x > width + 20) runner.x = -20;

    let spriteX = (runner.characterIndex * 2 + frameIndex) * guysImg.width/8; // Get correct frame
    let spriteY = 0; // Only one row

    push();
    translate(runner.x, runner.y);
    if (runner.flipped) {
      scale(-1, 1);
    }
    image(guysImg, 0, 0, 30, 30, spriteX, spriteY, guysImg.width/8, guysImg.height);
    pop();
  }
}

function checkRunnerHits(x1, y1, x2, y2) {
  for (let runner of runners) {
    if (!runner.alive) continue;
    
    let segments = 20; // Increase accuracy along the beam
    for (let i = 0; i <= segments; i++) {
      let t = i / segments;
      let beamX = lerp(x1, x2, t);
      let beamY = lerp(y1, y2, t);
      let d = dist(runner.x, runner.y, beamX, beamY);
      
      if (d < 20) {
        runner.alive = false;
        runner.respawnTimer = frameCount + 100;
        skulls.push({ x: runner.x, y: runner.y, speedX: random(-3, 3), speedY: -2, rotation: 0 });
        ghosts.push({ x: runner.x, y: runner.y, alpha: 255 });
        break;
      }
    }
  }
}

function drawSkulls() {
  for (let skull of skulls) {
    skull.y += skull.speedY;
    skull.x += skull.speedX;
    skull.speedY += 0.2; 
    skull.rotation += skull.speedX * 0.1;
    
    push();
    translate(skull.x, skull.y);
    rotate(skull.rotation);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("💀", 0, 0);
    pop();
  }
}

function drawGhosts() {
  for (let ghost of ghosts) {
    ghost.y -= 1;
    ghost.alpha -= 3;
    if (ghost.alpha > 0) {
      push();
      fill(255, ghost.alpha);
      textSize(16);
      textAlign(CENTER, CENTER);
      text("👻", ghost.x, ghost.y);
      pop();
    }
  }
  ghosts = ghosts.filter(g => g.alpha > 0);
}

function respawnRunners() {
  for (let runner of runners) {
    if (!runner.alive && frameCount > runner.respawnTimer) {
      runner.alive = true;

      // Randomly choose whether to spawn on the left or right outside the screen
      if (random() < 0.5) {
        runner.x = random(-width, -10); // Spawn off-screen to the left
      } else {
        runner.x = random(width + 10, width * 2); // Spawn off-screen to the right
      }

      runner.y = height - 40;
    }
  }
}

function drawBaseLaser(x1, y1, x2, y2, thickness, col, beat) {
  stroke(col);
  strokeWeight(thickness);
  line(x1, y1, x2, y2);
}

function drawElectricZigzag(x1, y1, x2, y2, thickness, col, zigzag, noiseOffset, beat) {
  stroke(col);
  strokeWeight(thickness / 2);
  noFill();
  
  beginShape();
  let segments = 25; // Controls smoothness of zigzag

  for (let i = 0; i <= segments; i++) {
    let t = i / segments;
    let x = lerp(x1, x2, t);
    let y = lerp(y1, y2, t);
     if (i == 0) {
      vertex(x1, y1);
      continue;
    }

    // Core Perlin Noise + Sinusoidal Motion for organic flow
    let perlinOffset = map(noise(noiseOffset + i * 0.2, frameCount * 0.02), 0, 1, -zigzag, zigzag);
    let waveFactor = sin((frameCount * 0.2) + (i * 1.5)) * (zigzag * 0.6);

    // Amplify movement on beat detection
    if (beat) {
      waveFactor *= 1.6;
      perlinOffset *= 1.4;
    }

    vertex(x + perlinOffset, y + waveFactor);
  }

  endShape();
}


function drawOrbs(x1, y1, x2, y2, midEnergy, beamThickness) {
  let orbCount = floor(map(midEnergy, 0, 255, 0, 55));
  for (let i = 0; i < orbCount; i++) {
    let t = (i + 1) / (orbCount + 1);
    let x = lerp(x1, x2, t);
    let y = lerp(y1, y2, t);
    let offsetY = sin(frameCount * 0.1 + i) * (beamThickness * 0.5); // Adjust offsetY based on beam thickness
    
    fill(255, 255, 0, 150);
    noStroke();
    ellipse(x, y + offsetY, 5, 5);
  }
}



function generateCity2D() {
  buildings = [];
  let x = 0;
  while (x < width) {
    let buildingWidth = random(50, 100);
    let buildingHeight = random(100, 250);
    let building = {
      x: x,
      w: buildingWidth,
      h: buildingHeight
    };
    buildings.push(building);
    buildingLights[building.x] = [];
    x += buildingWidth;
  }
}

function drawFire() {
  let fireWidth = 40; // Adjust the fire emoji size

  for (let b of buildings) {
    if (!fireLocations[b.x]) {
      fireLocations[b.x] = []; // Initialize if not set
      let numFlames = int(b.w / fireWidth); // Determine the number of flames per building

      for (let i = 0; i < numFlames; i++) {
        let fireX = b.x + random(10, b.w - 10); // Random X within the building
        let fireY = height - b.h - 55; // Fire Y position (constant)
        fireLocations[b.x].push({ x: fireX, y: fireY });
      }
    }

    // Draw stored fire locations (so they don’t change every frame)
    for (let fire of fireLocations[b.x]) {
      let flickerOffsetX = random(-4, 4);
      let flickerOffsetY = random(-4, 4);

      push();
      textSize(40);
      textAlign(CENTER, CENTER);
      noStroke();
      fill(255);
      text("🔥", fire.x + flickerOffsetX, fire.y + flickerOffsetY);
      pop();

      // Smoke Creation at fire position
      if (random() < 0.2) {
        fireParticles.push({
          x: fire.x,
          y: fire.y-9,
          size: random(1, 20),
          alpha: 200,
          speedY: random(0.5, 2),
          spread: random(-1, 1),
        });
      }
    }
  }
}

function drawSmoke() {
  for (let i = fireParticles.length - 1; i >= 0; i--) {
    let p = fireParticles[i];
    
    let drift = noise(p.x * 0.01, frameCount * 0.01) * 2 - 1; 
    
    fill(random(10,50), p.alpha);
    noStroke();
    ellipse(p.x, p.y, p.size);

    p.y -= p.speedY; // Move smoke up
    p.x += drift ;
    p.alpha -= 3; // Fade out

    if (p.alpha <= 0) {
      fireParticles.splice(i, 1); // Remove faded particles
    }
  }
}

function drawCity() {
  drawFire();
  noStroke();
  for (let b of buildings) {
    fill(50);
    stroke(0);
    strokeWeight(1);
    rect(b.x, height - b.h - 50, b.w, b.h);
    drawBuildingLights(b);
  }
  drawSmoke();
  noStroke();
}

function drawBuildingLights(building) {
  let lightSpawnChance = noise((frameCount + noise(building.x) * 500) * 0.008 + building.x) * 1.0;
  if (lightSpawnChance > 0.5 && frameCount % int(map(noise(building.x), 0, 1, 180, 400)) === 0) {
    let numLights = int(map(lightSpawnChance, 0.5, 1.0, 1, 3));
    for (let i = 0; i < numLights; i++) {
      let gridX = building.x + random(10, building.w - 10);
      let gridY = height - building.h - 50 + random(10, building.h - 20);
      let newLight = { x: gridX, y: gridY, timer: frameCount + int(random(200, 450)) };
      let overlapping = buildingLights[building.x].some(light => light.x === newLight.x && light.y === newLight.y);
      if (!overlapping) {
        buildingLights[building.x].push(newLight);
      }
    }
  }
  buildingLights[building.x] = buildingLights[building.x].filter(light => light.timer > frameCount);
  for (let light of buildingLights[building.x]) {
    fill(255, 255, 100);
    noStroke();
    rect(light.x, light.y, 5, 5);
  }
}

function drawFloor() {
  fill(80);
  noStroke();
  rect(0, height - 50, width, 50); // Floor at the bottom
}