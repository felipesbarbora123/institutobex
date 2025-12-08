import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Importar rotas
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import purchasesRoutes from './routes/purchases.js';
import whatsappRoutes from './routes/whatsapp.js';
import lessonsRoutes from './routes/lessons.js';
import enrollmentsRoutes from './routes/enrollments.js';
import progressRoutes from './routes/progress.js';
import couponsRoutes from './routes/coupons.js';
import webhooksRoutes from './routes/webhooks.js';
import materialsRoutes from './routes/materials.js';
import usersRoutes from './routes/users.js';
import certificatesRoutes from './routes/certificates.js';

// Importar database para testar conexão
import { query } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet());

// Configurar CORS para aceitar múltiplas origens
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'https://institutobex.com.br'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista de permitidas
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Para desenvolvimento, também permitir localhost
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de debug para logar todas as requisições
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.query, req.params);
  next();
});

// Rate limiting (excluir webhooks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use('/api/', (req, res, next) => {
  // Não aplicar rate limit em webhooks
  if (req.path.startsWith('/webhooks/')) {
    return next();
  }
  return limiter(req, res, next);
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Testar conexão com banco
    await query('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message
    });
  }
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/certificates', certificatesRoutes);

// Debug: Listar todas as rotas registradas
if (process.env.NODE_ENV === 'development') {
  console.log('📋 Rotas registradas:');
  purchasesRoutes.stack.forEach((r) => {
    if (r.route) {
      console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
    }
  });
}

// Rota 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ [SERVER] Erro não tratado:', err);
  console.error('❌ [SERVER] Stack:', err.stack);
  console.error('❌ [SERVER] Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  // Testar conexão com banco
  try {
    await query('SELECT 1');
    console.log('✅ Conectado ao PostgreSQL');
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
    console.error('⚠️  Verifique as configurações do banco de dados no .env');
  }
});

export default app;

