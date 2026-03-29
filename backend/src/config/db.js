import "../env.js";
import pg from "pg";

const { Pool, types } = pg;

types.setTypeParser(1082, (val) => val); // DATE
types.setTypeParser(1114, (val) => val); // TIMESTAMP
types.setTypeParser(1184, (val) => val); // TIMESTAMPTZ

export const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT),
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  max: 10, 


  ssl: {
    rejectUnauthorized: false,
  }
});
