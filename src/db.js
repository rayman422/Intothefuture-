const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

let databaseInstance;

const dataDirectoryPath = path.join(__dirname, '..', 'data');
const databaseFilePath = path.join(dataDirectoryPath, 'app.db');

function ensureDataDirectory() {
  if (!fs.existsSync(dataDirectoryPath)) {
    fs.mkdirSync(dataDirectoryPath, { recursive: true });
  }
}

function getDatabase() {
  if (!databaseInstance) {
    ensureDataDirectory();
    databaseInstance = new sqlite3.Database(databaseFilePath);
  }
  return databaseInstance;
}

function runMigrations(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          summary TEXT,
          content TEXT,
          category TEXT NOT NULL,
          author TEXT,
          published_at TEXT,
          read_time_minutes INTEGER,
          hero_emoji TEXT,
          hero_image_url TEXT
        )`,
        (err) => {
          if (err) return reject(err);
          db.run(
            `CREATE TABLE IF NOT EXISTS subscribers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT NOT NULL UNIQUE,
              subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
            )`,
            (err2) => {
              if (err2) return reject(err2);
              resolve();
            }
          );
        }
      );
    });
  });
}

function seedDatabaseIfEmpty(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
      if (err) return reject(err);
      const hasPosts = row && row.count > 0;
      if (hasPosts) return resolve();

      const seedPosts = [
        {
          slug: 'art-of-terpenes',
          title: 'The Art of Terpenes: Understanding Cannabis Aromatics',
          summary:
            'Dive deep into the complex world of terpenes and discover how these aromatic compounds shape your cannabis experience.',
          content:
            'Terpenes are aromatic compounds found in many plants, including cannabis. They influence the aroma, flavor, and effects of each strain...\n\nIn this guide, we explore limonene, myrcene, pinene and more—how they interact with cannabinoids and how to pick strains based on terpene profiles.',
          category: 'Strain Reviews',
          author: 'Cannabis Curator',
          published_at: '2025-03-15',
          read_time_minutes: 8,
          hero_emoji: '🌿',
          hero_image_url: ''
        },
        {
          slug: 'cannabis-and-wellness-luxury-approach',
          title: 'Cannabis & Wellness: A Luxury Approach',
          summary:
            'Exploring how premium cannabis fits into a sophisticated wellness routine.',
          content:
            'Wellness and cannabis have long overlapped, but a new wave of ritual, design, and lab-grade formulations is elevating routines...\n\nWe cover micro-dosing, non-intoxicating cannabinoids, and pairing with breathwork and sauna.',
          category: 'Luxury Lifestyle',
          author: 'Wellness Editor',
          published_at: '2025-03-12',
          read_time_minutes: 6,
          hero_emoji: '🧖',
          hero_image_url: ''
        },
        {
          slug: 'rise-of-cannabis-sommeliers',
          title: 'The Rise of Cannabis Sommeliers',
          summary:
            'Meet the experts who are elevating cannabis to fine art status.',
          content:
            'Across North America and beyond, cannabis sommeliers are refining a shared language for aroma, mouthfeel, and finish...\n\nWe interview leading voices and explore training paths and certifications.',
          category: 'Cannabis Culture',
          author: 'Culture Desk',
          published_at: '2025-03-10',
          read_time_minutes: 7,
          hero_emoji: '🍷',
          hero_image_url: ''
        },
        {
          slug: 'premium-vaporizer-review-2025',
          title: 'Premium Vaporizer Review: The Ultimate Guide',
          summary:
            'A comprehensive review of the latest luxury cannabis vaporizers.',
          content:
            'From titanium housings to medical-grade paths, we benchmark flavor, efficiency, and maintenance...\n\nIncludes a buyer\'s guide with recommendations by budget and use case.',
          category: 'Product Reviews',
          author: 'Lab Team',
          published_at: '2025-03-08',
          read_time_minutes: 10,
          hero_emoji: '💎',
          hero_image_url: ''
        },
        {
          slug: 'extraction-innovations-2025',
          title: 'Extraction Innovations: What\'s Next in 2025',
          summary:
            'Latest research and techniques in cannabis extraction and purification.',
          content:
            'From solventless rosin tech to cryogenic ethanol, we break down the trade-offs...\n\nLearn how terpene preservation is reshaping premium concentrates.',
          category: 'Science & Innovation',
          author: 'Science Editor',
          published_at: '2025-03-06',
          read_time_minutes: 9,
          hero_emoji: '🧪',
          hero_image_url: ''
        },
        {
          slug: 'mastering-terroir-in-cultivation',
          title: 'Mastering Terroir in Cultivation',
          summary:
            'How environment and technique produce world-class cannabis.',
          content:
            'We explore soil biology, VPD strategies, and post-harvest handling to preserve expression...\n\nIncludes tips from award-winning cultivators.',
          category: 'Cultivation',
          author: 'Grower In Residence',
          published_at: '2025-03-04',
          read_time_minutes: 11,
          hero_emoji: '🌱',
          hero_image_url: ''
        },
        {
          slug: 'pairing-cannabis-with-fine-dining',
          title: 'Pairing Cannabis with Fine Dining',
          summary:
            'Sommelier-inspired pairings for elevated dinner parties.',
          content:
            'We match terpene profiles with classic dishes and discuss timing and dosage for a seamless evening.',
          category: 'Cannabis Culture',
          author: 'Culinary Team',
          published_at: '2025-02-28',
          read_time_minutes: 6,
          hero_emoji: '🍽️',
          hero_image_url: ''
        },
        {
          slug: 'small-batch-flower-review',
          title: 'Small-Batch Flower Review: 2025 Standouts',
          summary:
            'Our panel reviews limited runs and craft phenos worth seeking out.',
          content:
            'Sticky resin, loud noses, and immaculate trims—here are the jars that impressed our panel this month.',
          category: 'Strain Reviews',
          author: 'Tasting Panel',
          published_at: '2025-02-25',
          read_time_minutes: 8,
          hero_emoji: '🔬',
          hero_image_url: ''
        },
        {
          slug: 'designing-a-luxury-consumption-lounge',
          title: 'Designing a Luxury Consumption Lounge',
          summary:
            'From acoustics to airflow, what makes a space truly premium.',
          content:
            'We tour lounges pushing boundaries in architecture and hospitality and extract lessons for operators.',
          category: 'Luxury Lifestyle',
          author: 'Design Editor',
          published_at: '2025-02-20',
          read_time_minutes: 7,
          hero_emoji: '🏛️',
          hero_image_url: ''
        },
        {
          slug: 'glass-artisans-to-know',
          title: 'Glass Artisans to Know in 2025',
          summary:
            'A look at functional art and the makers behind it.',
          content:
            'We profile leading glassblowers and discuss collecting strategies for appreciating value and supporting artists.',
          category: 'Product Reviews',
          author: 'Art Desk',
          published_at: '2025-02-18',
          read_time_minutes: 5,
          hero_emoji: '🧩',
          hero_image_url: ''
        }
      ];

      const insertSql = `INSERT INTO posts (
        slug, title, summary, content, category, author, published_at, read_time_minutes, hero_emoji, hero_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.serialize(() => {
        const stmt = db.prepare(insertSql);
        seedPosts.forEach((p) => {
          stmt.run(
            p.slug,
            p.title,
            p.summary,
            p.content,
            p.category,
            p.author,
            p.published_at,
            p.read_time_minutes,
            p.hero_emoji,
            p.hero_image_url
          );
        });
        stmt.finalize((err3) => {
          if (err3) return reject(err3);
          resolve();
        });
      });
    });
  });
}

async function initializeDatabase() {
  const db = getDatabase();
  await runMigrations(db);
  await seedDatabaseIfEmpty(db);
  return db;
}

module.exports = {
  getDatabase,
  initializeDatabase
};

// CLI helper: allow `node src/db.js --seed`
if (require.main === module) {
  const shouldSeed = process.argv.includes('--seed');
  if (shouldSeed) {
    initializeDatabase()
      .then(() => {
        console.log('Database initialized and seeded.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Failed to seed database:', err);
        process.exit(1);
      });
  } else {
    console.log('Usage: node src/db.js --seed');
  }
}

