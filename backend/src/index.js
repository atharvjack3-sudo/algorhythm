import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import http from "http";
import { WebSocketServer } from "ws";
import potdData from "./cache/potdCache.js";
import { db } from "./config/db.js";

import { setupWSConnection } from "y-websocket/bin/utils"; 

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  setupWSConnection(conn, req);
});

async function startServer() {
  const potd = await db.query("SELECT id, problem_id FROM potd WHERE date = CURRENT_DATE");
  potdData.set(potd);
  console.log(potdData.get());
  server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}
startServer();