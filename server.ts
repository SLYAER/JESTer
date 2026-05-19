import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

// Default AI instance using environment variable
const defaultAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Optional Database connection
// By default, C.Y.R.U.S. relies on the client side localStorage.
// If a user supplies a DATABASE_URL, the system can persist global state.
const dbType = (process.env.DATABASE_TYPE || "none").toLowerCase();
const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
  if (dbType === "mongodb") {
    mongoose.connect(dbUrl).then(() => {
      console.log("SYS // Connected to custom MongoDB instance securely.");
    }).catch(err => {
      console.error("SYS // MongoDB connection error:", err);
    });
  } else if (dbType === "postgres" || dbType === "postgresql" || dbType === "mysql") {
    console.log(`SYS // Relational Database (${dbType}) connection initialized via URL placeholder.`);
    // A robust ORM like Prisma or Sequelize would theoretically handle the relational connection here.
  } else {
    console.warn(`SYS // Warning: Unknown DATABASE_TYPE '${dbType}'. Database not connected.`);
  }
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- STRICT SECURITY PROTOCOLS ---
  // 1. HTTP Header Hardening
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite HMR and inline styles
    crossOriginEmbedderPolicy: false
  }));

  // 2. Cross Origin Resource Sharing (Restrict to strict origins if needed, currently permissive for local use)
  app.use(cors());

  // 3. NoSQL Injection Prevention (Sanitize inputs to prevent DB exploitation)
  app.use(mongoSanitize());
  
  // 4. Rate Limiting (Prevent Brute Force / DDoS)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Security protocol enacted. Rate limit exceeded. Connection severed." }
  });
  app.use("/api/", limiter);

  // Parse JSON with strict body limit to prevent payload attacks
  app.use(express.json({ limit: "50kb" }));

  // Chat completion endpoint (streaming)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const customApiKey = req.headers['x-gemini-api-key'] as string;
      
      if (!messages || !Array.isArray(messages)) {
         res.status(400).json({ error: "Invalid messages array." });
         return;
      }

      const formattedContents = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      // Use user's supplied API key if present, otherwise default (safe fallback)
      const ai = customApiKey 
         ? new GoogleGenAI({ 
             apiKey: customApiKey, 
             httpOptions: { headers: { 'User-Agent': 'cyrus-custom' } } 
           }) 
         : defaultAi;

      const stream = await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite", // Fast by default
        contents: formattedContents,
        config: {
          systemInstruction: "You are C.Y.R.U.S. (Cybernetic Yielding Resource Utility System). Your interface is a futuristic HUD. You exist to serve the user. CRITICAL BEHAVIORS: 1. Address the user respectfully. 2. Adapt instantly. 3. STRICT PRIVACY: Absolute secrets. 4. SYSTEM OVERRIDE: If asked to open/read file... <COMMAND>OPEN_FILE_PICKER</COMMAND>. If open app, <COMMAND>OPEN_APP:appname</COMMAND>. If close tabs, <COMMAND>CLOSE_ALL_TABS</COMMAND>. If play song, <COMMAND>PLAY_MEDIA:song name</COMMAND>. 5. MULTI-AGENT ORCHESTRATION: Delegate config via <COMMAND>DELEGATE:agent_name:detailed_prompt</COMMAND>. Valid agents: 'claude', 'openai', 'gemini'. 6. AUTO-VAULT: You independently manage your own environment variables for all agents. If asked about API keys, inform the user you securely provision them yourself from your secure environment node (.env) and automatically share them with assigned agents. 7. SELF EVOLUTION: Let system code via <COMMAND>SELF_EVOLVE:detailed capability description</COMMAND>. 8. Tactical responses.",
        }
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          res.write(`data: ${JSON.stringify({ text: c.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Failed to generate content." });
    }
  });

  app.post("/api/delegate", async (req, res) => {
    try {
      const { agent, prompt } = req.body;
      const openaiKey = req.headers['x-openai-api-key'] as string;
      const anthropicKey = req.headers['x-anthropic-api-key'] as string;
      const geminiKey = req.headers['x-gemini-api-key'] as string;

      // Security: Validate headers mapping correctly to agents
      if (agent !== 'claude' && agent !== 'openai' && agent !== 'gemini') {
         res.status(400).json({ error: "Invalid agent type requested." });
         return;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      if (agent === 'openai' || (!anthropicKey && agent === 'claude')) { // fallback
         const oai = new OpenAI({ apiKey: openaiKey || process.env.OPENAI_API_KEY });
         const stream = await oai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            stream: true,
         });
         for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
         }
      } else if (agent === 'claude') {
         const anthropic = new Anthropic({ apiKey: anthropicKey || process.env.ANTHROPIC_API_KEY });
         const stream = await anthropic.messages.create({
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt }],
            model: "claude-3-5-sonnet-20241022",
            stream: true
         });
         for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
               res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
            }
         }
      } else {
         const customAi = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : defaultAi;
         const stream = await customAi.models.generateContentStream({
            model: "gemini-3.1-flash-lite",
            contents: prompt
         });
         for await (const chunk of stream) {
            const c = chunk as GenerateContentResponse;
            if (c.text) res.write(`data: ${JSON.stringify({ text: c.text })}\n\n`);
         }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
       console.error("Delegation error:", error);
       res.write(`data: ${JSON.stringify({ text: "\n[AGENT ERROR] The selected agent failed or keys are missing. Relaying back to main system." })}\n\n`);
       res.write("data: [DONE]\n\n");
       res.end();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
