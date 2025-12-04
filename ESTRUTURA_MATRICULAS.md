# 📚 Estrutura de Matrículas - Como Funciona

## 🎯 Tabela Principal: `course_enrollments`

A tabela **`course_enrollments`** é a tabela que indica que um usuário está matriculado em um curso.

### Estrutura da Tabela

```sql
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  UNIQUE(user_id, course_id)
);
```

### Campos Importantes

- **`user_id`**: ID do usuário matriculado
- **`course_id`**: ID do curso
- **`enrolled_at`**: Data/hora da matrícula
- **`last_accessed`**: Última vez que o usuário acessou o curso

## 🔍 Como Verificar se um Usuário Está Matriculado

### 1. Via SQL (Direto no Banco)

```sql
-- Verificar todas as matrículas de um usuário
SELECT 
  ce.*,
  c.title as course_title,
  c.instructor_name
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
WHERE ce.user_id = 'ID_DO_USUARIO'
ORDER BY ce.enrolled_at DESC;
```

### 2. Via API

**Endpoint:** `GET /api/enrollments/my-enrollments`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta:**
```json
[
  {
    "enrolled_at": "2024-01-15T10:30:00Z",
    "last_accessed": "2024-01-20T14:20:00Z",
    "courses": {
      "id": "uuid-do-curso",
      "title": "Nome do Curso",
      "instructor_name": "Nome do Instrutor",
      "thumbnail_url": "https://..."
    }
  }
]
```

## 🔄 Fluxo de Criação de Matrícula

### Quando um Pagamento é Confirmado

1. **Webhook do AbacatePay** → `/api/webhooks/abacatepay`
   - Recebe confirmação de pagamento
   - Atualiza `course_purchases` com status `paid`
   - **Cria entrada em `course_enrollments`**

2. **Verificação de Status** → `/api/purchases/payment/status/:billingId`
   - Verifica status no gateway
   - Se status for `PAID` ou `APPROVED`
   - **Cria entrada em `course_enrollments`**

3. **Confirmação Manual** → `/api/purchases/confirm`
   - Endpoint para confirmar pagamento manualmente
   - **Cria entrada em `course_enrollments`**

### Código que Cria a Matrícula

```javascript
// Em backend/routes/webhooks.js e backend/routes/purchases.js
await query(
  `INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
   VALUES ($1, $2, NOW())
   ON CONFLICT (user_id, course_id) DO NOTHING`,
  [purchase.user_id, purchase.course_id]
);
```

## 🛠️ Criar Matrícula Manualmente (Admin)

### Via API

**Endpoint:** `POST /api/enrollments`

**Headers:**
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "uuid-do-usuario",
  "courseId": "uuid-do-curso"
}
```

### Via SQL

```sql
INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
VALUES ('uuid-do-usuario', 'uuid-do-curso', NOW())
ON CONFLICT (user_id, course_id) DO UPDATE
SET enrolled_at = NOW();
```

## 🔍 Verificar se Pagamento Criou Matrícula

### 1. Verificar Compra

```sql
SELECT 
  cp.*,
  c.title as course_title
FROM course_purchases cp
JOIN courses c ON c.id = cp.course_id
WHERE cp.user_id = 'ID_DO_USUARIO'
ORDER BY cp.created_at DESC;
```

### 2. Verificar Matrícula Correspondente

```sql
SELECT 
  ce.*,
  c.title as course_title
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
WHERE ce.user_id = 'ID_DO_USUARIO'
  AND ce.course_id = 'ID_DO_CURSO';
```

### 3. Se Pagamento Aprovado mas Sem Matrícula

Se o `course_purchases` tem `payment_status = 'paid'` mas não há matrícula:

```sql
-- Criar matrícula manualmente
INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
SELECT 
  cp.user_id,
  cp.course_id,
  NOW()
FROM course_purchases cp
WHERE cp.payment_status = 'paid'
  AND cp.user_id = 'ID_DO_USUARIO'
  AND cp.course_id = 'ID_DO_CURSO'
  AND NOT EXISTS (
    SELECT 1 FROM course_enrollments ce
    WHERE ce.user_id = cp.user_id
      AND ce.course_id = cp.course_id
  );
```

## 🐛 Problemas Comuns

### 1. Usuário Pagou mas Não Aparece Curso

**Causa:** Matrícula não foi criada após confirmação de pagamento

**Solução:**
1. Verificar se `course_purchases` tem `payment_status = 'paid'`
2. Verificar se existe entrada em `course_enrollments`
3. Se não existir, criar manualmente (ver acima)

### 2. Endpoint Retorna Array Vazio

**Causa:** Usuário não tem matrículas ou token inválido

**Verificação:**
```bash
# Testar endpoint diretamente
curl -X GET http://localhost:3000/api/enrollments/my-enrollments \
  -H "Authorization: Bearer <token>"
```

### 3. Matrícula Existe mas Não Aparece no Frontend

**Causa:** Problema na interceptação ou formato de resposta

**Verificação:**
1. Verificar logs do console do navegador
2. Verificar se endpoint retorna dados corretamente
3. Verificar formato da resposta (deve ter `courses` aninhado)

## 📊 Relacionamento com Outras Tabelas

```
course_purchases (Compra)
    ↓ (quando payment_status = 'paid')
course_enrollments (Matrícula)
    ↓ (JOIN)
courses (Curso)
```

## ✅ Checklist para Debug

- [ ] Verificar se `course_purchases` tem registro com `payment_status = 'paid'`
- [ ] Verificar se `course_enrollments` tem registro correspondente
- [ ] Verificar se `user_id` e `course_id` estão corretos
- [ ] Verificar se token de autenticação é válido
- [ ] Verificar logs do backend para erros
- [ ] Verificar logs do frontend (console do navegador)
- [ ] Testar endpoint `/api/enrollments/my-enrollments` diretamente

