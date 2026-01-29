const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DBSOURCE = path.join(__dirname, '../database.sqlite');

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username text UNIQUE,
            email text UNIQUE,
            password text,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            (err) => {
                if (err) {
                    // Table already exists
                }
            });

        // Create Todos Table
        db.run(`CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            task text,
            completed INTEGER DEFAULT 0,
            deadline TEXT,
            priority TEXT DEFAULT 'medium',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
            )`,
            (err) => {
                if (err) {
                    // Table already exists
                }
                // Add deadline column if it doesn't exist (migration for existing tables)
                db.run(`ALTER TABLE todos ADD COLUMN deadline TEXT`, (alterErr) => {
                    // Ignore error if column already exists
                });
                // Add priority column if it doesn't exist
                db.run(`ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium'`, (alterErr) => {
                    // Ignore error if column already exists
                });
            });
    }
});

module.exports = db;
