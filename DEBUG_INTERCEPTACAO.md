# 🐛 Debug da Interceptação

## Problema
Os dados de cursos ainda estão vindo do Supabase ao invés do banco local.

## Verificações necessárias

1. **Verificar se o replacement está sendo carregado**:
   - Abra o código fonte da página (Ctrl+U)
   - Procure por `🚀 Inicializando substituição do Supabase`
   - Deve estar logo após `<head>`

2. **Verificar logs no console**:
   - Deve aparecer: `🚀 Inicializando substituição do Supabase...`
   - Deve aparecer: `✅ createClient interceptado`
   - Deve aparecer: `✅ Fetch interceptado`
   - Quando a página carregar, deve aparecer: `🔄 createClient CHAMADO`
   - Deve aparecer: `🔄 Query interceptada: from("courses")`

3. **Verificar a aba Network**:
   - Não deve haver chamadas para `supabase.co`
   - Deve haver chamadas para `localhost:3001/api/courses`

4. **Se não aparecer nenhum log**:
   - O replacement não está sendo carregado
   - Verifique se o servidor está servindo o HTML modificado

5. **Se aparecer logs mas ainda houver chamadas ao Supabase**:
   - O código compilado pode estar usando uma forma diferente de chamada
   - Verifique a aba Network para ver qual URL está sendo chamada

## Próximos passos

Se o replacement não estiver funcionando, pode ser necessário:
1. Interceptar a variável global do Supabase (se houver)
2. Interceptar o módulo ES6 do Supabase
3. Verificar se há Service Worker interferindo

