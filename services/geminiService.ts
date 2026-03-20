import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;

const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY || '';
  // In a real scenario, we handle the missing key more gracefully in the UI
  return new GoogleGenAI({ apiKey });
};

export const sendMessageToGemini = async (message: string, history: { role: string; parts: { text: string }[] }[] = []) => {
  try {
    const ai = getClient();
    
    // Convert history format if needed, but for simplicity we'll just start a fresh chat or reuse a session logic
    // Here we strictly follow the new SDK usage
    if (!chatSession) {
      chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a helpful AI assistant embedded in a productivity app called Edge Note. Keep answers concise and helpful."
        }
      });
    }

    const response = await chatSession.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};