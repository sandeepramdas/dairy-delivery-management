// Script to generate hashed password for admin user
const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('='.repeat(60));
console.log('Admin User Password Hash Generator');
console.log('='.repeat(60));
console.log('\nPassword:', password);
console.log('Hash:', hash);
console.log('\nUpdate SQL Command:');
console.log(`\nUPDATE users SET password_hash = '${hash}' WHERE email = 'admin@milkdelivery.com';\n`);
console.log('='.repeat(60));
