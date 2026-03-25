import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Artwork API active" });
});

export default router;
