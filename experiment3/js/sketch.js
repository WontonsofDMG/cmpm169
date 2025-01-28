
let MARGIN = 64;
let CITY_SIZE = 400;
let CITY_NAME = '';

let MAJOR_ROAD_CHANCE = 0.99;
let REGULAR_ROAD_FROM_MAJOR_CHANCE = 0.9;
let REGULAR_ROAD_FROM_REGULAR_ROAD_CHANCE = 0.98;
let SMALL_ROAD_FROM_REGULAR_ROAD_CHANCE = 0.95;
let SMALL_ROAD_FROM_SMALL_ROAD_CHANCE = 0.995;

let BUILDING_GROW_SPEED = 0.4;
let BUILDING_FROM_MAJOR_ROAD_CHANCE = 0.8;
let BUILDING_FROM_REGULAR_ROAD_CHANCE = 0.9;
let BUILDING_FROM_SMALL_ROAD_CHANCE = 0.995;

let PERSPECTIVE_SHIFT = 0.55;
let BUILDING_SIZE = 4;
let BUILDING_VARIATION = 0.5;

let planes = [];
let roads = [];
let buildings = [];
let explosions = [];
let mapBuilt = false;
let citySnapshot;

class Building {
  constructor(position, h, angle) {
    this.position = position.copy();
    this.height = h;
    this.currentHeight = 1;
    this.angle = angle + PI / 4;
    this.size =
      (BUILDING_SIZE + random(BUILDING_VARIATION)) *
      map(this.position.y, 0, height, 0.95, 1.1);
  }

  update() {
    if (this.currentHeight < this.height) {
      this.currentHeight += BUILDING_GROW_SPEED;
    }
  }

  draw() {
    stroke(20);
    strokeWeight(0.4);
    fill(215);

    beginShape();
    for (let i = 0; i < TAU; i += PI / 2) {
      vertex(
        this.position.x + cos(this.angle + i) * this.size,
        this.position.y -
          this.currentHeight +
          sin(this.angle + i) * this.size * PERSPECTIVE_SHIFT
      );
    }
    endShape(CLOSE);
  }
}

class Road {
  constructor(level, position, angle) {
    this.level = level;
    this.position = position.copy();
    this.oldPosition = position.copy();
    this.angle = angle;
    this.building = true;
    this.done = false;
  }

  update() {
    if (!this.building) return;

    this.oldPosition = this.position.copy();
    this.position.add(
      cos(this.angle) * this.level,
      sin(this.angle) * this.level * PERSPECTIVE_SHIFT
    );

    if (red(get(this.position.x, this.position.y)) == 230) {
      this.done = true;
    }

    if (
      this.position.x > width - MARGIN ||
      this.position.y > height - MARGIN ||
      this.position.x < MARGIN ||
      this.position.y < MARGIN
    ) {
      this.done = true;
    }

    if (random() > 0.99) {
      this.angle += random([-PI / 4, -PI / 8, PI / 8, PI / 4]);
    }

    let randomAngle = this.angle + random([PI / 2, -PI / 2]);
    let pos = createVector(this.level / 1.5, 0)
      .rotate(randomAngle)
      .add(this.position);

    let roadAdded = false;
    if (random() > MAJOR_ROAD_CHANCE && this.level == 5) {
      roads.push(new Road(this.level, pos, randomAngle + random(-0.01, 0.01)));
      roadAdded = true;
    } else if (random() > REGULAR_ROAD_FROM_MAJOR_CHANCE && this.level == 5) {
      roads.push(new Road(this.level - 2, pos, randomAngle + random(-0.01, 0.01)));
      roadAdded = true;
    } else if (random() > SMALL_ROAD_FROM_REGULAR_ROAD_CHANCE && this.level == 3) {
      roads.push(new Road(this.level - 2, pos, randomAngle));
      roadAdded = true;
    } else if (random() > REGULAR_ROAD_FROM_REGULAR_ROAD_CHANCE && this.level == 3) {
      roads.push(new Road(this.level, pos, randomAngle));
      roadAdded = true;
    } else if (random() > SMALL_ROAD_FROM_SMALL_ROAD_CHANCE && this.level == 1) {
      roads.push(new Road(this.level, pos, randomAngle));
      roadAdded = true;
    }

    if (!roadAdded) {
      pos.mult(1.03);
      if (red(get(pos.x, pos.y)) >= 220) return;

      if (random() > BUILDING_FROM_MAJOR_ROAD_CHANCE && this.level == 5) {
        buildings.push(new Building(pos, random(15, 40), this.angle));
      } else if (random() > BUILDING_FROM_REGULAR_ROAD_CHANCE && this.level == 3) {
        buildings.push(new Building(pos, random(15, 20), this.angle));
      } else if (random() > BUILDING_FROM_SMALL_ROAD_CHANCE && this.level == 1) {
        buildings.push(new Building(pos, random(5, 15), this.angle));
      }
    }
  }

  draw() {
    if (!this.building) return;
    strokeWeight(this.level);
    stroke(map(this.level, 1, 5, 230, 230));
    line(this.oldPosition.x, this.oldPosition.y, this.position.x, this.position.y);
    if (this.done) this.building = false;
  }
}

class Plane {
  constructor() {
    this.spawnOffEdge();
    this.speed = random(2, 4);
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000);
  }

  spawnOffEdge() {
    const edge = floor(random(4));
    if (edge === 0) {
      this.position = createVector(random(0, width), -MARGIN);
      this.angle = random(PI / 4, (3 * PI) / 4);
    } else if (edge === 1) {
      this.position = createVector(width + MARGIN, random(0, height));
      this.angle = random((3 * PI) / 4, (5 * PI) / 4);
    } else if (edge === 2) {
      this.position = createVector(random(0, width), height + MARGIN);
      this.angle = random((5 * PI) / 4, (7 * PI) / 4);
    } else {
      this.position = createVector(-MARGIN, random(0, height));
      this.angle = random(-PI / 4, PI / 4);
    }
  }

  update() {
    let angleX = map(noise(this.noiseOffsetX), 0, 1, -PI / 16, PI / 16);
    let angleY = map(noise(this.noiseOffsetY), 0, 1, -PI / 16, PI / 16);

    this.position.x += cos(this.angle + angleX) * this.speed;
    this.position.y += sin(this.angle + angleY) * this.speed;

    this.angle += angleX * 0.1;

    this.noiseOffsetX += 0.01;
    this.noiseOffsetY += 0.01;

    if (
      this.position.x < -MARGIN ||
      this.position.x > width + MARGIN ||
      this.position.y < -MARGIN ||
      this.position.y > height + MARGIN
    ) {
      this.reset();
    }
  }

  draw() {
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle + 0.8);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('✈️', 0, 0);
    pop();
  }

  reset() {
    this.spawnOffEdge();
    this.speed = random(2, 4);
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000);
  }

  isColliding(other) {
    return dist(this.position.x, this.position.y, other.position.x, other.position.y) < 20;
  }
}

class Explosion {
  constructor(position) {
    this.position = position.copy();
    this.timeLeft = 30; // Frames to display the explosion
  }

  update() {
    this.timeLeft--;
  }

  draw() {
    push();
    translate(this.position.x, this.position.y);
    textSize(48);
    textAlign(CENTER, CENTER);
    text('💥', 0, 0);
    pop();
  }

  isFinished() {
    return this.timeLeft <= 0;
  }
}

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(CITY_SIZE + MARGIN * 2, CITY_SIZE + MARGIN * 2);
  canvas.parent("canvas-container");

  roads = [];
  buildings = [];
  planes = Array.from({ length: 5 }, () => new Plane());
  explosions = [];

  for (let n = 0; n < floor(random(1, 1)); n++) {
    let p = createVector(random(MARGIN, width - MARGIN), random(MARGIN, height - MARGIN));
    for (let i = 0; i < ceil(random(1, 5)); i++) {
      roads.push(new Road(5, p, random(TWO_PI)));
    }
  }
  background(20);
  stroke(230);
}

function draw() {
  if (!mapBuilt) {
    roads.forEach((road) => {
      road.draw();
      road.update();
    });
    buildings.sort((a, b) => a.position.y - b.position.y);
    buildings.forEach((building) => {
      building.draw();
      building.update();
    });

    if (!roads.some((road) => road.building)) {
      mapBuilt = true;
      citySnapshot = get();
    }
  } else {
    image(citySnapshot, 0, 0);

    // Update planes and handle collisions
    for (let i = 0; i < planes.length; i++) {
      for (let j = i + 1; j < planes.length; j++) {
        if (planes[i].isColliding(planes[j])) {
          explosions.push(new Explosion(planes[i].position));
          planes[i].reset();
          planes[j].reset();
        }
      }
    }

    planes.forEach((plane) => {
      plane.update();
      plane.draw();
    });

    // Update and draw explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].update();
      explosions[i].draw();
      if (explosions[i].isFinished()) {
        explosions.splice(i, 1);
      }
    }
  }

  noStroke();
  fill(220);
}
