/**
 * Script de seeding pour le développement
 * Usage: npx tsx scripts/seed-dev.ts
 */

import { getDb } from '../apps/api/src/core/db';
import { users } from '../apps/api/src/modules/auth/auth.schema';
import { links } from '../apps/api/src/modules/links/links.schema';
import { generateUUID } from '../apps/api/src/utils/crypto';
import { nowISO } from '../apps/api/src/utils/date';
import { hashPassword } from '../apps/api/src/utils/crypto';

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Données de test
  const testUser = {
    id: generateUUID(),
    email: 'demo@peage.io',
    username: 'demo',
    passwordHash: '',
    passwordSalt: '',
    role: 'user' as const,
    status: 'active' as const,
    emailVerified: true,
    referralCode: 'DEMO1234',
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  
  // Hasher le mot de passe
  const { hash, salt } = await hashPassword('Demo@123');
  testUser.passwordHash = hash;
  testUser.passwordSalt = salt;
  
  console.log('📝 Test user: demo@peage.io / Demo@123');
  console.log('✅ Seed data ready');
  console.log('⚠️  Run migration first: pnpm db:migrate');
}

seed().catch(console.error);
