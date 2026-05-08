import express from "express";

const app = express.Router();

app.get('/stats',statsDetails);

export default app;