import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAIChatResponse(userMessage: string, history: { role: string; content: string }[]) {
  try {
    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    
    // Add the current message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
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
