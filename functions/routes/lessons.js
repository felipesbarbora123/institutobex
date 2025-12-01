import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar lições de um curso
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      `SELECT id, course_id, title, description, video_url, order_number, duration_minutes, created_at
       FROM lessons
       WHERE course_id = $1
       ORDER BY order_number ASC`,
      [courseId]
    );

    res.json({ lessons: result.rows });
  } catch (error) {
    console.error('Erro ao listar lições:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar lições',
      code: 'LESSONS_FETCH_ERROR'
    });
  }
});

// Obter lição por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, course_id, title, description, video_url, order_number, duration_minutes, created_at
       FROM lessons
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lição não encontrada',
        code: 'LESSON_NOT_FOUND'
      });
    }

    res.json({ lesson: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar lição:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar lição',
      code: 'LESSON_FETCH_ERROR'
    });
  }
});

// Criar lição (admin/teacher)
router.post('/', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { courseId, title, description, videoUrl, orderNumber, durationMinutes } = req.body;

    const result = await query(
      `INSERT INTO lessons (course_id, title, description, video_url, order_number, duration_minutes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [courseId, title, description, videoUrl, orderNumber || 0, durationMinutes || 0]
    );

    res.status(201).json({ lesson: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar lição:', error);
    res.status(500).json({ 
      error: 'Erro ao criar lição',
      code: 'LESSON_CREATE_ERROR'
    });
  }
});

// Atualizar lição (admin/teacher)
router.put('/:id', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, orderNumber, durationMinutes } = req.body;

    const result = await query(
      `UPDATE lessons
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           video_url = COALESCE($3, video_url),
           order_number = COALESCE($4, order_number),
           duration_minutes = COALESCE($5, duration_minutes)
       WHERE id = $6
       RETURNING *`,
      [title, description, videoUrl, orderNumber, durationMinutes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lição não encontrada',
        code: 'LESSON_NOT_FOUND'
      });
    }

    res.json({ lesson: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar lição:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar lição',
      code: 'LESSON_UPDATE_ERROR'
    });
  }
});

// Deletar lição (admin/teacher)
router.delete('/:id', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM lessons WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lição não encontrada',
        code: 'LESSON_NOT_FOUND'
      });
    }

    res.json({ message: 'Lição deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar lição:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar lição',
      code: 'LESSON_DELETE_ERROR'
    });
  }
});

export default router;

