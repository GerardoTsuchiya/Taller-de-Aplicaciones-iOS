require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_EMAIL = 'fer.merino1231@gmail.com';
const DEMO_PASSWORD = 'prueba';
const DEMO_USERNAME = 'panchito';

function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
}

async function main() {
    console.log('Creando cuenta demo...');

    let userId;

    const { data: existingProfile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', DEMO_USERNAME)
        .maybeSingle();

    if (profileLookupError) throw profileLookupError;

    if (existingProfile) {
        userId = existingProfile.id;
        console.log('Cuenta demo encontrada por usuario:', userId);
    } else {
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw usersError;

        const existingUser = usersData.users.find((user) => user.email === DEMO_EMAIL);

        if (existingUser) {
            userId = existingUser.id;
            console.log('Cuenta demo encontrada por correo:', userId);
        } else {
            const { data, error } = await supabase.auth.admin.createUser({
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                email_confirm: true,
            });

            if (error) throw error;

            userId = data.user.id;
            console.log('Usuario creado:', userId);
        }
    }

    await supabase.from('profiles').upsert({
        id: userId,
        username: DEMO_USERNAME,
        coins: 420,
    });

    await supabase.from('pokemon_collection').delete().eq('user_id', userId);
    await supabase.from('habit_completions').delete().eq('user_id', userId);
    await supabase.from('habits').delete().eq('user_id', userId);

    const habitsToInsert = [
        {
            user_id: userId,
            name: 'Estudiar Swift',
            description: 'Practicar desarrollo iOS para la universidad',
            reminder_time: '08:00',
            reminder_enabled: true,
            created_at: daysAgo(90),
        },
        {
            user_id: userId,
            name: 'Leer apuntes',
            description: 'Repasar temas de clase',
            reminder_time: '19:30',
            reminder_enabled: true,
            created_at: daysAgo(86),
        },
        {
            user_id: userId,
            name: 'Hacer ejercicio',
            description: 'Rutina ligera después de clases',
            reminder_time: '07:00',
            reminder_enabled: false,
            created_at: daysAgo(80),
        },
        {
            user_id: userId,
            name: 'Dormir temprano',
            description: 'Mantener un horario saludable',
            reminder_time: '22:30',
            reminder_enabled: true,
            created_at: daysAgo(75),
        },
    ];

    const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .insert(habitsToInsert)
        .select();

    if (habitsError) throw habitsError;

    const completions = [];

    habits.forEach((habit, index) => {
        const totalDays = 75 - index * 8;

        for (let i = totalDays; i >= 0; i--) {
            const shouldSkip =
                index === 0 ? i % 9 === 0 :
                    index === 1 ? i % 5 === 0 :
                        index === 2 ? i % 4 === 0 :
                            i % 7 === 0;

            if (!shouldSkip) {
                completions.push({
                    user_id: userId,
                    habit_id: habit.id,
                    completed_on: daysAgo(i),
                });
            }
        }
    });

    const { error: completionsError } = await supabase
        .from('habit_completions')
        .insert(completions);

    if (completionsError) throw completionsError;

    const caughtPokemonIds = [
        1, 4, 7, 10, 12, 16, 25, 26, 39, 52,
        54, 58, 63, 66, 74, 92, 95, 104, 129, 133,
        143, 147,
    ];

    const pokemonRows = caughtPokemonIds.map((pokemon_id) => ({
        user_id: userId,
        pokemon_id,
    }));

    const { error: pokemonError } = await supabase
        .from('pokemon_collection')
        .insert(pokemonRows);

    if (pokemonError) throw pokemonError;

    const [
        { count: habitsCount, error: habitsCountError },
        { count: completionsCount, error: completionsCountError },
        { count: pokemonCount, error: pokemonCountError },
    ] = await Promise.all([
        supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('habit_completions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('pokemon_collection').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    if (habitsCountError) throw habitsCountError;
    if (completionsCountError) throw completionsCountError;
    if (pokemonCountError) throw pokemonCountError;

    console.log('Cuenta demo lista.');
    console.log('Usuario:', DEMO_USERNAME);
    console.log('Correo:', DEMO_EMAIL);
    console.log('Contraseña:', DEMO_PASSWORD);
    console.log('Habitos:', habitsCount);
    console.log('Completaciones:', completionsCount);
    console.log('Pokemon capturados:', pokemonCount);
}

main().catch((error) => {
    console.error('Error creando demo:', error);
    process.exit(1);
});
