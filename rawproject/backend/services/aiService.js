import axios from "axios";

const askAI = async (message) => {
  const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/chat";
  
  try {
    const response = await axios.post(
      AI_URL,
      { message }
    );
    return response.data;
  } catch (error) {
    console.error("AI Service Error:", error.message);
    throw new Error("Could not connect to AI service. Please try again later.");
  }
};

export { askAI };