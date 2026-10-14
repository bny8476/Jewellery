import { seedDatabase } from '../lib/seedData';

// Restrict database seeding strictly to development mode
declare global {
  interface Window {
    seedDatabase?: () => void;
  }
}

if (import.meta.env.DEV) {
  window.seedDatabase = seedDatabase;
  console.log('[Dev Only] Seeding function available via window.seedDatabase()');
}
