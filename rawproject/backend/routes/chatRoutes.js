import express from "express";

import { chatWithAI, getChatHistory } from "../controllers/chatController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, chatWithAI);
router.get("/history", verifyToken, getChatHistory);

export default router;
