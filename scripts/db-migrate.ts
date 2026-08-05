/**
 * Script de migration de base de données
 * Usage: npx tsx scripts/db-migrate.ts [direction]
 */

import { execSync } from 'child_process';

const direction = process.argv[2] || 'apply';

async function main() {
  console.log('🗄️  Database Migration');
  console.log('═══════════════════════');
  
  try {
    if (direction === 'generate') {
      console.log('📝 Generating migrations...');
      execSync('cd apps/api && npx drizzle-kit generate', { stdio: 'inherit' });
      console.log('✅ Migrations generated');
    } else if (direction === 'apply') {
      console.log('📦 Applying migrations...');
      execSync('cd apps/api && wrangler d1 migrations apply peage-db --local', { stdio: 'inherit' });
      console.log('✅ Migrations applied (local)');
    } else if (direction === 'apply-remote') {
      console.log('📦 Applying migrations to remote...');
      execSync('cd apps/api && wrangler d1 migrations apply peage-db --remote', { stdio: 'inherit' });
      console.log('✅ Migrations applied (remote)');
    } else if (direction === 'rollback') {
      console.log('⏪ Rolling back...');
      // D1 ne supporte pas le rollback natif, utiliser une migration inverse
      console.log('⚠️  Manual rollback required - create a reverse migration');
    } else {
      console.log('❌ Invalid direction. Use: generate, apply, apply-remote');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
