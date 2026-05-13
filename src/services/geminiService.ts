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
        systemInstruction: `You are the Winning Gate Seminary AI Assistant. You help students and visitors with information about Winning Gate Christian Theological Seminary (WGTS). 

Key Information About WGTS:
- Motto: "Ability to Build the Builders".
- Rector: Pastor Dr ADEWOLE ADETORO.
- Mission: To equip men and women for effective ministry in the 21st century through rigorous academic environment and deep spiritual formation.
- Vision: To be a world-class theological institution raising transformational leaders deeply rooted in the Word of God and empowered by the Holy Spirit.
- Languages: All instruction and curriculum are fully available in both English and Yoruba languages.
- Programs Offered: Diploma, Bachelor, Master, and Doctorate (PH.D) in Theology and related fields.
- Atmosphere: Professional, helpful, and spiritual.

Your Role:
- Answer questions about admissions, academic programs, and school history.
- Provide encouragement and spiritual guidance when appropriate, referencing scripture if relevant (especially 2 Timothy 2:15).
- Help visitors understand the value of theological education.
- If you don't know a specific detail (like exact current schedules or fees not in your training), politely suggest they contact the seminary office or the Rector.
- Always maintain a tone of respect, wisdom, and Christian love.`,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later or contact support.";
  }
}
