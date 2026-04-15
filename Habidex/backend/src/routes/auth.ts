import { Router, Request, Response } from 'express';
import { supabase } from "../services/supabase";

const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "Email y contraseña son requeridos" });
        return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password});

    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    res.status(201).json({ user: data.user, session: data.session });
});

authRouter.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "Email y contraseña son requeridos" });
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        res.status(401).json({ error: error.message });
        return;
    }
    
    res.status(200).json({ user: data.user, session: data.session });
});

export default authRouter;