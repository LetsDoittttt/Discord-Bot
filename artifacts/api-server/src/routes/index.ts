import { Router, type IRouter } from "express";
import healthRouter from "./health";
import logsRouter from "./logs";
import statsRouter from "./stats";
import configRouter from "./config";
import botRouter from "./bot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(logsRouter);
router.use(statsRouter);
router.use(configRouter);
router.use(botRouter);

export default router;
