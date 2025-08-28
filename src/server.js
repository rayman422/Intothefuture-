const express = require('express');
const path = require('path');
const { getDatabase, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static assets
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
  })
);

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /.+@.+\..+/.test(email);
}

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// List posts with optional filters
app.get('/api/posts', (req, res) => {
  const db = getDatabase();
  const { category, q } = req.query;
  const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10) || 10, 50));

  const whereClauses = [];
  const params = [];
  if (category) {
    whereClauses.push('category = ?');
    params.push(String(category));
  }
  if (q) {
    whereClauses.push('(title LIKE ? OR summary LIKE ? OR content LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `SELECT id, slug, title, summary, category, author, published_at, read_time_minutes, hero_emoji, hero_image_url
               FROM posts
               ${whereSql}
               ORDER BY published_at DESC
               LIMIT ?`;

  const finalParams = params.concat([limit]);
  db.all(sql, finalParams, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error', details: String(err) });
    return res.json({ posts: rows });
  });
});

// Get single post by slug
app.get('/api/posts/:slug', (req, res) => {
  const db = getDatabase();
  const { slug } = req.params;
  db.get(
    `SELECT id, slug, title, summary, content, category, author, published_at, read_time_minutes, hero_emoji, hero_image_url
     FROM posts WHERE slug = ?`,
    [slug],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error', details: String(err) });
      if (!row) return res.status(404).json({ error: 'Post not found' });
      return res.json({ post: row });
    }
  );
});

// Categories with counts
app.get('/api/categories', (req, res) => {
  const db = getDatabase();
  db.all(
    `SELECT category, COUNT(*) as count FROM posts GROUP BY category ORDER BY category ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error', details: String(err) });
      return res.json({ categories: rows });
    }
  );
});

// Newsletter subscribe
app.post('/api/newsletter', (req, res) => {
  const db = getDatabase();
  const { email } = req.body || {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  db.run(
    `INSERT OR IGNORE INTO subscribers (email) VALUES (?)`,
    [String(email).trim().toLowerCase()],
    function onInsert(err) {
      if (err) return res.status(500).json({ error: 'Database error', details: String(err) });
      const wasInserted = this && this.changes > 0;
      return res.json({ message: wasInserted ? 'Subscribed successfully' : 'Already subscribed' });
    }
  );
});

// Convenience route to post detail (static page)
app.get('/post/:slug', (req, res) => {
  res.redirect(302, `/post.html?slug=${encodeURIComponent(req.params.slug)}`);
});

// 404 handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

