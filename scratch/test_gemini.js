const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');

async function check() {
  const apiKey = "AIzaSyDX45bUqtekK28kcNH1HeNsW5u6xDL_YrY";
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await resp.json();
    fs.writeFileSync('scratch/models_list.json', JSON.stringify(data, null, 2));
    console.log("Models list saved to scratch/models_list.json");
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

check();
