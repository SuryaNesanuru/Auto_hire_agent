// Content Script running inside matching job site tabs
console.log("AutoHire content script injected.");

// Standard layout heuristics selectors
const selectors = {
  title: ["h1", ".job-title", "[class*='title']"],
  company: [".company-name", "[class*='company']", "[class*='employer']"],
  description: [".job-description", "#job-details", "[class*='description']", "article"]
};

function extractTextBySelectors(selectorsList) {
  for (const selector of selectorsList) {
    const el = document.querySelector(selector);
    if (el && el.innerText.trim()) {
      return el.innerText.trim();
    }
  }
  return "";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRIGGER_DOM_SCRAPE") {
    console.log("Analyzing page layout parameters...");
    
    // Attempt standard scraping
    const jobTitle = extractTextBySelectors(selectors.title) || document.title;
    const companyName = extractTextBySelectors(selectors.company) || "Unknown Employer";
    const rawHTML = document.documentElement.outerHTML;

    sendResponse({
      success: true,
      data: {
        job_url: window.location.href,
        job_title: jobTitle,
        company_name: companyName,
        raw_html: rawHTML.substring(0, 100000) // Truncated size guidelines optimization
      }
    });
  }
});
