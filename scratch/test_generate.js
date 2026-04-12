const { GoogleGenAI } = require("@google/genai");

async function testResponse() {
  const apiKey = "AIzaSyDX45bUqtekK28kcNH1HeNsW5u6xDL_YrY";
  const client = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

  try {
    console.log("Testing generateContent with gemini-flash-latest...");
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: "Halo, siapa Anda?" }] }]
    });
    console.log("Response:", response.text);
  } catch (error) {
    console.error("Test failed:");
    console.error(JSON.stringify(error, null, 2));
  }
}

testResponse();
