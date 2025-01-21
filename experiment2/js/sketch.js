let circleX, circleY, circleSize;
let redLevel = 0;
let threshold = 255; // Max red value before the circle starts erasing
let drawingIntensity = 0; // Tracks how much the user has drawn
let erasing = false; // Indicates if the circle is erasing
let allErased = false; // Tracks if everything has been erased
let eraseSpeed = 8; // Initial speed of the erasing circle
let shakeAmount = 5; // Initial amount of shaking while erasing
let redIncrementFactor = 10; // Initial rate at which the circle turns red

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(800, 600);
  canvas.parent("canvas-container");
  background(255);

  circleSize = 50;
  circleX = circleSize / 2 + 10;
  circleY = height - circleSize / 2 - 10;
}

function draw() {
  if (!erasing) {
    // Draw the circle at the bottom left
    fill(255, 255 - redLevel, 255 - redLevel); // Slowly turns red
    stroke(0); // Black outline
    strokeWeight(1);
    ellipse(circleX, circleY, circleSize);

    // Check if the threshold is hit
    if (redLevel >= threshold) {
      erasing = true;
    }
  } else {
    chaseAndErase(); // Handle erasing behavior
  }
}

function mouseDragged() {
  // Drawing functionality
  stroke(0);
  strokeWeight(4);
  line(mouseX, mouseY, pmouseX, pmouseY);

  // Increase red level as the user draws
  drawingIntensity += dist(mouseX, mouseY, pmouseX, pmouseY);
  redLevel = constrain(drawingIntensity / redIncrementFactor, 0, 255);
}

function chaseAndErase() {
  loadPixels();
  let closestDist = Infinity;
  let targetX = circleX;
  let targetY = circleY;

  // Find the nearest black pixel
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let index = (x + y * width) * 4; // Get pixel index
      let r = pixels[index];
      let g = pixels[index + 1];
      let b = pixels[index + 2];

      if (r === 0 && g === 0 && b === 0) { // Check for black pixel
        let d = dist(circleX, circleY, x, y);
        if (d < closestDist) {
          closestDist = d;
          targetX = x;
          targetY = y;
        }
      }
    }
  }

  // Move towards the target black pixel
  if (closestDist < Infinity) {
    let angle = atan2(targetY - circleY, targetX - circleX);
    let prevX = circleX;
    let prevY = circleY;

    circleX += cos(angle) * eraseSpeed + random(-shakeAmount, shakeAmount);
    circleY += sin(angle) * eraseSpeed + random(-shakeAmount, shakeAmount);

    // Draw a white circle without outline at the previous position
    noStroke(); // Ensure no outline
    fill(255); // White to erase
    ellipse(prevX, prevY, circleSize);

    // Draw the red circle with a black outline at the new position
    fill(255, 0, 0); // Red fill
    stroke(255); // Black outline
    strokeWeight(2);
    ellipse(circleX, circleY, circleSize);
  } else {
    allErased = true; // If no black pixels are found, assume all is erased
  }

  if (allErased) {
    resetAfterErasing();
  }
}

function resetAfterErasing() {
  // Reset the state after erasing is complete
  erasing = false;
  allErased = false;

  // Increase attributes
  eraseSpeed += 1; // Increase speed
  shakeAmount += 2; // Increase shake intensity
  if (redIncrementFactor>1){
  redIncrementFactor -= 1; // Turn red faster (decrease increment factor)
  }
  // Reset states
  drawingIntensity = 0;
  redLevel = 0;
  circleX = circleSize / 2 + 10;
  circleY = height - circleSize / 2 - 10;

  background(255); // Fully clear the canvas
}



function resetAfterErasing() {
  // Reset the state after erasing is complete
  erasing = false;
  allErased = false;

  // Increase attributes
  eraseSpeed += 1; // Increase speed
  shakeAmount += 2; // Increase shake intensity
  if (redIncrementFactor > 1) {
    redIncrementFactor -= 1; // Turn red faster (decrease increment factor)
  }
  // Reset states
  drawingIntensity = 0;
  redLevel = 0;
  circleX = circleSize / 2 + 10;
  circleY = height - circleSize / 2 - 10;

  background(255); // Fully clear the canvas
}

function resizeScreen() {
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
}