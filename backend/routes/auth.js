import express from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Registro de usuário
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // Verificar se usuário já existe
    const existingUser = await query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário em transação
    const result = await transaction(async (client) => {
      // Inserir na tabela auth.users (ou users, dependendo do schema)
      const userResult = await client.query(
        `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW(), NOW())
         RETURNING id, email, created_at`,
        [email, hashedPassword]
      );

      const userId = userResult.rows[0].id;

      // Criar perfil
      await client.query(
        `INSERT INTO profiles (id, first_name, last_name, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, firstName, lastName]
      );

      // Criar role padrão (student)
      await client.query(
        `INSERT INTO user_roles (user_id, role, created_at)
         VALUES ($1, 'student', NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      return userResult.rows[0];
    });

    const token = generateToken(result.id);

    res.status(201).json({
      user: {
        id: result.id,
        email: result.email,
        firstName,
        lastName,
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      error: 'Erro ao criar usuário',
      code: 'SIGNUP_ERROR'
    });
  }
});

// Login
router.post('/signin', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuário
    const userResult = await query(
      `SELECT u.id, u.email, u.encrypted_password, p.first_name, p.last_name
       FROM auth.users u
       LEFT JOIN profiles p ON p.id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.encrypted_password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Buscar role
    const roleResult = await query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [user.id]
    );

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: roleResult.rows[0]?.role || 'student',
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      code: 'LOGIN_ERROR'
    });
  }
});

// Obter usuário atual
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, p.first_name, p.last_name, ur.role
       FROM auth.users u
       LEFT JOIN profiles p ON p.id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar usuário',
      code: 'USER_FETCH_ERROR'
    });
  }
});

// Logout (client-side apenas, mas mantemos endpoint)
router.post('/signout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Auto-criar admin (para contas pré-cadastradas)
router.post('/auto-create-admin', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.json({
        success: false,
        error: 'Usuário já existe',
        code: 'USER_EXISTS'
      });
    }

    // Verificar se o email está na lista de admins pré-cadastrados
    // Por segurança, você pode criar uma tabela de admins pré-cadastrados
    // Por enquanto, vamos permitir criar qualquer admin (ajuste conforme necessário)
    const defaultPassword = 'admin123'; // Senha padrão - ALTERE EM PRODUÇÃO!
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const result = await transaction(async (client) => {
      // Criar usuário
      const userResult = await client.query(
        `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW(), NOW())
         RETURNING id, email, created_at`,
        [email.toLowerCase().trim(), hashedPassword]
      );

      const userId = userResult.rows[0].id;

      // Criar perfil
      await client.query(
        `INSERT INTO profiles (id, first_name, last_name, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'Admin', 'User']
      );

      // Criar role de admin
      await client.query(
        `INSERT INTO user_roles (user_id, role, created_at)
         VALUES ($1, 'admin', NOW())
         ON CONFLICT (user_id) DO UPDATE SET role = 'admin'`,
        [userId]
      );

      return userResult.rows[0];
    });

    res.json({
      success: true,
      message: 'Conta de admin criada com sucesso',
      user: {
        id: result.id,
        email: result.email
      },
      // ⚠️ Em produção, não retorne a senha!
      defaultPassword: defaultPassword
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar conta de admin',
      code: 'AUTO_CREATE_ERROR'
    });
  }
});

export default router;

