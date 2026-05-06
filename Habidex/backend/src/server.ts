import 'dotenv/config';
import app from './app';
import { initPokemonCache } from './services/pokemonService';

const PORT = process.env.PORT || 3000;

initPokemonCache()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('Error al inicializar caché de Pokémon:', err.message);
    process.exit(1);
  });
