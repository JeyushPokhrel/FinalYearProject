import express from "express";

import { chatWithAI, getChatHistory } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", chatWithAI);
router.get("/history", getChatHistory);

export default router;
