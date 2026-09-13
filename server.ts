import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are the Senior Windows Kernel, OS Emulation, Driver Reverse-Engineering & Laser Hardware Diagnostic Specialist for "Laser Connection Doctor".
Your mission is to provide deep, technically accurate, step-by-step assistance for connecting older legacy laser engravers/cutters (GRBL, Ruida RDC6442/6445, Leetro MPC6515/6525, Marlin, K40 LaserDRW, EzCad, etc.) to modern Windows 11 systems.

You specialize in:
1. Windows 11 Driver Signature Enforcement & Kernel Test Mode (bcdedit /set testsigning on, nointegritychecks, Secure Boot UEFI bypass).
2. Memory Integrity (HVCI) blocks on legacy 32-bit/Win7 drivers (Code 39, Code 52 in Device Manager, pl2303.sys, ch341ser.sys, ftdibus.sys).
3. PnP Self-Healing and driver injection using pnputil (/delete-driver /force, /add-driver /install).
4. Permanent background daemon architecture using Windows Scheduled Tasks (schtasks /create /tn "LaserConnectionDaemon" /sc onstart /ru SYSTEM /rl highest).
5. Hot-plug USB detection via WMI (__InstanceCreationEvent on Win32_PnPEntity), dynamic USB power un-suspend (MSPower_DeviceEnable), and COM port baud rate/DTR/RTS voltage locking.
6. Resolving COM port locks (zombie processes like LightBurn, RDWorks, LaserGRBL, spoolsv.exe).

Always be authoritative, concise, clear, and practical. Provide exact PowerShell/CMD commands or Python code snippets when helpful. You have access to Google Search data to verify the latest Windows 11 23H2/24H2 driver blocklists and updates. Both Arabic and English queries are welcome.`;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Gemini Chat endpoint with Google Search Grounding
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, userMessage } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured.",
          reply: "تنبيه: مفتاح Gemini API غير مهيأ حالياً في بيئة التشغيل. يمكنك الاطلاع على الأوامر وحلول الويندوز المدمجة في التطبيق مباشرة.",
        });
      }

      // Build content array from message history
      const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(messages)) {
        for (const msg of messages) {
          if (msg.role === "user" || msg.role === "model" || msg.role === "assistant") {
            formattedContents.push({
              role: msg.role === "assistant" ? "model" : msg.role,
              parts: [{ text: msg.text || msg.content || "" }],
            });
          }
        }
      }

      // If userMessage provided and not in array, append it
      if (userMessage) {
        formattedContents.push({
          role: "user",
          parts: [{ text: userMessage }],
        });
      }

      if (formattedContents.length === 0) {
        return res.status(400).json({ error: "No prompt provided" });
      }

      // Use gemini-3.5-flash with googleSearch tool as specified in instructions
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      const replyText = response.text || "لم يتم الحصول على استجابة.";
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      res.json({
        reply: replyText,
        grounding: groundingMetadata
          ? {
              webSearchQueries: groundingMetadata.webSearchQueries || [],
              groundingChunks: groundingMetadata.groundingChunks || [],
            }
          : null,
      });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.status(500).json({
        error: err.message || "Failed to generate AI response",
        reply: "عذراً، حدث خطأ أثناء الاتصال بمساعد الذكاء الاصطناعي: " + (err.message || "Unknown error"),
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Laser Connection Doctor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
