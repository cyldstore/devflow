import { Router } from "express";
import { getChatStats } from "../db/metrics.js";
import { getVitalsStats } from "../db/vitals.js";

export const statsRouter = Router();

statsRouter.get("/", (req, res) => {
  const days = req.query.days === "30" ? 30 : 7;
  res.json(getChatStats(days));
});

statsRouter.get("/vitals", (req, res) => {
  const days = req.query.days === "30" ? 30 : 7
  res.json(getVitalsStats(days))
})
