import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const isGeminiConfigured = !!apiKey;
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function askGemini(prompt) {
    if (!genAI) {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
    // Using gemini-2.5-flash as it is fast and capable
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function continueDocWriting(context) {
    if (!genAI) throw new Error("Gemini API key is missing.");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Given the following document text, continue writing the next paragraph that naturally flows from it. Do not include introductory text, just provide the continuation.\n\nContext:\n${context}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function summarizeDocText(text) {
    if (!genAI) throw new Error("Gemini API key is missing.");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Please summarize the following text concisely:\n\n${text}\n\nSummary:`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}
