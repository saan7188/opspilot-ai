import { Router, type IRouter } from "express";
import healthRouter from "./health";
import opspilotRouter from "./opspilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(opspilotRouter);

export default router;
