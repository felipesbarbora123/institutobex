import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obter progresso de uma lição
router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT id, user_id, lesson_id, completed, completed_at
       FROM lesson_progress
       WHERE user_id = $1 AND lesson_id = $2`,
      [userId, lessonId]
    );

    res.json({ 
      progress: result.rows[0] || { completed: false, completed_at: null }
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar progresso',
      code: 'PROGRESS_FETCH_ERROR'
    });
  }
});

// Obter progresso de um curso
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Buscar todas as lições do curso
    const lessonsResult = await query(
      `SELECT id, title, order_number, duration_minutes
       FROM lessons
       WHERE course_id = $1
       ORDER BY order_number ASC`,
      [courseId]
    );

    const lessons = lessonsResult.rows;

    // Buscar progresso de cada lição
    const progressResult = await query(
      `SELECT lesson_id, completed, completed_at
       FROM lesson_progress
       WHERE user_id = $1 AND lesson_id = ANY($2::uuid[])`,
      [userId, lessons.map(l => l.id)]
    );

    const progressMap = {};
    progressResult.rows.forEach(p => {
      progressMap[p.lesson_id] = p;
    });

    // Calcular estatísticas
    const completed = progressResult.rows.filter(p => p.completed).length;
    const total = lessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      courseId,
      totalLessons: total,
      completedLessons: completed,
      percentage,
      lessons: lessons.map(lesson => ({
        ...lesson,
        progress: progressMap[lesson.id] || { completed: false, completed_at: null }
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar progresso do curso:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar progresso do curso',
      code: 'COURSE_PROGRESS_FETCH_ERROR'
    });
  }
});

// Marcar lição como concluída
router.post('/lesson/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (user_id, lesson_id) 
       DO UPDATE SET completed = true, completed_at = NOW()
       RETURNING *`,
      [userId, lessonId]
    );

    res.json({ progress: result.rows[0] });
  } catch (error) {
    console.error('Erro ao marcar lição como concluída:', error);
    res.status(500).json({ 
      error: 'Erro ao marcar lição como concluída',
      code: 'PROGRESS_UPDATE_ERROR'
    });
  }
});

// Desmarcar lição como concluída
router.post('/lesson/:lessonId/uncomplete', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE lesson_progress
       SET completed = false, completed_at = NULL
       WHERE user_id = $1 AND lesson_id = $2
       RETURNING *`,
      [userId, lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Progresso não encontrado',
        code: 'PROGRESS_NOT_FOUND'
      });
    }

    res.json({ progress: result.rows[0] });
  } catch (error) {
    console.error('Erro ao desmarcar lição:', error);
    res.status(500).json({ 
      error: 'Erro ao desmarcar lição',
      code: 'PROGRESS_UPDATE_ERROR'
    });
  }
});

export default router;

