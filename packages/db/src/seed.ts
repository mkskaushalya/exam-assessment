import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

import { users } from './schema';
import { hashPassword, generateId } from '@assessment/utils';

async function seed() {
  console.log('🌱 Starting database seed routines...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: { users } });

  const adminEmail = 'admin@assessment.dev';
  const adminPassword = 'password123';

  console.log(`Looking for existing admin: ${adminEmail}...`);
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
  
  if (existingAdmin.length > 0) {
    console.log(`✅ Admin user ${adminEmail} already exists. Skipping insertion.`);
    return;
  }

  console.log('Generating password hash...');
  const hashedPassword = await hashPassword(adminPassword);
  
  console.log('Inserting admin record to the database...');
  await db.insert(users).values({
    id: generateId(),
    name: 'System Administrator',
    email: adminEmail,
    passwordHash: hashedPassword,
    role: 'admin',
  });

  console.log(`🎉 Successfully seeded admin user!`);
  console.log(`-----------------------------------`);
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`-----------------------------------`);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
