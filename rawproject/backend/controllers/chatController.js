import { askAI } from "../services/aiService.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import jwt from 'jsonwebtoken';

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    let user = null;

    // Check for authentication
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        user = await User.findById(decoded.id);
      } catch (err) {
        console.error("Token verification failed in chat controller:", err);
      }
    }

    // If user is logged in, check and decrement freeQuestions
    if (user) {
      if (user.freeQuestions <= 0) {
        return res.status(403).json({
          message: "You have used up all your free questions. Please upgrade to a premium plan.",
          limitReached: true
        });
      }
      user.freeQuestions -= 1;
      user.totalQuestions += 1;
      await user.save();
    }

    // Call AI Service
    const data = await askAI(message);

    // Save history if user is logged in
    if (user) {
      const newChat = new Chat({
        userId: user._id,
        question: message,
        answer: data.reply,
        confidence: data.confidence !== undefined ? data.confidence + "%" : null
      });
      await newChat.save();
    }

    res.json({
      ...data,
      freeQuestionsLeft: user ? user.freeQuestions : null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `AI Error: ${error.message}`,
      error: error.message
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    const history = await Chat.find({ userId: decoded.id }).sort({ timestamp: -1 });
    
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};

export { chatWithAI, getChatHistory };