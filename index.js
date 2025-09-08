import express from 'express';
import { ensureSchemaTable } from './database/init.js';
import schemaRoutes from './routes/schemaRoutes.js';

const app = express();
const PORT = 3000;

app.use('/api', schemaRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

ensureSchemaTable().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
