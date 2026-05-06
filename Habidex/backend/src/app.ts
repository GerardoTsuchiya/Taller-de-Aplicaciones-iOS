import express from 'express';
import authRouter from './routes/auth';
import habitsRouter from './routes/habits';
import collectionRouter from './routes/collection';
import profileRouter from './routes/profile';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use('/auth', authRouter);
app.use('/habits', habitsRouter);
app.use('/collection', collectionRouter);
app.use('/profile', profileRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

app.use(errorHandler);

export default app;
