import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import "express-async-errors";
import cors from "cors";
import helmet from 'helmet';
import errorMiddleware from './middlewares/errorMiddleware';
import residentRouter from './routers/residentRouter';
import authController from './controllers/authController';
import authenticationMiddleware from './middlewares/authenticationMiddleware';

const app = express();

// Config app extensions
app.use(morgan("tiny"));
app.use(helmet());
app.use(cors({origin: process.env.CORS_ORIGIN}));
app.use(express.json());

// Routes
app.use("/login/", authController.doLogin);
app.use("/residents/", authenticationMiddleware, residentRouter);

app.use("/", (req: Request, res: Response, next: NextFunction) => {
    res.send("Health Check");
});

// Middlewares
app.use(errorMiddleware);

// Export app
export default app;