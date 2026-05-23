
import express from "express"

const router = express.Router();

router.get('/logs',logsDetails);

export default router;
