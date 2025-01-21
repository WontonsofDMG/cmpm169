// Constants
const INITIAL_CIRCLE_SIZE = 50;
const INITIAL_ERASE_SPEED = 8;
const INITIAL_SHAKE_AMOUNT = 5;
const INITIAL_RED_INCREMENT_FACTOR = 10;
const RED_THRESHOLD = 255;

// Globals
let canvasContainer;
let circleInstance;

// Circle class to encapsulate circle behavior
class Circle {
  constructor(x, y, size, eraseSpeed, shakeAmount, redIncrementFactor) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.eraseSpeed = eraseSpeed;
    this.shakeAmount = shakeAmount;
    this.redIncrementFactor = redIncrementFactor;
    this.redLevel = 0;
    this.drawingIntensity = 0;
    this.erasing = false;
    this.allErased = false;
  }

  drawCircle() {
    if (!this.erasing) {
      fill(255, 255 - this.redLevel, 255 - this.redLevel);
      stroke(0);
      strokeWeight(1);
      ellipse(this.x, this.y, this.size);

      if (this.redLevel >= RED_THRESHOLD) {
        this.erasing = true;
      }
    }
  }

  handleDrawing(mouseX, mouseY, pmouseX, pmouseY) {
    stroke(0);
    strokeWeight(4);
    line(mouseX, mouseY, pmouseX, pmouseY);

    this.drawingIntensity += dist(mouseX, mouseY, pmouseX, pmouseY);
    this.redLevel = constrain(this.drawingIntensity / this.redIncrementFactor, 0, 255);
  }

  chaseAndErase() {
    loadPixels();
    let closestDist = Infinity;
    let targetX = this.x;
    let targetY = this.y;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let index = (x + y * width) * 4;
        let r = pixels[index];
        let g = pixels[index + 1];
        let b = pixels[index + 2];

        if (r === 0 && g === 0 && b === 0) {
          let d = dist(this.x, this.y, x, y);
          if (d < closestDist) {
            closestDist = d;
            targetX = x;
            targetY = y;
          }
        }
      }
    }

    if (closestDist < Infinity) {
      let angle = atan2(targetY - this.y, targetX - this.x);
      let prevX = this.x;
      let prevY = this.y;

      this.x += cos(angle) * this.eraseSpeed + random(-this.shakeAmount, this.shakeAmount);
      this.y += sin(angle) * this.eraseSpeed + random(-this.shakeAmount, this.shakeAmount);

      noStroke();
      fill(255);
      ellipse(prevX, prevY, this.size);

      fill(255, 0, 0);
      stroke(255);
      strokeWeight(2);
      ellipse(this.x, this.y, this.size);
    } else {
      this.allErased = true;
    }

    if (this.allErased) {
      this.resetAfterErasing();
    }
  }

  resetAfterErasing() {
    this.erasing = false;
    this.allErased = false;

    this.eraseSpeed += 1;
    this.shakeAmount += 2;
    if (this.redIncrementFactor > 1) {
      this.redIncrementFactor -= 1;
    }

    this.drawingIntensity = 0;
    this.redLevel = 0;
    this.x = this.size / 2 + 10;
    this.y = height - this.size / 2 - 10;

    background(255);
  }
}

function resizeScreen() {
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
}

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");

  circleInstance = new Circle(
    INITIAL_CIRCLE_SIZE / 2 + 10,
    height - INITIAL_CIRCLE_SIZE / 2 - 10,
    INITIAL_CIRCLE_SIZE,
    INITIAL_ERASE_SPEED,
    INITIAL_SHAKE_AMOUNT,
    INITIAL_RED_INCREMENT_FACTOR
  );

  $(window).resize(resizeScreen);
  resizeScreen();
}

function draw() {
  background(255);
  circleInstance.drawCircle();
}

function mouseDragged() {
  circleInstance.handleDrawing(mouseX, mouseY, pmouseX, pmouseY);
}