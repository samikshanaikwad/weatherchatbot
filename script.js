// ==== Voiceflow Credentials ====
// These are loaded from the config.js file.
const API_KEY = typeof VOICEFLOW_API_KEY !== 'undefined' ? VOICEFLOW_API_KEY : '';
const VERSION_ID = typeof VOICEFLOW_VERSION_ID !== 'undefined' ? VOICEFLOW_VERSION_ID : '';
// ===============================

const USER_ID = "user_" + Math.random().toString(36).substr(2, 9);

const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMsg(text, who = "bot") {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Helper function to create a delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// New function to stream bot messages word by word
async function streamBotMessage(text) {
  const div = document.createElement("div");
  div.className = "msg bot";
  chat.appendChild(div);

  const words = text.split(" ");
  for (const word of words) {
    div.textContent += word + " ";
    chat.scrollTop = chat.scrollHeight;
    await sleep(120); //  typing speed
  }
  div.textContent = div.textContent.trim(); // Clean up trailing space
}

function toggleTypingIndicator(show) {
  let indicator = document.getElementById("typing-indicator");
  if (show) {
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "typing-indicator";
      indicator.className = "typing-indicator";
      indicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
      chat.appendChild(indicator);
      chat.scrollTop = chat.scrollHeight;
    }
  } else {
    if (indicator) indicator.remove();
  }
}

function addButtons(buttons) {
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  buttons.forEach(buttonData => {
    const button = document.createElement("button");
    button.className = "choice-btn";
    button.textContent = buttonData.name;
    button.onclick = () => handleButtonClick(buttonData, buttonContainer);
    buttonContainer.appendChild(button);
  });

  chat.appendChild(buttonContainer);
  chat.scrollTop = chat.scrollHeight;
}

function handleButtonClick(buttonData, container) {
  // Add the user's choice as a message
  addMsg(buttonData.name, "user");

  // Disable all buttons in this group
  container.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
  });

  // Send the button's request to Voiceflow
  interact(buttonData.request, false); // Don't show indicator for button clicks, it's instant
}

async function handleTraces(traces) {
  for (const trace of traces) {
    if (trace.type === "text") {
      await streamBotMessage(trace.payload.message);
    } else if (trace.type === "choice") {
      addButtons(trace.payload.buttons);
    }
  }
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;
  addMsg(message, "user");
  input.value = "";
  // Reset textarea height after sending
  input.style.height = 'auto';
  sendBtn.disabled = true;

  await interact({ type: "text", payload: message });

  sendBtn.disabled = false;
  input.focus();
}

async function interact(action) {
  toggleTypingIndicator(true);
  try {
    const res = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${USER_ID}/interact`,
      {
        method: "POST",
        headers: {
          Authorization: API_KEY,
          "Content-Type": "application/json",
          versionID: VERSION_ID
        },
        body: JSON.stringify({ action })
      }
    );
    const data = await res.json();
    toggleTypingIndicator(false);
    await handleTraces(data);
  } catch (err) {
    toggleTypingIndicator(false);
    addMsg("Error: " + err.message, "sys");
  }
}

async function startConversation() {
  sendBtn.disabled = true;
  await interact({ type: "launch" });
  sendBtn.disabled = false;
  input.focus();
}

// --- Event Listeners ---
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // Prevent default action (new line)
    sendMessage();
  }
});

// Auto-resize textarea
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = (input.scrollHeight) + 'px';
});

startConversation(); // Start the conversation when the page loads