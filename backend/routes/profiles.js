import express from 'express';
import { query } from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// GET /api/profiles?select=first_name,last_name,avatar_url&id=eq.{userId}
// Compatível com formato Supabase
router.get('/', async (req, res) => {
  try {
    const { id, select } = req.query;
    
    // Tentar autenticar, mas não falhar se não tiver token
    let userId = null;
    try {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        if (token && process.env.JWT_SECRET) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        }
      }
    } catch (e) {
      // Token inválido ou não fornecido, continuar sem autenticação
    }
    
    // Extrair userId do formato Supabase (id=eq.{userId})
    if (id) {
      const match = id.match(/eq\.(.+)/);
      if (match) {
        userId = match[1];
      } else {
        userId = id;
      }
    }
    
    if (!userId) {
      // Retornar array vazio se não tiver userId (formato Supabase)
      return res.json([]);
    }
    
    // Se tiver select, usar apenas os campos solicitados
    let fields = 'id, first_name, last_name, avatar_url, phone, cpf, created_at';
    if (select) {
      // Converter formato Supabase para SQL
      const selectedFields = select.split(',').map(f => f.trim());
      const validFields = ['id', 'first_name', 'last_name', 'avatar_url', 'phone', 'cpf', 'created_at'];
      const filteredFields = selectedFields.filter(f => validFields.includes(f));
      if (filteredFields.length > 0) {
        fields = filteredFields.join(', ');
      }
    }
    
    const result = await query(
      `SELECT ${fields}
       FROM profiles
       WHERE id = $1`,
      [userId]
    );

    // Retornar no formato Supabase (array de objetos)
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar perfis',
      code: 'PROFILES_FETCH_ERROR'
    });
  }
});

export default router;

