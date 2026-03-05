#!/usr/bin/env node
/**
 * Simple local webhook receiver for security events
 * Listens on port 5002 and logs all events to SIEM_EVENTS.log
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "SIEM_EVENTS.log");
const PORT = 5002;

// Create log file if doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, "");
}

function logEvent(event) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${JSON.stringify(event)}\n`;
  fs.appendFileSync(LOG_FILE, line);

  // Also print to console with color
  console.log(`\n🔒 Security Event:`, event);
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/logs") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const events = JSON.parse(body);
        const eventArray = Array.isArray(events) ? events : [events];

        eventArray.forEach((event) => {
          logEvent(event);
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            eventsReceived: eventArray.length,
          }),
        );
      } catch (err) {
        console.error("Error parsing event:", err.message);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else if (req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "running",
        logFile: LOG_FILE,
        port: PORT,
      }),
    );
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(
    `\n📊 SIEM Webhook Receiver listening on http://localhost:${PORT}`,
  );
  console.log(`📝 Events logged to: ${LOG_FILE}`);
  console.log(`\nReceive endpoint: POST http://localhost:${PORT}/logs`);
  console.log(`Status endpoint:  GET http://localhost:${PORT}/status\n`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n✅ Webhook receiver stopped");
  console.log(`📜 View all events: tail -f ${LOG_FILE}`);
  process.exit(0);
});
