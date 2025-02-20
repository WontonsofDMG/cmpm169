
let userInput, sendButton, chatLog, selectedRole, phoneNumber, scrollOffset, messageTypes;
let totalmessages=0;
let lastmessage="Unsent",lastbot;

const roles = {
    "Mom": "You are a caring mom. You need something important and need an answer now. Keep texts short and urgent. Respond directly to the user's message.",
    "Dad": "You are a direct, concerned dad. You need help from user to help move something heavy in your home. Keep texts short. Respond directly to the user's message.",
    "Girlfriend": "You are an emotional girlfriend. You're upset and need closure. Keep texts short and emotional. Respond directly to the user's message.",
    "Boyfriend": "You are a frustrated boyfriend. You want to clear things up quickly because your friends keep telling you that user is going to break up with you. Keep texts brief. Respond directly to the user's message."
};

const initialMessages = {
    "Mom": "Can you pick up groceries? I really need them today.",
    "Dad": "I need your help moving something. Can you come by?",
    "Girlfriend": "I can't do this anymore.",
    "Boyfriend": "Are we even okay?"
};

function splitText(txt, maxWidth) {
    let words = txt.split(" ");
    let lines = [];
    let currentLine = "";
    for (let word of words) {
        if (textWidth(currentLine + " " + word) > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine += (currentLine.length > 0 ? " " : "") + word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function startConversation() {
    chatLog.push(initialMessages[selectedRole]);
    lastbot=initialMessages[selectedRole];
    messageTypes.push("bot");
    textSound.play();
}

function generatePhoneNumber() {
    return "+1 " + int(random(100, 999)) + "-" + int(random(100, 999)) + "-" + int(random(1000, 9999));
}

async function sendMessage() {
    let message = userInput.value();
    if (message.trim() === "") return;
    lastmessage=message;
    totalmessages++;
    chatLog.push(message);
    messageTypes.push("user");
    userInput.value("");
    
    let systemMessage = roles[selectedRole] + "Always keep user texting back. Your initial message was: " + initialMessages[selectedRole];
    
    try {
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${{ secrets.API_KEY }}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { "text": systemMessage },
                        { "text": "User: " + message }
                    ]
                }]
            })
        });
        
        let jsonResponse = await response.json();
        console.log("API Response:", jsonResponse);
        console.log(lastmessage + " " + lastbot + " message count:" + totalmessages);
        
        if (jsonResponse.error) {
            console.error("API Error:", jsonResponse.error);
            chatLog.push("(Error: could not send your message)");
            textSound.play();
            messageTypes.push("bot");
            return;
        }
        
        if (jsonResponse.candidates && jsonResponse.candidates.length > 0) {
            let botReply = jsonResponse.candidates[0].content.parts[0].text;
            lastbot=botReply;
            chatLog.push(botReply);
            textSound.play();
            messageTypes.push("bot");
        } else {
            chatLog.push("(Error: phone lost connection)");
            textSound.play();
            messageTypes.push("bot");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        chatLog.push("(Error: phone lost their message)");
        textSound.play();
        messageTypes.push("bot");
    }
}
