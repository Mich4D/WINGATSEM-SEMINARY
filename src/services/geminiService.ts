import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAIClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
    }
    ai = new GoogleGenAI({ apiKey: key || 'dummy-key-to-prevent-crash' });
  }
  return ai;
}

export async function generateAIChatResponse(userMessage: string, history: { role: string; content: string }[]) {
  try {
    const client = getAIClient();
    if (!process.env.GEMINI_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY) {
      return "The AI feature is not fully configured (missing API key). Please contact the administrator.";
    }

    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    
    // Add the current message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: "You are the Winning Gate Seminary AI Assistant. You help students and visitors with information about Winning Gate Christian Theological Seminary (WGTS). Be professional, helpful, and spiritual when appropriate. You can answer questions about admissions, programs (Diploma, Bachelor, Master, Doctorate), live classes, and events. If you don't know something specifically about the seminary's current schedule, suggest they contact the staff.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later or contact support.";
  }
}
