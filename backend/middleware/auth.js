import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Middleware de autenticação
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'UNAUTHORIZED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o perfil existe no banco - profiles não tem email, apenas id
    const result = await query(
      `SELECT id FROM profiles WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Usar apenas o ID do token, email não é necessário para autenticação
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(500).json({ 
      error: 'Erro ao verificar token',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware para verificar role (admin, teacher, etc)
export const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Autenticação requerida',
        code: 'UNAUTHORIZED'
      });
    }

    // Buscar role do usuário
    const result = await query(
      `SELECT role FROM user_roles WHERE user_id = $1`,
      [req.user.id]
    );

    const userRole = result.rows[0]?.role || 'student';

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão insuficiente.',
        code: 'FORBIDDEN'
      });
    }

    req.user.role = userRole;
    next();
  };
};

// Gerar token JWT
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

