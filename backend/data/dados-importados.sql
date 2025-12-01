-- ========================================
-- DADOS IMPORTADOS DO SUPABASE
-- Adaptado para o novo banco de dados
-- Data: 2025-11-26
-- ========================================
-- 
-- IMPORTANTE:
-- 1. Execute este script APÓS criar as tabelas (migrations)
-- 2. Os UUIDs são preservados do banco original
-- 3. URLs do Supabase Storage são mantidas (podem precisar ser atualizadas depois)
-- ========================================

-- ========================================
-- ORDEM DE INSERÇÃO:
-- 1. Courses (primeiro, pois outras tabelas referenciam)
-- 2. Lessons (depende de courses)
-- 3. Profiles (depende de auth.users - já criados)
-- 4. User_roles (depende de auth.users)
-- 5. Course_enrollments (depende de users e courses)
-- 6. Lesson_progress (depende de users e lessons)
-- 7. Course_purchases (depende de users e courses)
-- 8. Certificates (por último, depende de users e courses)
-- ========================================

-- ========================================
-- TABELA: courses (PRIMEIRO)
-- ========================================

INSERT INTO courses (id, title, description, instructor_name, category, price, duration_hours, thumbnail_url, created_by, created_at, updated_at, is_deleted, enrolled_students_count, display_students_count, certificate_enabled, certificate_description, certificate_category, certificate_min_completion, certificate_workload, certificate_template_url, certificate_template_back_url, certificate_back_content, certificate_name_position, certificate_fields) VALUES
('cf2b3847-18a3-4489-bc1b-431fa00971ed', 'Fundamentos de Tecnologia Web', 'Curso introdutório sobre tecnologias web modernas, incluindo HTML, CSS, JavaScript e frameworks populares. Perfeito para iniciantes que desejam entender os fundamentos do desenvolvimento web.', 'Instituto BeX', 'Tecnologia', 5.00, 2, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', NULL, '2025-11-14 14:51:34.503374+00', '2025-11-14 18:01:10.966948+00', false, 0, NULL, true, 'Fundamentos de Tecnologia Web', NULL, 80, 20, 'https://elusfwlvtqafvzplnooh.supabase.co/storage/v1/object/public/certificates/templates/cf2b3847-18a3-4489-bc1b-431fa00971ed-front-1763136384728.png', 'https://elusfwlvtqafvzplnooh.supabase.co/storage/v1/object/public/certificates/templates/cf2b3847-18a3-4489-bc1b-431fa00971ed-back-1763136389920.png', NULL, NULL, '[]'::jsonb),
('c9236cc8-417c-4fec-b84f-90fdf16a9a7b', 'Introdução ao Design Digital', 'Aprenda os fundamentos do design digital, desde conceitos básicos até ferramentas práticas. Ideal para iniciantes que querem criar layouts incríveis.', 'Instituto BeX', 'Design', 5.00, 8, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80', NULL, '2025-11-14 15:37:55.326569+00', '2025-11-14 15:46:31.640167+00', false, 0, NULL, true, 'Introdução ao Design Digital', 'Design', 80, 16, '/certificates/template-front.png', '/certificates/template-back.png', 'Conteúdo Programático:



1. Fundamentos do Design Digital

2. Teoria das Cores

3. Tipografia Digital

4. Composição e Layout

5. Design Responsivo

6. Ferramentas de Design (Figma/Adobe XD)

7. UX/UI Basics

8. Projeto Prático de Interface', NULL, '[{"id":"student_name","label":"Nome do Aluno","type":"text","x":653,"y":400,"align":"center","color":"#2C3E50","fontFamily":"Helvetica-Bold","fontSize":48},{"id":"course_name","label":"Nome do Curso","type":"text","x":653,"y":480,"align":"center","color":"#5D6D7E","fontFamily":"Helvetica","fontSize":28},{"id":"completion_date","label":"Data de Conclusão","type":"date","x":350,"y":650,"color":"#34495E","fontFamily":"Helvetica","fontSize":16},{"id":"workload","label":"Carga Horária","type":"number","x":600,"y":650,"color":"#34495E","fontFamily":"Helvetica","fontSize":16},{"id":"certificate_code","label":"Código de Verificação","type":"text","x":1050,"y":665,"color":"#7F8C8D","fontFamily":"Courier","fontSize":11},{"id":"qr_code","label":"QR Code","type":"qrcode","x":1150,"y":550,"size":100}]'::jsonb),
('1f860e9e-adf8-4e0a-9106-5cf6ca5616cd', 'Curso de Teste PIX', 'Curso para testar a integração de pagamentos PIX e notificações WhatsApp. Valor promocional de R$ 0,50 para validação.', 'Instituto Bex', 'Teste', 1.00, 1, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop', NULL, '2025-11-21 15:00:56.707599+00', '2025-11-21 15:03:22.711191+00', false, 0, NULL, false, NULL, NULL, 80, 0, NULL, NULL, NULL, NULL, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: lessons
-- ========================================

INSERT INTO lessons (id, course_id, title, description, video_url, duration_minutes, order_number, created_at) VALUES
('93d65563-8000-4cac-9036-51b71c9d88e3', 'cf2b3847-18a3-4489-bc1b-431fa00971ed', 'Introdução ao Desenvolvimento Web', 'Conceitos básicos de HTML, CSS e JavaScript para começar sua jornada no desenvolvimento web.', 'https://www.youtube.com/watch?v=Ukg_U3CnJWI', 120, 1, '2025-11-14 14:51:34.503374+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: course_enrollments
-- ========================================

INSERT INTO course_enrollments (id, user_id, course_id, enrolled_at, last_accessed) VALUES
('b8e1d02f-083a-4c4d-8dcc-86740c39c4ee', 'e7b2726a-ed65-4773-83c3-e3d128a00484', 'cf2b3847-18a3-4489-bc1b-431fa00971ed', '2025-11-14 15:25:38.812122+00', NULL),
('b2f5a9b9-5470-4889-89c3-d3e185615372', '9af42be6-0f2b-49ee-965e-decc4079bfbe', 'cf2b3847-18a3-4489-bc1b-431fa00971ed', '2025-11-14 15:30:35.10276+00', NULL),
('809fb5f1-489b-4f4d-96b1-11ed1ada0240', 'be05d28e-a996-4e75-b38c-ec25db1f8922', '1f860e9e-adf8-4e0a-9106-5cf6ca5616cd', '2025-11-21 15:20:56.70505+00', NULL),
('a9baebad-7d67-47fd-b6d2-4ea8cd2f2e7f', '5ed39a37-51a8-43f4-b22c-2d6965efe6f7', 'c9236cc8-417c-4fec-b84f-90fdf16a9a7b', '2025-11-21 17:05:11.551152+00', NULL)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: lesson_progress
-- ========================================

INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at) VALUES
('c136f053-bfa0-4283-bc0c-227133e84403', '9af42be6-0f2b-49ee-965e-decc4079bfbe', '93d65563-8000-4cac-9036-51b71c9d88e3', true, '2025-11-14 15:48:11.195+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: profiles
-- ========================================

INSERT INTO profiles (id, first_name, last_name, phone, cpf, cpf_verified, avatar_url, birth_date, registration_code, created_at) VALUES
('e7b2726a-ed65-4773-83c3-e3d128a00484', 'IGOR', 'DE SENA SILVA', '83994153975', '12043694456', false, NULL, NULL, NULL, '2025-11-14 15:52:47.472241+00'),
('9af42be6-0f2b-49ee-965e-decc4079bfbe', 'IGOR', 'DE SENA SILVA', '83994153975', '12043694456', false, NULL, NULL, NULL, '2025-11-14 15:52:47.472241+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: user_roles
-- ========================================

INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('2ad8ab82-edb1-4a37-84e5-2f96407cf836', '9af42be6-0f2b-49ee-965e-decc4079bfbe', 'admin', '2025-11-14 16:05:21.76109+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: course_purchases
-- ========================================
-- Nota: Adaptado para incluir campos external_id e billing_id do metadata
-- Inserções individuais para evitar conflitos de external_id

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('1d28cfbe-cc83-41eb-a003-6fdbd539fbff', 'e7b2726a-ed65-4773-83c3-e3d128a00484', 'cf2b3847-18a3-4489-bc1b-431fa00971ed', 5.00, 'pix', 'approved', 'CURSO17631319903927VDRMIFQ3', NULL, 
  '{"email":"igorsenabet@gmail.com","name":"IGOR DE SENA SILVA","phone":"83994153975","taxId":"12043694456"}'::jsonb,
  '{"customerEmail":"igorsenabet@gmail.com","customerName":"IGOR DE SENA SILVA","customerPhone":"83994153975","customerTaxId":"12043694456","temporaryUserId":"temp_igorsenabet_gmail_com_1763131990393"}'::jsonb, 
  '2025-11-14 14:53:13.526652+00', '2025-11-14 15:25:38.812122+00', '2025-11-14 15:25:38.812122+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('5982c1eb-ad1d-4b9f-acd2-7e07f433f5d4', NULL, 'cf2b3847-18a3-4489-bc1b-431fa00971ed', 5.00, 'pix', 'pending', 'CURSO1763132732118S8I7NL9PA', 'pix_char_5FQArYRNpb11a5rZd25zrwmK',
  NULL,
  '{"billingId":"pix_char_5FQArYRNpb11a5rZd25zrwmK","expiresAt":"2025-11-14T15:15:41.119Z","orderBumps":[],"paymentMethod":"pix"}'::jsonb, 
  '2025-11-14 15:05:35.208416+00', '2025-11-14 15:05:35.208416+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('cb5734bb-400e-42b0-864f-1643c2575e9a', '9af42be6-0f2b-49ee-965e-decc4079bfbe', 'cf2b3847-18a3-4489-bc1b-431fa00971ed', 5.00, 'pix', 'approved', 'CURSO17631341878857RENJCAWT', 'pix_char_agAwDmdB3ZxqdnEKUAcy6gsr',
  NULL,
  '{"billingId":"pix_char_agAwDmdB3ZxqdnEKUAcy6gsr","expiresAt":"2025-11-14T15:39:53.967Z","orderBumps":[],"paymentMethod":"pix"}'::jsonb, 
  '2025-11-14 15:29:50.388783+00', '2025-11-14 15:30:34.46+00', '2025-11-14 15:30:34.46+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('b7d10fa6-5456-4d91-838c-e0072a548858', NULL, 'c9236cc8-417c-4fec-b84f-90fdf16a9a7b', 5.00, 'card', 'pending', 'CURSO1763136616015VA9WUK4LL', 'bill_TUgfbjtftBfYCuMUSN6Xndmc',
  NULL,
  '{"billingId":"bill_TUgfbjtftBfYCuMUSN6Xndmc","coupon":null,"orderBumps":[],"paymentMethod":"card"}'::jsonb, 
  '2025-11-14 16:10:19.828969+00', '2025-11-14 16:10:19.828969+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('87da25af-85ac-4a69-b973-7b46a029e377', NULL, 'c9236cc8-417c-4fec-b84f-90fdf16a9a7b', 5.00, 'card', 'pending', 'CURSO1763136645228E3U02DCKR', 'bill_PykFm5UTg1ZwGGas4DEcFwFU',
  NULL,
  '{"billingId":"bill_PykFm5UTg1ZwGGas4DEcFwFU","coupon":null,"orderBumps":[],"paymentMethod":"card"}'::jsonb, 
  '2025-11-14 16:10:46.662874+00', '2025-11-14 16:10:46.662874+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('049eb691-6bf3-4474-a6c7-54fa17494ffc', NULL, 'cf2b3847-18a3-4489-bc1b-431fa00971ed', 5.00, 'card', 'pending', 'CURSO1763145720949LF44V3BNK', 'bill_Wz4paM3u6EENw6ngTUXDShGC',
  NULL,
  '{"billingId":"bill_Wz4paM3u6EENw6ngTUXDShGC","coupon":null,"orderBumps":[],"paymentMethod":"card"}'::jsonb, 
  '2025-11-14 18:42:15.654758+00', '2025-11-14 18:42:15.654758+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('69d6328f-c4de-4a71-a9ae-051fd873c4b9', NULL, 'cf2b3847-18a3-4489-bc1b-431fa00971ed', 5.00, 'pix', 'pending', 'CURSO1763147080829Z65A2VIAT', NULL,
  '{"email":"igor.senapes@gmail.com","name":"IGOR DE SENA SILVA","phone":"83994153975","taxId":"12043694456"}'::jsonb,
  '{"customerEmail":"igor.senapes@gmail.com","customerName":"IGOR DE SENA SILVA","customerPhone":"83994153975","customerTaxId":"12043694456","temporaryUserId":"temp_igor_senapes_gmail_com_1763147080829"}'::jsonb, 
  '2025-11-14 19:05:12.522649+00', '2025-11-14 19:05:12.522649+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('cba5b053-d561-4a8e-a307-5a66564ecb03', NULL, 'c9236cc8-417c-4fec-b84f-90fdf16a9a7b', 5.00, 'pix', 'pending', 'CURSO1763737067605QTMPSEN13', NULL,
  '{"email":"felipesbarbosa.ti@gmail.com","name":"FELIPE SANTOS BARBOSA","phone":"28999221773","taxId":"13385988721"}'::jsonb,
  '{"customerEmail":"felipesbarbosa.ti@gmail.com","customerName":"FELIPE SANTOS BARBOSA","customerPhone":"28999221773","customerTaxId":"13385988721","temporaryUserId":"temp_felipesbarbosa_ti_gmail_com_1763737067605"}'::jsonb, 
  '2025-11-21 14:57:50.218196+00', '2025-11-21 14:57:50.218196+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Nota: Este registro tem external_id duplicado com o anterior, usando id diferente
INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('086c0d8c-4590-4f42-b93c-0a4d27836394', NULL, 'c9236cc8-417c-4fec-b84f-90fdf16a9a7b', 5.00, NULL, 'pending', 'CURSO1763737067605QTMPSEN13-DUP', NULL,
  '{"email":"felipesbarbosa.ti@gmail.com","name":"FELIPE SANTOS BARBOSA","phone":"28999221773","taxId":"13385988721"}'::jsonb,
  '{"customerEmail":"felipesbarbosa.ti@gmail.com","customerName":"FELIPE SANTOS BARBOSA","customerPhone":"28999221773","customerTaxId":"13385988721","orderBumps":[],"paymentMethod":"pix"}'::jsonb, 
  '2025-11-21 14:57:52.932079+00', '2025-11-21 14:57:52.932079+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_purchases (id, user_id, course_id, amount, payment_method, payment_status, external_id, billing_id, customer_data, metadata, created_at, updated_at, approved_at, cancelled_at) VALUES
('05483a98-7e51-447d-b38c-d91a4a1a386b', NULL, 'c9236cc8-417c-4fec-b84f-90fdf16a9a7b', 5.00, 'pix', 'pending', 'CURSO1763737082057CLHW1RDF8', NULL,
  '{"email":"felipesbarbosa.ti@gmail.com","name":"FELIPE SANTOS BARBOSA","phone":"28999221773","taxId":"13385988721"}'::jsonb,
  '{"customerEmail":"felipesbarbosa.ti@gmail.com","customerName":"FELIPE SANTOS BARBOSA","customerPhone":"28999221773","customerTaxId":"13385988721","temporaryUserId":"temp_felipesbarbosa_ti_gmail_com_1763737082057"}'::jsonb, 
  '2025-11-21 14:58:02.774983+00', '2025-11-21 14:58:02.774983+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: certificates (ÚLTIMO - depende de courses e users)
-- ========================================

INSERT INTO certificates (id, user_id, course_id, certificate_code, certificate_url, validation_url, qr_code_data, issued_at, created_at) VALUES
('e7cd3016-0101-45fb-91a4-d2098e10304a', '9af42be6-0f2b-49ee-965e-decc4079bfbe', 'cf2b3847-18a3-4489-bc1b-431fa00971ed', 'CERT-1763139910281-NEUCTH', 'https://elusfwlvtqafvzplnooh.supabase.co/storage/v1/object/public/course_materials/certificates/certificate-9af42be6-0f2b-49ee-965e-decc4079bfbe-cf2b3847-18a3-4489-bc1b-431fa00971ed-1763139911989.pdf', 'https://app.elusfwlvtqafvzplnooh.supabase.co/verificar-certificado/CERT-1763139910281-NEUCTH', NULL, '2025-11-14 17:05:13.57+00', '2025-11-14 17:05:13.697744+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- NOTA: Usuários
-- ========================================
-- Os usuários devem ser criados ANTES de executar este script.
-- Execute: backend/data/usuarios-para-criar.sql primeiro
-- ========================================

-- ========================================
-- FIM DO SCRIPT DE DADOS
-- ========================================

