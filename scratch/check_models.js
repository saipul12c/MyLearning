const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("Error: NEXT_PUBLIC_GEMINI_API_KEY NOT FOUND in .env");
    return;
  }

  console.log("Checking available Gemini models for your API key...");
  
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await resp.json();
    
    if (data.error) {
      console.error("API Error:", data.error.message);
      return;
    }

    if (!data.models || data.models.length === 0) {
      console.log("No models found.");
      return;
    }

    console.log("\nAvailable Models:");
    console.log("-----------------");
    data.models.forEach(model => {
      const methods = model.supportedGenerationMethods || model.supportedMethods || [];
      console.log(`- ${model.name.replace('models/', '')} [Supports: ${methods.join(', ')}]`);
    });
    
    console.log("\nNote: Use these names in your gemini structure.");
  } catch (error) {
    console.error("Fetch Error:", error.message);
  }
}

listModels();
