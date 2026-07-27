import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'default',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const db = drizzle(pool, { schema });

async function seedAdmin() {
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'admin123';
  const adminName = 'Admin';

  const existing = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (existing) {
    // Update existing admin to ensure role and isActive
    await db
      .update(users)
      .set({
        role: 'admin',
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, adminEmail));

    console.log(`✓ Admin user updated: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(users).values({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    console.log(`✓ Admin user created: ${adminEmail}`);
  }

  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  Role: admin`);
  console.log(`  Active: true`);

  await pool.end();
}

seedAdmin().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
