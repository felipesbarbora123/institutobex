import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'institutobex',
  user: 'postgres',
  password: 'admin',
});

const result = await pool.query(`
  SELECT table_schema, table_name 
  FROM information_schema.tables 
  WHERE table_schema IN ('public', 'auth')
  ORDER BY table_schema, table_name
`);

console.log('\n📊 Tabelas criadas:\n');
result.rows.forEach(row => {
  console.log(`  ✅ ${row.table_schema}.${row.table_name}`);
});

console.log(`\nTotal: ${result.rows.length} tabelas\n`);

await pool.end();

