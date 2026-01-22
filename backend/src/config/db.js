import "../env.js";
import mysql from "mysql2/promise";

console.log("DB CONFIG CHECK:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  db: process.env.DB_NAME,
});

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  connectionLimit: 10,      
  waitForConnections: true,
  queueLimit: 0,            

  dateStrings: true
});
