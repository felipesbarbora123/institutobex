import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obter perfil do usuário
// GET /api/users/profile?id=eq.{userId}
// Suporta formato Supabase: ?select=first_name,last_name,avatar_url&id=eq.{userId}
// Autenticação opcional: se tiver token, usa; senão, usa o id do query
router.get('/profile', async (req, res) => {
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
      // Retornar objeto vazio se não tiver userId
      return res.json({
        first_name: '',
        last_name: '',
        avatar_url: null
      });
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

    if (result.rows.length === 0) {
      // Retornar objeto vazio no formato esperado pelo frontend
      return res.json({
        first_name: '',
        last_name: '',
        avatar_url: null
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar perfil',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// Atualizar perfil do usuário
// Suporta dois formatos:
// 1. PUT /api/users/profile (usa token para pegar userId)
// 2. PUT /api/users/profile/:id (usa ID da URL)
router.put('/profile/:id?', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, avatar_url } = req.body;
    
    // Se tiver ID na URL, usar ele; senão, usar do token
    let userId = req.params.id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'ID do usuário não fornecido',
        code: 'USER_ID_REQUIRED'
      });
    }

    const result = await query(
      `UPDATE profiles 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, first_name, last_name, avatar_url, phone, cpf, created_at`,
      [first_name, last_name, avatar_url, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Perfil não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar perfil',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Obter roles do usuário
// GET /api/users/roles?user_id=eq.{userId}
// Autenticação opcional: se tiver token, usa; senão, usa o user_id do query
router.get('/roles', async (req, res) => {
  try {
    const { user_id } = req.query;
    
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
      // Retornar array vazio se não tiver userId
      return res.json([]);
    }
    
    const result = await query(
      `SELECT user_id, role, created_at
       FROM user_roles
       WHERE user_id = $1`,
      [userId]
    );

    // Retornar no formato esperado pelo frontend (array de objetos com role)
    const roles = result.rows.map(row => ({ role: row.role }));
    
    res.json(roles);
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar roles',
      code: 'ROLES_FETCH_ERROR'
    });
  }
});

export default router;

