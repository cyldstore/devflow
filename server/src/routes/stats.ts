import { Router } from "express";
import { getChatStats } from "../db/metrics.js";

export const statsRouter = Router();

statsRouter.get("/", (req, res) => {
  const days = req.query.days === "30" ? 30 : 7;
  res.json(getChatStats(days));
});
