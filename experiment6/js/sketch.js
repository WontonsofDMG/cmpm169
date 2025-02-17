EndGame=false;

function setup() {
    // place our canvas, making it fit our container
    canvasContainer = $("#canvas-container");
    let canvas = createCanvas(600, 400);
    canvas.parent("canvas-container");
    // resize canvas is the page is resized
  extractCarFrames();

  for (let i = 0; i < 1; i++) {
    npcCars.push(new NpcCar());
  }

  for (let i = 0; i < 6; i++) {
    lightPoles.push(new LightPole(i));
  }

  car = new Car();
  dash = new Dash();
  //phone
   userInput = createInput(" ").attribute("placeholder", "Type a message...");
    sendButton = createButton("Send");
    sendButton.mousePressed(sendMessage);
    chatLog = [];
    messageTypes = [];
    selectedRole = random(Object.keys(roles));
    phoneNumber = generatePhoneNumber();
    scrollOffset = 0;
    startConversation();
}

function draw() {
  if (EndGame===false){
  background(50, 180, 50);
  drawScene();
  

  lightPoleSwitchCounter++;
  if (lightPoleSwitchCounter >= lightPoleSwitchThreshold) {
    switchPoles = !switchPoles; // Flip pole positions
    lightPoleSwitchCounter = 0;
  }

  for (let pole of lightPoles) {
    pole.update();
    pole.display();
  }
  
  spawnCounter++;
  if (spawnCounter >= spawnInterval && npcCars.length < maxCars) {
    let usedLanes = new Set(); // Track lanes used in this frame
    let carsToSpawn = min(maxCars - npcCars.length, 2); // Spawn 1 or 2 cars if needed

    for (let i = 0; i < carsToSpawn; i++) {
      let newCar = new NpcCar(npcCars, usedLanes);
      if (newCar.y !== -1) {
        npcCars.push(newCar);
        usedLanes.add(newCar.lane); // Mark lane as used
      }
    }

    spawnCounter = 0; // Reset counter
  }

  for (let npc of npcCars) {
    npc.update();
    npc.display();
    if (checkCollision(car, npc)===true) {
    console.log("Collision detected!");
      EndGame=true;
  }
  }
   // Remove cars that move off-screen
  npcCars = npcCars.filter(npc => npc.y < height-195);
  car.update();
  car.display();
  dash.update();
  dash.display();
  
  //phone body
  fill(110,110,110);
  rect(300, height / 2.2,280, height,20);
  fill(30,30,30);
  rect(310, height / 2.1,260, height,20);
  // Speaker and Camera
    fill(50);
    rect(400, height / 2.1 + 10, 80, 10, 10);
    fill(0);
    ellipse(480, height / 2.1 + 15, 6, 6);
    
    // Contact Info
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text(selectedRole + " (" + phoneNumber + ")", 440, height / 2.1 + 40);
    
    // Chat Box
    fill(255);
    stroke(0);
    rect(320, height / 2.1 + 60, 240, height - 200, 10);
    
    let chatStartY = height / 2.1 + 70;
    let chatEndY = height - 220;
    let maxWidth = 160;
    let y = chatEndY - scrollOffset;
    
    for (let i = max(0, chatLog.length - 15); i < chatLog.length; i++) {
        let msg = chatLog[i];
        let isUser = messageTypes[i] === "user";
        let bubbleX = isUser ? 400 : 340;
        let bubbleColor = isUser ? color(0, 122, 255) : color(230);
        let textColor = isUser ? color(255) : color(0);
        let lines = splitText(msg, maxWidth-10);
        let bubbleHeight = lines.length * 20 + 10;
        
        y -= bubbleHeight + 10;
        if (y < chatStartY) break;
        
        fill(bubbleColor);
        noStroke();
        rect(bubbleX, y, maxWidth-10, bubbleHeight, 10);
        
        fill(textColor);
        textAlign(LEFT);
        let lineY = y + 20;
        for (let line of lines) {
            text(line, bubbleX + 10, lineY);
            lineY += 20;
        }
    }
    
    // Adjust scroll when chat exceeds box size
    if (y < chatStartY) {
        scrollOffset -= 10;
    }
    
    // Input and Send Button
    userInput.position(330, 600 - 40);
    userInput.size(160, 30);
    sendButton.position(500, 600 - 25);
}else
  {
  //after the crash end game screen
    userInput.hide();
    sendButton.hide();
  background(0, 0, 0);
    imageMode(CENTER);
    image(carFrames[8], 300, 100, 150, 80);
    // Display messages
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
    
  text("Last message:", 300, 200);
  text("Them: " + lastbot, 300, 230);
  text("You: " + lastmessage, 300, 260);
  text("Total Sent: " + totalmessages, 300, 290);
    
  }
}