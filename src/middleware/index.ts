import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "";


interface JWTPayload {
    userId: number;
    iat?: number;
    exp?: number;
}

export interface AuthReqProps extends Request {
    token?: string;
    userId?: number;
}
const authMiddleware = async (req: AuthReqProps, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    try {
        if(!authHeader) {
            res.status(401).json({ message: "Unauthorized Access" });
            return;
        }
        const token = authHeader.split(' ')[1];
        await jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if(err) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            } else {
                const decodedPayload = decoded as JWTPayload; 
                req.userId = decodedPayload.userId;
                next();
            }
        });
        

    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

}

export default authMiddleware;