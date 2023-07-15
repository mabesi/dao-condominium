import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = `${process.env.JWT_SECRET}`;

export default (error: Error, req: Request, res: Response, next: NextFunction) => {
    
    const token = req.headers['authorization'];

    if (token) {
        
        try {

            const decoded = jwt.verify(token, JWT_SECRET);
            
            if (decoded) {
                res.locals.token = decoded;
                return next();
            } else {
                console.error(`Token decode error`);
            }

        } catch (err:any) {
            console.error(err.message);
        }

    } else {
        console.error(`No token provided.`);
    }

    return res.sendStatus(401);
}