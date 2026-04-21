const mysql = require("mysql2");

const db = mysql.createConnection({
  host:               "localhost",
  user:               "root",
  password:           "0000",
  database:           "instadm",
  multipleStatements: true,
});

db.connect((err) => {
  if (err) {
    console.error("[DB] ❌ MySQL connection failed:", err.message);
    console.error("     Make sure MySQL is running and database 'instadm' exists.");
    process.exit(1);
  }
  console.log("[DB] ✅ Connected to MySQL (instadm)");
  initTables();
});

function initTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      google_id  VARCHAR(100) NOT NULL,
      email      VARCHAR(255) NOT NULL,
      name       VARCHAR(255),
      avatar     TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_google (google_id),
      UNIQUE KEY uq_email  (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS instagram_accounts (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      user_id          INT NOT NULL,
      ig_user_id       VARCHAR(100) NOT NULL,
      ig_username      VARCHAR(255),
      ig_name          VARCHAR(255),
      ig_avatar        TEXT,
      ig_bio           TEXT,
      ig_followers     INT DEFAULT 0,
      ig_following     INT DEFAULT 0,
      ig_media_count   INT DEFAULT 0,
      ig_website       VARCHAR(500),
      ig_account_type  VARCHAR(50),
      access_token     TEXT NOT NULL,
      token_expires_at DATETIME,
      page_id          VARCHAR(100),
      page_name        VARCHAR(255),
      connected_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_ig (user_id, ig_user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS ig_posts (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      user_id        INT NOT NULL,
      ig_account_id  INT NOT NULL,
      post_id        VARCHAR(100) NOT NULL,
      caption        TEXT,
      media_type     VARCHAR(50),
      media_url      TEXT,
      thumbnail_url  TEXT,
      permalink      VARCHAR(500),
      like_count     INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      posted_at      DATETIME,
      fetched_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_post (post_id),
      FOREIGN KEY (user_id)       REFERENCES users(id)               ON DELETE CASCADE,
      FOREIGN KEY (ig_account_id) REFERENCES instagram_accounts(id)  ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS dm_rules (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT NOT NULL,
      ig_account_id   INT NOT NULL,
      keyword         VARCHAR(255) NOT NULL,
      response        TEXT NOT NULL,
      static_message  TEXT,
      is_active       TINYINT(1) DEFAULT 1,
      triggered_count INT DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)       REFERENCES users(id)              ON DELETE CASCADE,
      FOREIGN KEY (ig_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS comment_rules (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT NOT NULL,
      ig_account_id   INT NOT NULL,
      keyword         VARCHAR(255) NOT NULL,
      dm_message      TEXT NOT NULL,
      post_id         VARCHAR(100),
      is_active       TINYINT(1) DEFAULT 1,
      triggered_count INT DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)       REFERENCES users(id)              ON DELETE CASCADE,
      FOREIGN KEY (ig_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(128) NOT NULL PRIMARY KEY,
      expires    INT UNSIGNED NOT NULL,
      data       MEDIUMTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error("[DB] ❌ Failed to create tables:", err.message);
      process.exit(1);
    }
    console.log("[DB] ✅ All tables ready.");
  });
}

// Promisified wrapper — use await db.queryAsync(sql, params) everywhere
db.queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

module.exports = db;
