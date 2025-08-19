const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyAVxJe5yapi3ie-lR5K2mLFp4nguzd4_gI');

exports.scoobyAI = onRequest({ 
  cors: true,
  invoker: 'public'
}, async (req, res) => {
  try {
    const { data } = req.body;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are Scooby AI. Answer in simple, easy words. Keep it short.

Query: ${data}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    res.json({ result: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});