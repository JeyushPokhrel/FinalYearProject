import axios from "axios";

const askAI = async (message) => {

  const response = await axios.post(
    "http://127.0.0.1:8000/chat",
    {
      message,
    }
  );

  return response.data;
};

export { askAI };