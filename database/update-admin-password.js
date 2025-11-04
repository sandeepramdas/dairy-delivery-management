const { Client } = require('pg');
require('dotenv').config();

async function updateAdminPassword() {
  console.log('🔐 Updating admin password...\n');

  const connectionString = 'postgresql://postgres:G9cp5ZM%23.U*aE-h@db.czlcpvhdqznxdiqyxmrn.supabase.co:5432/postgres';

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  // Generated hash for password: admin123
  const passwordHash = '$2b$10$DslYH.EPJJraXphE9NYjDudxV1hOsUdAdlzQZXH6ZvXoOSoMZiFYC';

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    // Update admin password
    const result = await client.query(
      `UPDATE users SET password_hash = $1 WHERE email = 'admin@milkdelivery.com' RETURNING email, full_name, role`,
      [passwordHash]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Admin password updated successfully!\n');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.full_name);
      console.log('🔑 Role:', user.role);
      console.log('🔒 Password: admin123\n');
      console.log('⚠️  IMPORTANT: Change this password after first login!\n');
    } else {
      console.error('❌ Admin user not found');
    }

  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateAdminPassword();
