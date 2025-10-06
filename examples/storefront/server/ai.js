/**
 * Simple AI endpoint for demo purposes.
 * Returns a summary based on the input.
 */

import http from "node:http";

const PORT = 8787;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/ai") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { prompt } = JSON.parse(body);

        // Simple echo response with a summary
        const response = {
          text: `Summary: This is a demo AI response. Input was: ${prompt.slice(0, 50)}...`
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`AI server running at http://localhost:${PORT}`);
});
