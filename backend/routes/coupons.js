import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validar cupom
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        error: 'Código do cupom é obrigatório'
      });
    }

    // Buscar cupom no banco
    const couponResult = await query(
      `SELECT * FROM coupons 
       WHERE code = $1 
       AND (expires_at IS NULL OR expires_at > NOW())
       AND active = true`,
      [code.toUpperCase()]
    );

    if (couponResult.rows.length === 0) {
      return res.json({
        valid: false,
        error: 'Cupom inválido ou expirado'
      });
    }

    const coupon = couponResult.rows[0];

    // Verificar se já foi usado (se tiver limite de uso)
    if (coupon.usage_limit) {
      const usageResult = await query(
        'SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = $1',
        [coupon.id]
      );

      if (parseInt(usageResult.rows[0].count) >= coupon.usage_limit) {
        return res.json({
          valid: false,
          error: 'Cupom esgotado'
        });
      }
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discount_percent || 0,
      discountAmount: coupon.discount_amount || 0,
      coupon: coupon
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({
      valid: false,
      error: 'Erro ao validar cupom'
    });
  }
});

export default router;

