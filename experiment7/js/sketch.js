let mic, amp;
let wave = [];
let numPoints = 150; // Number of points in the wave array
let baseline;
let boatXIndex;      // Fixed index along the wave for the boat

// Global boat variable (change this to use a different boat emoji)
let boatEmoji = "⛴";

// Boat physics variables
let boatY;       // Boat’s vertical position (simulated)
let boatVy = 0;  // Boat’s vertical velocity
let boatPrevY;   // Previous frame’s boatY for landing detection

// Physics parameters
let g_air = 0.005;       // Gravity when boat is above the target (hang time)
let g_water = 0.6;       // Gravity when boat is below the target (faster fall)
let k = 0.07;            // Spring constant pulling the boat toward the target
let damping = 0.80;      // Damping factor for smooth motion

// How high the boat normally floats above the wave surface
let boatFloatOffset = 10;

// Sinking mode parameters:
// If the boat falls more than sinkingThreshold pixels below its target for sinkingTimerThreshold frames,
// then the boat stops following the wave and begins sinking.
let sinkingThreshold = 20;        // Pixels below target that trigger sinking mode
let sinkingTimerThreshold = 10;     // Number of consecutive frames
let underwaterTimer = 0;
let boatSinking = false;            // Whether the boat is in sinking mode

// For bubbles during sinking
let bubbles = [];

// Slider to adjust mic sensitivity
let sensitivitySlider;

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas =  createCanvas(800, 400);
  canvas.parent("canvas-container");
  background(0);
  
  // Initialize the wave array with zeros.
  for (let i = 0; i < numPoints; i++) {
    wave.push(0);
  }
  
  // Set the baseline roughly in the middle.
  baseline = height / 1.5;
  boatXIndex = floor(numPoints / 2);
  
  // Set up microphone input and amplitude analyzer.
  mic = new p5.AudioIn();
  amp = new p5.Amplitude();
  
  // Suspend audio context until user interaction.
  getAudioContext().suspend();
  textAlign(CENTER, CENTER);
  textSize(18);
  fill(255);
  text("Click to start the mic", width/2, height/2);
  
  // Create a slider to adjust sensitivity (0 = no mic effect, 5 = high sensitivity)
  sensitivitySlider = createSlider(0.5, 5, 1.5, 0.1);
  sensitivitySlider.position(10, height + 10);
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
    mic.start(() => {
      amp.setInput(mic);
      console.log("Mic started");
    }, (err) => console.error("Mic error:", err));
  }
}

function draw() {
  background(0);
  
  // Get sensitivity from the slider.
  let sensitivity = sensitivitySlider.value();
  
  // Get current microphone level.
  let level = amp.getLevel();
  // Map the mic level (assumed roughly 0–0.3) to a displacement range.
  let micVal = map(level, 0, 0.3, -50, 50);
  
  // Create a base sine wave (amplitude 40) so the ocean isn't flat in silence.
  // (This wave is allowed to have large variations.)
  let baseWaveVal = sin(frameCount * 0.1) * 40;
  
  // Combine the base wave with mic input (scaled by sensitivity).
  let newVal = baseWaveVal + micVal * sensitivity;
  
  // Shift the wave array to simulate travel.
  wave.pop();
  wave.unshift(newVal);
  
  // Optionally smooth the wave for a natural appearance.
  for (let i = 1; i < wave.length - 1; i++) {
    wave[i] = (wave[i - 1] + wave[i] + wave[i + 1]) / 3;
  }
  
  // Draw the wave as a continuous line.
  stroke(0, 255, 255);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i < wave.length; i++) {
    let x = map(i, 0, wave.length - 1, 0, width);
    let y = baseline + wave[i];
    vertex(x, y);
  }
  endShape();
  
  // Determine the boat's horizontal position.
  let boatX = map(boatXIndex, 0, wave.length - 1, 0, width);
  // The target boat Y (where it should ideally float) is the wave surface raised by boatFloatOffset.
  let targetBoatY = baseline + wave[boatXIndex] - boatFloatOffset;
  
  // Initialize boatY if needed.
  if (boatY === undefined) {
    boatY = targetBoatY;
  }
  
  // Save previous boatY.
  boatPrevY = boatY;
  
  if (!boatSinking) {
    // Choose gravity based on whether the boat is above or below its target.
    let effectiveGravity = (boatY < targetBoatY) ? g_air : g_water;
    // Apply a spring force to pull the boat toward the target.
    let springForce = (targetBoatY - boatY) * k;
    let acceleration = effectiveGravity + springForce;
    
    // Update boat velocity and position.
    boatVy = (boatVy + acceleration) * damping;
    boatY += boatVy;
    
    // If the boat falls too far below the target, increment a timer.
    if (boatY - targetBoatY > sinkingThreshold) {
      underwaterTimer++;
      if (underwaterTimer > sinkingTimerThreshold) {
        boatSinking = true;
        // Reset the timer when sinking begins.
        underwaterTimer = 0;
      }
    } else {
      underwaterTimer = max(0, underwaterTimer - 1);
    }
  } else {
    // In sinking mode: disable spring force; apply only strong gravity.
    boatVy = (boatVy + g_water) * damping;
    boatY += boatVy;
    // Spawn bubbles as the boat sinks.
    if (frameCount % 3 === 0) {
      bubbles.push(new Bubble(boatX, boatY));
    }
  }
  
  // Estimate the local wave tilt using neighboring points for drawing the boat's rotation.
  let leftVal = boatXIndex > 0 ? wave[boatXIndex - 1] : wave[boatXIndex];
  let rightVal = boatXIndex < wave.length - 1 ? wave[boatXIndex + 1] : wave[boatXIndex];
  let leftX = map(boatXIndex - 1, 0, wave.length - 1, 0, width);
  let rightX = map(boatXIndex + 1, 0, wave.length - 1, 0, width);
  let leftY = baseline + leftVal;
  let rightY = baseline + rightVal;
  let angle = atan((rightY - leftY) / (rightX - leftX));
  
  // Draw the boat.
  push();
  translate(boatX, boatY);
  if (boatSinking) {
    rotate(PI); // Flip the boat upside down when sinking
  } else {
    rotate(angle); // Normal wave tilt rotation
  }
  textAlign(CENTER, CENTER);
  textSize(48);
  text(boatEmoji, 0, 0);
  pop();
  
  // Update and display bubbles.
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].isDead()) {
      bubbles.splice(i, 1);
    }
  }
  
  // Respawn the boat if it sinks too far below the canvas.
  if (boatY > height + 50) {
    boatSinking = false;
    boatVy = 0;
    boatY = targetBoatY;
  }
  
  // Optionally display debug info.
  noStroke();
  fill(255);
  textSize(12);
  text("Sensitivity: " + sensitivity, width - 80, height - 20);
  text("diff: " + nf(boatY - targetBoatY, 1, 2), width - 80, height - 40);
}

// Bubble class for sinking mode.
class Bubble {
  constructor(x, y) {
    this.x = x + random(-10, 10);
    this.y = y;
    this.size = random(5, 15);
    this.alpha = 255;
    this.vy = random(-1, -3); // bubbles rise upward
  }
  
  update() {
    // Calculate the wave's y position at this bubble's x coordinate.
    let index = map(this.x, 0, width, 0, wave.length - 1);
    let i0 = floor(index);
    let i1 = ceil(index);
    // Constrain indices to ensure they're within the wave array bounds.
    i0 = constrain(i0, 0, wave.length - 1);
    i1 = constrain(i1, 0, wave.length - 1);
    // Linear interpolation to estimate the wave's y at this.x.
    let waveY = baseline + lerp(wave[i0], wave[i1], index - i0);
    
    // Update the bubble's y, but clamp so it never rises above the wave.
    let newY = this.y + this.vy;
    if (newY < waveY) {
      newY = waveY;
    }
    this.y = newY;
    
    // Fade out the bubble.
    this.alpha -= 2;
  }
  
  isDead() {
    return this.alpha <= 0;
  }
  
  display() {
    noStroke();
    fill(173, 216, 230, this.alpha); // light blue
    ellipse(this.x, this.y, this.size);
  }
}
