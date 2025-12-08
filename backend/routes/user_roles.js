import express from 'express';
import { query } from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// GET /api/user_roles?select=role&user_id=eq.{userId}
// Compatível com formato Supabase
router.get('/', async (req, res) => {
  try {
    const { user_id, select } = req.query;
    
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
    
    // Extrair userId do formato Supabase (user_id=eq.{userId})
    if (user_id) {
      const match = user_id.match(/eq\.(.+)/);
      if (match) {
        userId = match[1];
      } else {
        userId = user_id;
      }
    }
    
    if (!userId) {
      // Retornar array vazio se não tiver userId (formato Supabase)
      return res.json([]);
    }
    
    // Se tiver select, usar apenas os campos solicitados
    let fields = 'user_id, role, created_at';
    if (select) {
      // Converter formato Supabase para SQL
      const selectedFields = select.split(',').map(f => f.trim());
      const validFields = ['user_id', 'role', 'created_at'];
      const filteredFields = selectedFields.filter(f => validFields.includes(f));
      if (filteredFields.length > 0) {
        fields = filteredFields.join(', ');
      }
    }
    
    const result = await query(
      `SELECT ${fields}
       FROM user_roles
       WHERE user_id = $1`,
      [userId]
    );

    // Retornar no formato Supabase (array de objetos)
    // Se select contém apenas 'role', retornar apenas role em cada objeto
    if (select && select.includes('role') && !select.includes('user_id') && !select.includes('created_at')) {
      const roles = result.rows.map(row => ({ role: row.role }));
      res.json(roles);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar roles',
      code: 'USER_ROLES_FETCH_ERROR'
    });
  }
});

export default router;

