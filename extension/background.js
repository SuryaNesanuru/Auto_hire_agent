// Background service worker for AutoHire AI Chrome Extension
console.log("AutoHire background worker online.");

// Listen for messages from Content Scripts or Popup UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
  
  if (message.type === "SCRAPE_JOB_ACTION") {
    // Forward scrape execution directly to target tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "TRIGGER_DOM_SCRAPE" }, (response) => {
          sendResponse(response);
        });
      } else {
        sendResponse({ success: false, error: "No active query tab found." });
      }
    });
    return true; // Keep response channel open async
  }

  if (message.type === "SEND_TO_BACKEND") {
    // Route page content scripting parameters to the local FastAPI port
    fetch("http://localhost:8000/api/v1/jobs/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload)
    })
    .then(res => {
      if (!res.ok) throw new Error("Backend connection returned status error: " + res.status);
      return res.json();
    })
    .then(data => {
      sendResponse({ success: true, data });
    })
    .catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep responder open asynchronously
  }
});
