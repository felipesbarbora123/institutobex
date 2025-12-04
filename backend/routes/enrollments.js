import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar matrículas do usuário
router.get('/my-enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📚 [ENROLLMENTS] Buscando matrículas para user_id: ${userId}`);

    const result = await query(
      `SELECT 
        ce.*,
        c.id as course_id,
        c.title as course_title,
        c.thumbnail_url,
        c.instructor_name,
        c.price
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       WHERE ce.user_id = $1 AND c.is_deleted = false
       ORDER BY ce.enrolled_at DESC`,
      [userId]
    );

    console.log(`📚 [ENROLLMENTS] Query executada, ${result.rows.length} matrícula(s) encontrada(s)`);
    
    if (result.rows.length > 0) {
      console.log(`📚 [ENROLLMENTS] Primeira matrícula:`, {
        course_id: result.rows[0].course_id,
        course_title: result.rows[0].course_title,
        enrolled_at: result.rows[0].enrolled_at
      });
    } else {
      console.log(`⚠️ [ENROLLMENTS] Nenhuma matrícula encontrada para user_id: ${userId}`);
    }

    // Formatar resposta no formato esperado pelo frontend (com courses aninhado)
    const formattedEnrollments = result.rows.map(row => ({
      enrolled_at: row.enrolled_at,
      last_accessed: row.last_accessed,
      courses: {
        id: row.course_id,
        title: row.course_title,
        instructor_name: row.instructor_name,
        thumbnail_url: row.thumbnail_url
      }
    }));

    console.log(`✅ [ENROLLMENTS] Retornando ${formattedEnrollments.length} matrícula(s) formatada(s)`);
    res.json(formattedEnrollments);
  } catch (error) {
    console.error('Erro ao listar matrículas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar matrículas',
      code: 'ENROLLMENTS_FETCH_ERROR'
    });
  }
});

// Verificar se usuário está matriculado
router.get('/check/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT id, enrolled_at, last_accessed
       FROM course_enrollments
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    res.json({ 
      enrolled: result.rows.length > 0,
      enrollment: result.rows[0] || null
    });
  } catch (error) {
    console.error('Erro ao verificar matrícula:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar matrícula',
      code: 'ENROLLMENT_CHECK_ERROR'
    });
  }
});

// Criar matrícula (apenas sistema/admin)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    const result = await query(
      `INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, course_id) DO UPDATE
       SET enrolled_at = NOW()
       RETURNING *`,
      [userId, courseId]
    );

    // Atualizar contador de alunos
    await query(
      `UPDATE courses
       SET enrolled_students_count = (
         SELECT COUNT(*) FROM course_enrollments WHERE course_id = $1
       )
       WHERE id = $1`,
      [courseId]
    );

    res.status(201).json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar matrícula:', error);
    res.status(500).json({ 
      error: 'Erro ao criar matrícula',
      code: 'ENROLLMENT_CREATE_ERROR'
    });
  }
});

// Atualizar último acesso
router.patch('/:courseId/access', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE course_enrollments
       SET last_accessed = NOW()
       WHERE user_id = $1 AND course_id = $2
       RETURNING *`,
      [userId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Matrícula não encontrada',
        code: 'ENROLLMENT_NOT_FOUND'
      });
    }

    res.json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar acesso:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar acesso',
      code: 'ENROLLMENT_UPDATE_ERROR'
    });
  }
});

// Listar todas as matrículas (admin)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        ce.*,
        c.title as course_title,
        p.first_name,
        p.last_name,
        au.email
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       JOIN profiles p ON p.id = ce.user_id
       JOIN auth.users au ON au.id = ce.user_id
       ORDER BY ce.enrolled_at DESC
       LIMIT 100`,
      []
    );

    res.json({ enrollments: result.rows });
  } catch (error) {
    console.error('Erro ao listar matrículas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar matrículas',
      code: 'ENROLLMENTS_FETCH_ERROR'
    });
  }
});

export default router;

