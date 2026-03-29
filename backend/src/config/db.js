import "../env.js";
import pg from "pg";

const { Pool, types } = pg;

// Equivalent to `dateStrings: true` in mysql2. 
// This forces Postgres to return dates/timestamps as raw strings rather than JS Date objects.
types.setTypeParser(1082, (val) => val); // DATE
types.setTypeParser(1114, (val) => val); // TIMESTAMP
types.setTypeParser(1184, (val) => val); // TIMESTAMPTZ

export const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  // Equivalent to `connectionLimit: 10`
  max: 10, 

  // pg inherently waits for connections and has no queue limit by default, 
  // so `waitForConnections: true` and `queueLimit: 0` are natively handled.

  ssl: {
    rejectUnauthorized: false,
  }
});

/* ALTERNATIVE: 
  Since you are using Supabase, you can actually delete the 
  host/user/password/database/port lines and replace them with just this:
  
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
*/