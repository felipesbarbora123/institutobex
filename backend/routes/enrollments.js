import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// GET /api/enrollments?select=course_id,enrolled_at,last_accessed&user_id=eq.{userId}
// Compatível com formato Supabase - DEVE vir ANTES das outras rotas
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
    
    // Verificar se o select inclui relacionamento com courses (formato Supabase: courses(...))
    const hasCoursesRelation = select && select.includes('courses(');
    
    if (hasCoursesRelation) {
      // Extrair campos do relacionamento courses(...)
      const coursesMatch = select.match(/courses\(([^)]+)\)/);
      const coursesFields = coursesMatch ? coursesMatch[1].split(',').map(f => f.trim()) : [];
      
      // Campos válidos da tabela courses
      const validCourseFields = ['id', 'title', 'instructor_name', 'thumbnail_url', 'description', 'price', 'category'];
      const filteredCourseFields = coursesFields.filter(f => validCourseFields.includes(f));
      
      // Se não especificou campos, usar padrão
      const courseSelectFields = filteredCourseFields.length > 0 
        ? filteredCourseFields.map(f => `c.${f} as c_${f}`).join(', ')
        : 'c.id as c_id, c.title as c_title, c.instructor_name as c_instructor_name, c.thumbnail_url as c_thumbnail_url';
      
      // Extrair campos do enrollment (se especificados)
      const enrollmentFields = select.split(',').map(f => f.trim()).filter(f => !f.includes('courses('));
      const validEnrollmentFields = ['course_id', 'enrolled_at', 'last_accessed'];
      const filteredEnrollmentFields = enrollmentFields.filter(f => validEnrollmentFields.includes(f));
      const enrollmentSelectFields = filteredEnrollmentFields.length > 0
        ? filteredEnrollmentFields.map(f => `ce.${f}`).join(', ')
        : 'ce.enrolled_at, ce.course_id';
      
      const result = await query(
        `SELECT 
          ${enrollmentSelectFields},
          ${courseSelectFields}
         FROM course_enrollments ce
         JOIN courses c ON c.id = ce.course_id
         WHERE ce.user_id = $1 AND c.is_deleted = false
         ORDER BY ce.enrolled_at DESC`,
        [userId]
      );
      
      // Formatar resposta com objeto courses aninhado
      const formatted = result.rows.map(row => {
        const enrollment = {};
        const courses = {};
        
        // Extrair campos do enrollment
        if (row.enrolled_at) enrollment.enrolled_at = row.enrolled_at;
        if (row.last_accessed) enrollment.last_accessed = row.last_accessed;
        if (row.course_id) enrollment.course_id = row.course_id;
        
        // Extrair campos do course (usando aliases com prefixo c_)
        if (row.c_id !== undefined) courses.id = row.c_id;
        if (row.c_title) courses.title = row.c_title;
        if (row.c_instructor_name) courses.instructor_name = row.c_instructor_name;
        if (row.c_thumbnail_url) courses.thumbnail_url = row.c_thumbnail_url;
        if (row.c_description) courses.description = row.c_description;
        if (row.c_price !== undefined) courses.price = row.c_price;
        if (row.c_category) courses.category = row.c_category;
        
        return {
          ...enrollment,
          courses: courses
        };
      });
      
      res.json(formatted);
    } else {
      // Se não tiver relacionamento, retornar apenas campos simples
      let fields = 'ce.course_id, ce.enrolled_at, ce.last_accessed';
      if (select) {
        // Converter formato Supabase para SQL
        const selectedFields = select.split(',').map(f => f.trim());
        const validFields = ['course_id', 'enrolled_at', 'last_accessed'];
        const filteredFields = selectedFields.filter(f => validFields.includes(f));
        if (filteredFields.length > 0) {
          fields = filteredFields.map(f => `ce.${f}`).join(', ');
        }
      }
      
      const result = await query(
        `SELECT ${fields}
         FROM course_enrollments ce
         WHERE ce.user_id = $1
         ORDER BY ce.enrolled_at DESC`,
        [userId]
      );

      // Retornar no formato Supabase (array de objetos)
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar matrículas',
      code: 'ENROLLMENTS_FETCH_ERROR'
    });
  }
});

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

    // Formatar resposta no formato esperado pelo frontend
    // Incluir course_id no nível superior para compatibilidade com MyCourses
    // E também courses aninhado para compatibilidade com Profile
    const formattedEnrollments = result.rows.map(row => ({
      course_id: row.course_id, // Adicionado para compatibilidade com MyCourses
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

// Listar todas as matrículas (admin) - rota alternativa
router.get('/all', authenticateToken, requireRole('admin'), async (req, res) => {
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

