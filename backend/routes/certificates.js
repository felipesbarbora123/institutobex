import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar certificados do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_id, order, select } = req.query;
    
    console.log(`🎓 [CERTIFICATES] Buscando certificados para user_id: ${userId}`);
    console.log(`🎓 [CERTIFICATES] Query params:`, { user_id, order, select });
    
    // Se user_id foi especificado na query, verificar se é o próprio usuário ou admin
    let targetUserId = userId;
    if (user_id) {
      // Extrair user_id do formato "eq.xxx"
      const extractedUserId = user_id.startsWith('eq.') ? user_id.substring(3) : user_id;
      
      // Se não for o próprio usuário, verificar se é admin
      if (extractedUserId !== userId) {
        // Verificar se o usuário é admin
        const roleCheck = await query(
          `SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'`,
          [userId]
        );
        
        if (roleCheck.rows.length === 0) {
          return res.status(403).json({
            error: 'Acesso negado',
            code: 'FORBIDDEN'
          });
        }
      }
      
      targetUserId = extractedUserId;
    }
    
    // Construir query SQL
    let sql = `
      SELECT 
        c.id,
        c.user_id,
        c.course_id,
        c.certificate_code,
        c.certificate_url,
        c.validation_url,
        c.qr_code_data,
        c.issued_at,
        c.created_at,
        co.title as course_title,
        co.thumbnail_url as course_thumbnail,
        co.instructor_name
      FROM certificates c
      JOIN courses co ON co.id = c.course_id
      WHERE c.user_id = $1
    `;
    
    const params = [targetUserId];
    
    // Adicionar ordenação
    if (order) {
      // Formato: "issued_at.desc" ou "issued_at.asc"
      const orderParts = order.split('.');
      if (orderParts.length === 2) {
        const field = orderParts[0];
        const direction = orderParts[1].toUpperCase();
        
        // Validar campo e direção
        const validFields = ['issued_at', 'created_at', 'certificate_code'];
        const validDirections = ['ASC', 'DESC'];
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          sql += ` ORDER BY c.${field} ${direction}`;
        } else {
          sql += ` ORDER BY c.issued_at DESC`;
        }
      } else {
        sql += ` ORDER BY c.issued_at DESC`;
      }
    } else {
      sql += ` ORDER BY c.issued_at DESC`;
    }
    
    console.log(`🎓 [CERTIFICATES] SQL:`, sql);
    console.log(`🎓 [CERTIFICATES] Params:`, params);
    
    const result = await query(sql, params);
    
    console.log(`🎓 [CERTIFICATES] Query executada, ${result.rows.length} certificado(s) encontrado(s)`);
    
    // Formatar resposta
    const certificates = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      course_id: row.course_id,
      certificate_code: row.certificate_code,
      certificate_url: row.certificate_url,
      validation_url: row.validation_url,
      qr_code_data: row.qr_code_data,
      issued_at: row.issued_at,
      created_at: row.created_at,
      course: {
        id: row.course_id,
        title: row.course_title,
        thumbnail_url: row.course_thumbnail,
        instructor_name: row.instructor_name
      }
    }));
    
    console.log(`✅ [CERTIFICATES] Retornando ${certificates.length} certificado(s)`);
    res.json(certificates);
  } catch (error) {
    console.error('❌ [CERTIFICATES] Erro ao listar certificados:', error);
    res.status(500).json({
      error: 'Erro ao buscar certificados',
      code: 'CERTIFICATES_FETCH_ERROR',
      details: error.message
    });
  }
});

// Obter certificado específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await query(
      `SELECT 
        c.*,
        co.title as course_title,
        co.thumbnail_url as course_thumbnail,
        co.instructor_name
       FROM certificates c
       JOIN courses co ON co.id = c.course_id
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Certificado não encontrado',
        code: 'CERTIFICATE_NOT_FOUND'
      });
    }
    
    const certificate = result.rows[0];
    
    // Verificar se o usuário tem permissão (próprio certificado ou admin)
    if (certificate.user_id !== userId) {
      const roleCheck = await query(
        `SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'`,
        [userId]
      );
      
      if (roleCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'Acesso negado',
          code: 'FORBIDDEN'
        });
      }
    }
    
    res.json({
      id: certificate.id,
      user_id: certificate.user_id,
      course_id: certificate.course_id,
      certificate_code: certificate.certificate_code,
      certificate_url: certificate.certificate_url,
      validation_url: certificate.validation_url,
      qr_code_data: certificate.qr_code_data,
      issued_at: certificate.issued_at,
      created_at: certificate.created_at,
      course: {
        id: certificate.course_id,
        title: certificate.course_title,
        thumbnail_url: certificate.course_thumbnail,
        instructor_name: certificate.instructor_name
      }
    });
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    res.status(500).json({
      error: 'Erro ao buscar certificado',
      code: 'CERTIFICATE_FETCH_ERROR'
    });
  }
});

export default router;

