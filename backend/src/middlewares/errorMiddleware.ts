import { Request, Response, NextFunction } from 'express';

export default (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error);
    return res.status(500).send(error.message);
}