const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyAVxJe5yapi3ie-lR5K2mLFp4nguzd4_gI');

exports.scoobyAI = onRequest({ 
  cors: true,
  invoker: 'public'
}, async (req, res) => {
  try {
    const { data, action } = req.body;
    
    if (action === 'fetchNFHS') {
      const apiUrl = 'https://loadqa.ndapapi.com/v1/openapi';
      const params = new URLSearchParams({
        'API_Key': 'gAAAAABopWEBnlZtEwPQJum_wq3tqexKzdQPIJfdm1I500TVtTYIFDSow6E_plqu2OtI037uduxaOh-ydwX1goho5Opd1x2cs8H9th8MgxCtEm3gFelkeM6ue7kIsL_Eavct_5Pj7g07d5SW55uTQ-nXEV2IQJWFVh_GtLN67jnNB4GCTFYfLOQPawoYRqobbDVeEWv5w6Y0',
        'StateCode': "{'StateCode': 33}",
        'ind': 'I6822_7,I6822_8,I6822_9,I6822_10',
        'dim': 'Country,StateName,StateCode,DistrictName,DistrictCode,Year',
        'pageno': 1
      });
      
      const response = await fetch(`${apiUrl}?${params}`);
      const nfhsData = await response.json();
      
      res.json({ data: nfhsData.Data || [] });
      return;
    }
    
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