const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupSupabase() {
  console.log('🚀 Setting up Supabase database...\n');

  // Use direct connection string
  const connectionString = 'postgresql://postgres:G9cp5ZM%23.U*aE-h@db.czlcpvhdqznxdiqyxmrn.supabase.co:5432/postgres';

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect
    console.log('1️⃣  Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test connection
    console.log('2️⃣  Testing connection...');
    const testResult = await client.query('SELECT NOW()');
    console.log(`✅ Server time: ${testResult.rows[0].now}\n`);

    // Read schema file
    console.log('3️⃣  Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Execute schema
    console.log('4️⃣  Executing schema (this may take a minute)...');
    await client.query(schema);
    console.log('✅ Schema executed successfully!\n');

    // Verify tables
    console.log('5️⃣  Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`✅ Created ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check sample data
    console.log('\n6️⃣  Checking sample data...');
    const areasResult = await client.query('SELECT COUNT(*) FROM areas');
    const productsResult = await client.query('SELECT COUNT(*) FROM product_catalog');
    const usersResult = await client.query('SELECT COUNT(*) FROM users');

    console.log(`✅ Sample data loaded:`);
    console.log(`   - Areas: ${areasResult.rows[0].count}`);
    console.log(`   - Products: ${productsResult.rows[0].count}`);
    console.log(`   - Users: ${usersResult.rows[0].count}`);

    console.log('\n🎉 Supabase setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update admin password: node database/create-admin.js');
    console.log('   2. Start the server: npm run dev');
    console.log('   3. Test login with admin@milkdelivery.com\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupSupabase();
