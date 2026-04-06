import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../types";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if(!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No autorizado" });
        return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.SUPABASE_JWT_SECRET;

    if (!token || !secret) {
        res.status(401).json({ error: "No autorizado" });
        return;
    }

    try {
        const decoded = jwt.verify(token, secret) as unknown as AuthUser;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }};