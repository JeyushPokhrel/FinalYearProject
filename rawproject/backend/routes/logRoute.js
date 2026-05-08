
import express from "express"

const app = express.Router();

app.get('/logs',logsDetails);

export default app;
