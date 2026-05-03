import axios from "axios";

const askAI = async (message) => {
  let AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/chat";
  
  // Auto-fix URL if /chat is missing
  if (AI_URL.startsWith("http") && !AI_URL.endsWith("/chat")) {
    AI_URL = AI_URL.replace(/\/$/, "") + "/chat";
  }

  console.log("Connecting to AI at:", AI_URL);
  
  try {
    const response = await axios.post(
      AI_URL,
      { message },
      { timeout: 60000 } // Add timeout for Render cold starts (increased to 60s)
    );
    return response.data;
  } catch (error) {
    console.error("AI Service Error:", error.message);
    if (error.code === 'ECONNABORTED') {
        throw new Error("AI Service timed out. It might be waking up, please try again in 30 seconds.");
    }
    throw new Error(`AI Connection Failed: ${error.message}`);
  }
};

export { askAI };