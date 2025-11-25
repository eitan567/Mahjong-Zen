
import { GoogleGenAI } from "@google/genai";

const AI_MODEL = "gemini-2.5-flash";

const FALLBACK_QUOTES = [
  "הסבלנות היא המפתח להרמוניה.",
  "כמו המים, היה זורם ורך.",
  "כל מסע מתחיל בצעד אחד קטן.",
  "השקט הפנימי חזק מהרעש החיצוני.",
  "נשום עמוק, הפתרון יגיע מעצמו.",
  "אל תילחם בזרם, שחה איתו.",
  "החוכמה נמצאת בהתבוננות שקטה.",
  "גם האריח הבודד חשוב למכלול השלם.",
  "הטבע אינו ממהר, אך הכל נעשה.",
  "מצא את השלווה בתוך הכאוס.",
  "כשהתודעה שקטה, התשובות מופיעות."
];

export const getGeminiHint = async (context: string): Promise<string> => {
  try {
    // Safety check for browser environment
    let apiKey = '';
    try {
      // @ts-ignore
      apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    } catch (e) {
      // Ignore process access errors
    }

    if (!apiKey) {
      // Return a random fallback quote immediately if no key
      return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Strict prompt to ensure ONLY Hebrew output
    let prompt = "כתוב משפט חוכמה קצר, מעורר השראה ומרגיע (בסגנון זן) עבור שחקן מאג'ונג. ";
    prompt += "המשפט חייב להיות בשפה העברית בלבד. ";
    prompt += "אסור לכלול אנגלית. אסור לכלול סינית. אסור לכלול הסברים או תרגומים. ";
    prompt += "רק את המשפט הנקי בעברית. מקסימום 10 מילים.";

    if (context === "Victory") {
      prompt += " המשפט צריך לברך על ניצחון והרמוניה.";
    } else if (context === "Advice") {
      prompt += " המשפט צריך לעודד סבלנות והתבוננות.";
    }

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
    });

    const text = response.text?.trim();
    // Fallback if empty response
    return text || FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  } catch (error) {
    // Fail silently to console to avoid disturbing the user, return fallback
    console.warn("Gemini API unavailable or restricted, using offline wisdom.");
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  }
};
