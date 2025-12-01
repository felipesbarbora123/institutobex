-- ========================================
-- CRIAR USUÁRIOS NECESSÁRIOS
-- ========================================
-- 
-- Este script cria os usuários em auth.users que são referenciados
-- pelos dados importados. As senhas precisarão ser resetadas.
-- ========================================

-- Usuário 1: e7b2726a-ed65-4773-83c3-e3d128a00484
-- Email: igorsenabet@gmail.com (inferido dos dados)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'e7b2726a-ed65-4773-83c3-e3d128a00484',
  'igorsenabet@gmail.com',
  '$2a$10$placeholder_password_hash_reset_required', -- Senha precisa ser resetada
  NOW(),
  '2025-11-14 15:52:47.472241+00',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Usuário 2: 9af42be6-0f2b-49ee-965e-decc4079bfbe (Admin)
-- Email: (mesmo usuário ou diferente - usar email do perfil)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '9af42be6-0f2b-49ee-965e-decc4079bfbe',
  'igor.senako7@gmail.com', -- Email de admin fixo
  '$2a$10$placeholder_password_hash_reset_required', -- Senha precisa ser resetada
  NOW(),
  '2025-11-14 15:52:47.472241+00',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Usuário 3: be05d28e-a996-4e75-b38c-ec25db1f8922
-- Email: (precisa ser inferido ou criado)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'be05d28e-a996-4e75-b38c-ec25db1f8922',
  'usuario3@example.com', -- ALTERAR: Email real do usuário
  '$2a$10$placeholder_password_hash_reset_required', -- Senha precisa ser resetada
  NOW(),
  '2025-11-21 15:20:56.70505+00',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Usuário 4: 5ed39a37-51a8-43f4-b22c-2d6965efe6f7
-- Email: (precisa ser inferido ou criado)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '5ed39a37-51a8-43f4-b22c-2d6965efe6f7',
  'usuario4@example.com', -- ALTERAR: Email real do usuário
  '$2a$10$placeholder_password_hash_reset_required', -- Senha precisa ser resetada
  NOW(),
  '2025-11-21 17:05:11.551152+00',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- NOTA IMPORTANTE:
-- ========================================
-- 1. As senhas são placeholders e precisam ser resetadas
-- 2. Os usuários precisarão usar "Esqueci minha senha" para criar nova senha
-- 3. Ou você pode gerar senhas temporárias e enviar por email
-- 4. Os emails podem precisar ser ajustados conforme os dados reais
-- ========================================

