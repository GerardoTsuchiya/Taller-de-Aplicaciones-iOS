import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createPublicKey } from "crypto";
import { AuthUser } from "../types";

let cachedPublicKey: string | null = null;

async function getSupabasePublicKey(): Promise<string> {
    if (cachedPublicKey) return cachedPublicKey;
    const url = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
    const res = await fetch(url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { keys } = await res.json() as { keys: any[] };
    const key = createPublicKey({ key: keys[0], format: "jwk" });
    cachedPublicKey = key.export({ type: "spki", format: "pem" }) as string;
    return cachedPublicKey;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No autorizado" });
        return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "No autorizado" });
        return;
    }

    try {
        const publicKey = await getSupabasePublicKey();
        const decoded = jwt.verify(token, publicKey, { algorithms: ["ES256"] }) as unknown as AuthUser;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};