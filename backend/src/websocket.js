import url from "url";

const activeConnections = new Map();

export function initializeSubmissionWS(wss) {
  wss.on("connection", (ws, req) => {
    const parameters = url.parse(req.url, true);
    const submissionId = parameters.query.submissionId;

    if (!submissionId) {
      ws.close(1008, "Submission ID is required");
      return;
    }

    activeConnections.set(String(submissionId), ws);

    ws.on("close", () => {
      activeConnections.delete(String(submissionId));
    });
  });
}

export function sendToClient(submissionId, payload) {
  const ws = activeConnections.get(String(submissionId));
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

export function disconnectClient(submissionId) {
  const ws = activeConnections.get(String(submissionId));
  if (ws) {
    ws.close(1000, "Submission processing completed");
    activeConnections.delete(String(submissionId));
  }
}