const mysql = require('mysql2/promise');

async function createDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'rootpassword',
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS deepnews_db;');
    await connection.query("GRANT ALL PRIVILEGES ON deepnews_db.* TO 'hub_user'@'%';");
    
    console.log('✅ Database deepnews_db created and permissions granted to hub_user!');
    await connection.end();
  } catch (err) {
    console.error('❌ Error creating database:', err);
    process.exit(1);
  }
}

createDb();

