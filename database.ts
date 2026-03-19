import { Pool } from "pg";
 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
 
export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      created_at TEXT,
      level TEXT,
      streak INTEGER DEFAULT 0
    )
  `);
 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      lesson TEXT,
      score INTEGER,
      completed_at TEXT
    )
  `);
 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      date TEXT,
      sentences_spoken INTEGER,
      words_learned INTEGER,
      lessons_completed INTEGER
    )
  `);
 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id SERIAL PRIMARY KEY,
      word TEXT,
      meaning TEXT,
      example TEXT
    )
  `);
 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vocabulary_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      word_id INTEGER,
      last_seen TEXT,
      correct_count INTEGER DEFAULT 0
    )
  `);
 
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON progress(user_id, lesson)
  `);
 
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date)
  `);
 
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_user_word ON vocabulary_progress(user_id, word_id)
  `);
 
  const vocabCount = await pool.query("SELECT COUNT(*) AS count FROM vocabulary");
  if (parseInt(vocabCount.rows[0].count) === 0) {
    await pool.query(
      "INSERT INTO vocabulary (word, meaning, example) VALUES ($1, $2, $3)",
      ["Opportunity", "अवसर", "This is a great opportunity."]
    );
    await pool.query(
      "INSERT INTO vocabulary (word, meaning, example) VALUES ($1, $2, $3)",
      ["Improve", "सुधारना", "I want to improve my English."]
    );
  }
 
  return pool;
}
 
export { pool };