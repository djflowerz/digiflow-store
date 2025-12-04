import { GoogleGenAI } from "@google/genai";
import { Product, Review } from "../types";

export const generateChatResponse = async (
  message: string, 
  history: { role: string; text: string }[],
  products: Product[]
): Promise<string> => {
  // Use process.env.API_KEY directly as per guidelines
  if (!process.env.API_KEY) {
    return "I'm sorry, I'm currently offline (API Key missing). Please contact support.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Create a context-aware system instruction
    const productContext = products.slice(0, 10).map(p => 
      `${p.name} (${p.category}): KES ${p.price} - ${p.description}`
    ).join('\n');

    const systemInstruction = `You are "DigiBot", the helpful AI assistant for Digiflow Store. 
    We sell tech gadgets, mobile accessories, and clothing in Kenya.
    Currency is KES (Kenya Shillings).
    Be polite, professional, and concise.
    
    Here is a sample of our current products:
    ${productContext}
    
    If asked about products not listed, suggest checking the "Shop" page.
    If asked about shipping, we ship countrywide in Kenya.
    If asked about payments, we accept M-Pesa (Till 8844704).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
      }
    });

    return response.text || "I'm not sure how to answer that.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the server. Please try again later.";
  }
};

export const summarizeReviews = async (reviews: Review[], productName: string): Promise<string> => {
  if (!process.env.API_KEY) return "AI services unavailable.";
  if (reviews.length === 0) return "No reviews to summarize.";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const reviewsText = reviews.map(r => `${r.rating}/5: ${r.comment}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following customer reviews for the product "${productName}" in 2-3 sentences. Highlight key pros and cons. \n\nReviews:\n${reviewsText}`,
    });

    return response.text || "Could not summarize reviews.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Unable to generate summary at this time.";
  }
};
