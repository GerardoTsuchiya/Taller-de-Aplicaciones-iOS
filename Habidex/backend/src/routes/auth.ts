import { Router, Request, Response } from 'express';
import { supabase } from "../services/supabase";

const authRouter = Router();
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const normalizeUsername = (value: string) => value.trim().toLowerCase();
const isEmail = (value: string) => value.includes('@');

async function getUsernameForUser(userId: string): Promise<string | null> {
    const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle();

    return data?.username ?? null;
}

async function resolveEmailFromIdentifier(identifier: string): Promise<string | null> {
    const normalizedIdentifier = identifier.trim();

    if (isEmail(normalizedIdentifier)) {
        return normalizedIdentifier.toLowerCase();
    }

    const username = normalizeUsername(normalizedIdentifier);
    if (!USERNAME_PATTERN.test(username)) return null;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (profileError || !profile) return null;

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
    if (userError || !userData.user.email) return null;

    return userData.user.email;
}

authRouter.post('/register', async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    const normalizedUsername = typeof username === 'string' ? normalizeUsername(username) : '';

    if (!email || !password || !normalizedUsername) {
        res.status(400).json({ error: "Email, usuario y contraseña son requeridos" });
        return;
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
        res.status(400).json({ error: "El usuario debe tener 3-20 caracteres: letras, números o guion bajo" });
        return;
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .maybeSingle();

    if (existingProfileError) {
        res.status(500).json({ error: 'Error al validar usuario' });
        return;
    }

    if (existingProfile) {
        res.status(409).json({ error: 'Ese usuario ya está en uso' });
        return;
    }

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (createError) {
        const alreadyRegistered = createError.message.toLowerCase().includes('already');
        res.status(400).json({
            error: alreadyRegistered
                ? 'Este correo ya está registrado. Intenta iniciar sesión o elimina el usuario desde Supabase para recrearlo.'
                : createError.message,
        });
        return;
    }

    if (!createdUser.user) {
        res.status(500).json({ error: 'Error al crear usuario' });
        return;
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: createdUser.user.id,
            username: normalizedUsername,
            coins: 0,
        }, { onConflict: 'id' });

    if (profileError) {
        await supabase.auth.admin.deleteUser(createdUser.user.id);
        const usernameTaken = profileError.message.toLowerCase().includes('duplicate');
        res.status(usernameTaken ? 409 : 500).json({
            error: usernameTaken ? 'Ese usuario ya está en uso' : 'Error al crear perfil',
        });
        return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (sessionError) {
        res.status(201).json({
            user: {
                id: createdUser.user.id,
                email: createdUser.user.email,
                username: normalizedUsername,
            },
            session: null,
            message: 'Cuenta creada. Inicia sesión para continuar.',
        });
        return;
    }

    res.status(201).json({
        user: {
            id: sessionData.user.id,
            email: sessionData.user.email,
            username: normalizedUsername,
        },
        session: sessionData.session,
        //se agrego el mensaje de alerta
        message: 'Cuenta creada correctamente.',
    });
});

authRouter.post('/login', async (req: Request, res: Response) => {
    const { email, identifier, password } = req.body;
    const loginIdentifier = typeof identifier === 'string' ? identifier : email;

    if (!loginIdentifier || !password) {
        res.status(400).json({ error: "Usuario/correo y contraseña son requeridos" });
        return;
    }

    const resolvedEmail = await resolveEmailFromIdentifier(loginIdentifier);

    if (!resolvedEmail) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });

    if (error) {
        res.status(401).json({ error: error.message });
        return;
    }

    const username = await getUsernameForUser(data.user.id);

    res.status(200).json({
        user: {
            id: data.user.id,
            email: data.user.email,
            username: username ?? data.user.email,
        },
        session: data.session,
    });
});

export default authRouter;
