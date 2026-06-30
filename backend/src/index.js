import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import http from "http";
import { WebSocketServer } from "ws";

import { setupWSConnection } from "y-websocket/bin/utils"; 

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  setupWSConnection(conn, req);
});

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});