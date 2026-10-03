import { seedDatabase } from '../src/lib/seed.js';
import { closeDb } from '../src/lib/db.js';

console.log('Seeding database tables and generating invoice PDFs...');
seedDatabase()
  .then(() => {
    console.log('Database seeded successfully!');
    closeDb();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    closeDb();
    process.exit(1);
  });
