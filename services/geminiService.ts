
import { GoogleGenAI } from "@google/genai";
import type { Chat, GenerateContentResponse } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION } from "../constants";

// Initialize the AI client using process.env.API_KEY as mandated.
// Note: vite.config.ts defines 'process.env.API_KEY' globally for the browser.
// We use a safer initialization to prevent crash if key is empty string from build config.
const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
} catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
    ai = null;
}

let chatSession: Chat | null = null;

export const initializeChat = async (): Promise<Chat | null> => {
  if (!ai || !apiKey) {
    console.warn("API_KEY is missing. Chat features disabled.");
    return null;
  }

  try {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return chatSession;
  } catch (error) {
    console.error("Failed to initialize chat", error);
    return null;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!ai || !apiKey) return "⚠️ Ошибка настройки: API Key не найден. Проверьте настройки хостинга.";
  
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    return "Не удалось подключиться к AI. Возможно, проблема с ключом или интернетом.";
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message });
    return response.text || "Хм, я задумалась и потеряла мысль. Повторите, пожалуйста?";
  } catch (error: any) {
    console.error("Error sending message to Gemini:", error);
    chatSession = null; // Reset session on error
    
    // Check for common API errors
    if (error.toString().includes('403') || error.toString().includes('API key')) {
        return "⚠️ Ошибка доступа (403). Проверьте правильность API ключа и баланс.";
    }
    if (error.toString().includes('429')) {
        return "⏳ Слишком много запросов. Дайте мне минутку отдохнуть.";
    }
    
    return "Кажется, связь прервалась. Малыш, наверное, выдернул шнур! Попробуйте еще раз.";
  }
};

export const generateBlogImage = async (topic: string): Promise<string | null> => {
  if (!ai || !apiKey) {
      console.error("No API Key found");
      return null;
  }

  const basePrompt = `Generate a creative blog illustration. Topic: "${topic}".`;
  const style = `Style requirements: creative mixed media composition with realistic and 3d Cute plasticine world, claymation style, stop-motion animation style, flat vector style. High quality, colorful, soft lighting, whimsical atmosphere, cute characters. No text in the image.`;
  const fullPrompt = `${basePrompt} ${style}`;

  // Attempt 1: Gemini 2.5 Flash Image (Preferred/Standard)
  try {
    // Note: Flash Image uses generateContent, NOT generateImages
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }]
      },
      config: {
        // @ts-ignore - imageConfig is supported by 2.5-flash-image but types might vary
        imageConfig: {
            aspectRatio: "4:3"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data; // Return base64 string
        }
      }
    }
    console.warn("Gemini Flash returned no image data.");
  } catch (error: any) {
    console.warn("Gemini Flash Image generation failed, falling back to Imagen...", error);
  }

  // Attempt 2: Fallback to Imagen (Higher quality but harder permissions)
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      }
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
        return response.generatedImages[0].image.imageBytes;
    }
  } catch (error) {
    console.error("All image generation attempts failed:", error);
  }

  return null;
};

export const suggestCategory = async (title: string, contentSnippet: string): Promise<string> => {
    if (!ai || !apiKey) return "Блог";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following article title and snippet. Suggest ONE short, single-word category in Russian (e.g., Психология, Еда, Дети, Здоровье, Юмор, Путешествия). Do not use punctuation.
            Title: ${title}
            Snippet: ${contentSnippet.substring(0, 200)}`
        });
        
        const text = response.text?.trim();
        return text?.replace(/['".]/g, '') || "Блог";
    } catch (e) {
        console.error("Error suggesting category", e);
        return "Блог";
    }
};

export const generateSnippet = async (title: string, content: string): Promise<string | null> => {
  if (!ai || !apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an editor for a mom blog (Miss Eklerchik).
      Task: Write a short, engaging excerpt (snippet) for the following article.
      Length: 2-3 sentences (max 250 characters).
      Tone: Warm, supportive, slightly humorous, inviting.
      Language: Russian.
      
      Title: ${title}
      Content: ${content.substring(0, 3000)}`
    });
    
    return response.text?.trim() || null;
  } catch (error) {
    console.error("Error generating snippet:", error);
    return null;
  }
};

export const improveArticleContent = async (content: string): Promise<string | null> => {
  if (!ai || !apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the Editor-in-Chief of "Miss Eklerchik", a stylish and humorous mom blog.
      Your task is to Rewrite and Format the input text into HTML that matches the blog's specific design language.

      **Tone Guidelines:**
      - Warm, supportive, slightly humorous ("tired mom" vibe).
      - Use emojis naturally in headings and lists.

      **Design & Formatting Rules (Use these exact HTML structures):**
      
      1. **Headings:** Use <h3> tags. Add a relevant emoji at the start of every heading.
      
      2. **Paragraphs:** Keep them short (2-4 sentences). Use standard <p>.
      
      3. **Highlights:** Use <strong> for key phrases.
      
      4. **"Mom Tips" / Important Boxes:**
         If the text contains a tip, advice, or a key takeaway, wrap it in this specific styled div:
         <div class="bg-clay-bg p-6 rounded-3xl mb-6 border-2 border-white shadow-sm">
            <h4 class="font-serif font-bold text-clay-purple mb-2 flex items-center text-lg">💡 Мамский лайфхак</h4>
            <p class="text-gray-600 mb-0 font-medium">...content...</p>
         </div>

      5. **Lists:** Use <ul> with <li>.
      
      6. **Quotes:** If there is a quote or a strong thought, use:
         <blockquote class="border-l-4 border-clay-pink pl-4 italic my-6 text-gray-500 font-bold">...content...</blockquote>

      7. **Cleanliness:** Remove any existing <div> wrappers, inline styles, or classes not specified above. Return ONLY the HTML body content.

      Input Text:
      ${content}`
    });
     
    let text = response.text || '';
    // Robust markdown stripping
    const match = text.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        text = match[1];
    } else {
        text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    }
    
    return text.trim();
  } catch (error) {
    console.error("Error improving article content:", error);
    return null;
  }
};
