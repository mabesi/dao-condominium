import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import "express-async-errors";
import cors from "cors";
import helmet from 'helmet';
import multer from 'multer';
import errorMiddleware from './middlewares/errorMiddleware';
import residentRouter from './routers/residentRouter';
import topicFileRouter from './routers/topicFileRouter';
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

// Upload Middleware
const uploadMiddleware = multer({ dest: "files"});
app.use("/topicfiles/", authenticationMiddleware, uploadMiddleware.single("file"), topicFileRouter);

app.use("/", (req: Request, res: Response, next: NextFunction) => {
    res.send("Health Check");
});    

// Middlewares
app.use(errorMiddleware);

// Export app
export default app;