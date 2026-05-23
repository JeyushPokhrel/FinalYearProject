import axios from "axios";

// ─── Base URLs ────────────────────────────────────────────────────────────────

const CLEAN_BASE_URL = (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000")
  .replace(/\/$/, "")
  .replace(/\/chat$/, "");

const AI_CHAT_URL   = `${CLEAN_BASE_URL}/chat`;
const AI_HEALTH_URL = `${CLEAN_BASE_URL}/health`;


// ─── Ask AI (with retry on 502 / 503) ────────────────────────────────────────

const askAI = async (message, retries = 2) => {
  console.log("Connecting to AI:", AI_CHAT_URL);

  try {
    const response = await axios.post(
      AI_CHAT_URL,
      { message },
      {
        timeout: 60000,
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;

  } catch (error) {
    const status = error.response?.status;

    console.error("AI Service Error:", {
      message: error.message,
      status,
      data: error.response?.data,
    });

    // 502 / 503 → service is waking up on Render; wait then retry
    if ((status === 502 || status === 503) && retries > 0) {
      console.log(
        `AI service returned ${status}. Waiting 15 s before retry ` +
        `(${retries} attempt${retries > 1 ? "s" : ""} left)…`
      );
      await new Promise((res) => setTimeout(res, 15000));
      return askAI(message, retries - 1);
    }

    if (status === 404) {
      throw new Error("AI endpoint not found. Verify the /chat route exists on the FastAPI server.");
    }

    if (status === 502) {
      // Retries exhausted
      throw new Error("Please try again in a minute.");
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("AI Service timed out. The server may be waking up — try again in a minute.");
    }

    throw new Error(`AI Connection Failed: ${error.message}`);
  }
};


// ─── Keep-alive ping (prevents Render free-tier cold starts) ─────────────────

const ping = async () => {
  try {
    const res = await axios.get(AI_HEALTH_URL, { timeout: 10000 });
    console.log("[keep-alive] AI ping OK:", res.status);
  } catch (err) {
    console.warn("[keep-alive] AI ping failed:", err.message);
  }
};

ping();                                  // immediate ping on startup
setInterval(ping, 10 * 60 * 1000);      // then every 10 minutes


// ─── Exports ──────────────────────────────────────────────────────────────────

export { askAI };
