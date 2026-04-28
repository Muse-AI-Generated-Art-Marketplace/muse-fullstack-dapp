import { Router, Request, Response } from "express";

const router = Router();

interface ErrorLogBody {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  userAgent?: string;
  url?: string;
  timestamp?: string;
}

router.post("/", async (req: Request<{}, {}, ErrorLogBody>, res: Response) => {
  const log = req.body;

  console.error("🚨 Frontend Error:", log);

  // TODO: persist to DB
  // await prisma.errorLog.create({ data: log });

  res.status(200).json({ success: true });
});

router.get("/", async (_req: Request, res: Response) => {
  res.json({ logs: [] });
});

export default router;
