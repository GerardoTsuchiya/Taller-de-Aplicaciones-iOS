import express from 'express';
import authRouter from './routes/auth';
const app = express();

app.use(express.json());

/* -------- Health Check -------- */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

/* -------- Auth Routes -------- */
app.use('/auth', authRouter);

export default app;