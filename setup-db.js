const { Client } = require('pg');

const client = new Client({
  host: 'db.hsybcomykhfnyngtytyg.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'hsybcomykhfnyngtytyg', // 需要实际密码
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    await client.connect();
    console.log('✅ 连接成功!');
    await client.end();
  } catch (err) {
    console.log('❌ 需要数据库密码');
  }
}
setup();
