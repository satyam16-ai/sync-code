const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI('AIzaSyAX66yQ9skQNCwbZ4rp5dc3NoCsUirax80'); // Replace with your Google Generative AI API key
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.post('/chat', async (req, res) => {
    const message = req.body.message;

    try {
        console.log('Received message:', message);
        const result = await model.generateContent(message);
        console.log('Response from Gemini:', result.response.text());
        res.json({ reply: result.response.text() });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
});