import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "";

export interface AuthReqProps extends Request {
    userId: string | undefined | JwtPayload;
} 

const authMiddleware = async (req: AuthReqProps, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization;
    try {
        if(!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        await jwt.verify(token, JWT_SECRET, (err, userId) => {
            if(err) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            } else {
                req.userId = userId;
                next();
            }
        });
        

    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

}

export default authMiddleware;