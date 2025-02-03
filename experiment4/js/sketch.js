
let video;
let prevFrame;
let w, h;
let gridSize = 4; // Size of pixel blocks
let canvasPixels; // Store static pixel grid

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas =  createCanvas(640, 480);
  canvas.parent("canvas-container");
  pixelDensity(1);
  video = createCapture(VIDEO);
  video.size(width / gridSize, height / gridSize); // Low-res capture for motion detection
  video.hide();
  
  w = width / gridSize;
  h = height / gridSize;
  prevFrame = createImage(w, h);
  
  // Create static black-and-white pixel grid
  canvasPixels = [];
  for (let y = 0; y < height; y += gridSize) {
    let rw = [];
    for (let x = 0; x < width; x += gridSize) {
      rw.push(random() > 0.5 ? 255 : 0); // Random black or white
    }
    canvasPixels.push(rw);
  }
}

function draw() {
  video.loadPixels();
  prevFrame.loadPixels();
  
  loadPixels();
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let index = (x + y * w) * 4;
      
      // Get brightness of current and previous frame pixels
      let currentBrightness = brightness([
        video.pixels[index], 
        video.pixels[index + 1], 
        video.pixels[index + 2]
      ]);
      let prevBrightness = brightness([
        prevFrame.pixels[index], 
        prevFrame.pixels[index + 1], 
        prevFrame.pixels[index + 2]
      ]);

      let diff = abs(currentBrightness - prevBrightness);
      
      let px = x * gridSize;
      let py = y * gridSize;
      
      if (diff > 15) { // If motion detected
        // Scroll the pixel in a random direction
        let offsetX = int(random(-1, 2)) * gridSize;
        let offsetY = int(random(-1, 2)) * gridSize;
        let newX = constrain(x + offsetX / gridSize, 0, w - 1);
        let newY = constrain(y + offsetY / gridSize, 0, h - 1);

        canvasPixels[y][x] = canvasPixels[newY][newX]; // Move only disturbed pixel
      }
      
      // Draw the static or scrolled pixel
      fill(canvasPixels[y][x]);
      noStroke();
      rect(px, py, gridSize, gridSize);
    }
  }

  prevFrame.copy(video, 0, 0, w, h, 0, 0, w, h);
}
