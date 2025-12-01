import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Função auxiliar para converter price para número
function formatCourse(course) {
  if (!course) return course;
  return {
    ...course,
    price: course.price ? parseFloat(course.price) : 0
  };
}

// Listar todos os cursos
router.get('/', async (req, res) => {
  try {
    // Verificar se é uma query com filtros
    // Tratar category que pode vir como array ou string
    let category = req.query.category;
    if (Array.isArray(category)) {
      // Se vier como array, pegar o primeiro valor não vazio
      category = category.find(c => c && c.trim() !== '') || category[0];
    }
    const { limit, order, id } = req.query;
    
    // Se tiver id na query string com eq (ex: id=eq.xxx), buscar curso específico
    if (id && (id.startsWith('eq.') || !id.includes('.'))) {
      // Extrair o ID do formato "eq.xxx" ou apenas "xxx"
      const courseId = id.startsWith('eq.') ? id.substring(3) : id;
      
      const result = await query(
        `SELECT id, title, description, price, thumbnail_url, category, instructor_name, created_at, updated_at
         FROM courses
         WHERE id = $1`,
        [courseId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Curso não encontrado',
          code: 'COURSE_NOT_FOUND'
        });
      }

      // Retornar objeto único (formato que o Supabase retorna para .single())
      return res.json(formatCourse(result.rows[0]));
    }
    
    let sql = `SELECT id, title, description, price, thumbnail_url, category, instructor_name, created_at, updated_at
       FROM courses WHERE 1=1`;
    const params = [];
    let paramIndex = 1;
    
    // Tratar category com operadores do Supabase (eq, neq, not.is.null, not.eq., etc.)
    // Pode vir como array quando há múltiplos parâmetros na query string
    const categories = Array.isArray(req.query.category) ? req.query.category : (category ? [category] : []);
    
    for (const cat of categories) {
      if (!cat || cat.trim() === '') continue;
      
      if (cat === 'not.is.null') {
        // category não é null
        sql += ` AND category IS NOT NULL`;
      } else if (cat === 'not.eq.') {
        // category não é vazio (não é null e não é string vazia)
        sql += ` AND category IS NOT NULL AND category != ''`;
      } else if (cat.startsWith('eq.')) {
        const categoryValue = cat.substring(3);
        sql += ` AND category = $${paramIndex}`;
        params.push(categoryValue);
        paramIndex++;
      } else if (cat.startsWith('neq.')) {
        const categoryValue = cat.substring(4);
        sql += ` AND category != $${paramIndex}`;
        params.push(categoryValue);
        paramIndex++;
      } else {
        sql += ` AND category = $${paramIndex}`;
        params.push(cat);
        paramIndex++;
      }
    }
    
    // Tratar id com operadores do Supabase (neq, etc.)
    if (id) {
      if (id.startsWith('neq.')) {
        const idValue = id.substring(4);
        sql += ` AND id != $${paramIndex}`;
        params.push(idValue);
        paramIndex++;
      } else if (id.startsWith('eq.')) {
        const idValue = id.substring(3);
        sql += ` AND id = $${paramIndex}`;
        params.push(idValue);
        paramIndex++;
      }
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }
    
    const result = await query(sql, params);

    // Converter price para número e retornar array direto (formato que o Supabase retorna)
    const formattedCourses = result.rows.map(formatCourse);
    res.json(formattedCourses);
  } catch (error) {
    console.error('Erro ao listar cursos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar cursos',
      code: 'COURSES_FETCH_ERROR',
      message: error.message
    });
  }
});

// Obter curso por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, title, description, price, thumbnail_url, category, instructor_name, created_at, updated_at
       FROM courses
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Curso não encontrado',
        code: 'COURSE_NOT_FOUND'
      });
    }

    // Retornar objeto direto (formato que o Supabase retorna)
    res.json(formatCourse(result.rows[0]));
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar curso',
      code: 'COURSE_FETCH_ERROR'
    });
  }
});

// Criar curso (apenas admin)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { title, description, price, thumbnail_url, category, instructor_name } = req.body;

    const result = await query(
      `INSERT INTO courses (title, description, price, thumbnail_url, category, instructor_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [title, description, price, thumbnail_url, category, instructor_name]
    );

    res.status(201).json({ course: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    res.status(500).json({ 
      error: 'Erro ao criar curso',
      code: 'COURSE_CREATE_ERROR'
    });
  }
});

// Atualizar curso (apenas admin)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, thumbnail_url, category, instructor_name } = req.body;

    const result = await query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           thumbnail_url = COALESCE($4, thumbnail_url),
           category = COALESCE($5, category),
           instructor_name = COALESCE($6, instructor_name),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, price, thumbnail_url, category, instructor_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Curso não encontrado',
        code: 'COURSE_NOT_FOUND'
      });
    }

    // Retornar objeto direto (formato que o Supabase retorna)
    res.json(formatCourse(result.rows[0]));
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar curso',
      code: 'COURSE_UPDATE_ERROR'
    });
  }
});

// Deletar curso (apenas admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Curso não encontrado',
        code: 'COURSE_NOT_FOUND'
      });
    }

    res.json({ message: 'Curso deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar curso:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar curso',
      code: 'COURSE_DELETE_ERROR'
    });
  }
});

export default router;

