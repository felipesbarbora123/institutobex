import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar materiais de um curso
router.get('/', async (req, res) => {
  try {
    const { course_id } = req.query;
    
    if (!course_id) {
      return res.status(400).json({ 
        error: 'course_id é obrigatório',
        code: 'MISSING_COURSE_ID'
      });
    }
    
    // Extrair course_id do formato "eq.xxx" ou apenas "xxx"
    const courseId = course_id.startsWith('eq.') ? course_id.substring(3) : course_id;
    
    const result = await query(
      `SELECT id, course_id, lesson_id, title, file_url, file_type, file_size, created_at
       FROM course_materials
       WHERE course_id = $1
       ORDER BY created_at ASC`,
      [courseId]
    );

    // Retornar array direto (formato que o Supabase retorna)
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar materiais:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar materiais',
      code: 'MATERIALS_FETCH_ERROR',
      message: error.message
    });
  }
});

// Obter material por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, course_id, lesson_id, title, file_url, file_type, file_size, created_at
       FROM course_materials
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Material não encontrado',
        code: 'MATERIAL_NOT_FOUND'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar material:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar material',
      code: 'MATERIAL_FETCH_ERROR'
    });
  }
});

// Criar material (apenas admin)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { course_id, lesson_id, title, file_url, file_type, file_size } = req.body;

    const result = await query(
      `INSERT INTO course_materials (course_id, lesson_id, title, file_url, file_type, file_size, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [course_id, lesson_id, title, file_url, file_type, file_size]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ 
      error: 'Erro ao criar material',
      code: 'MATERIAL_CREATE_ERROR'
    });
  }
});

// Atualizar material (apenas admin)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id, lesson_id, title, file_url, file_type, file_size } = req.body;

    const result = await query(
      `UPDATE course_materials
       SET course_id = COALESCE($1, course_id),
           lesson_id = COALESCE($2, lesson_id),
           title = COALESCE($3, title),
           file_url = COALESCE($4, file_url),
           file_type = COALESCE($5, file_type),
           file_size = COALESCE($6, file_size)
       WHERE id = $7
       RETURNING *`,
      [course_id, lesson_id, title, file_url, file_type, file_size, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Material não encontrado',
        code: 'MATERIAL_NOT_FOUND'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar material',
      code: 'MATERIAL_UPDATE_ERROR'
    });
  }
});

// Deletar material (apenas admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM course_materials WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Material não encontrado',
        code: 'MATERIAL_NOT_FOUND'
      });
    }

    res.json({ message: 'Material deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar material:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar material',
      code: 'MATERIAL_DELETE_ERROR'
    });
  }
});

export default router;

