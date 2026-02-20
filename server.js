import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/generate', async (req, res) => {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === 'your_api_key_here') {
          return res.status(500).json({ error: 'GROQ_API_KEY is not set in the .env file.' });
        }

        const groq = new Groq({ apiKey });

        const { name, course, uni, skills, interests, exp, bioType, tone } = req.body;
        
        const prompt = `You are BioCraft, an expert bio writer for university students. Write a polished, professional bio.

Details:
- Name: ${name}
- Course/Major: ${course}
${uni ? `- University: ${uni}` : ''}
- Key Skills: ${skills}
- Career Interests: ${interests}
${exp ? `- Experience: ${exp}` : ''}
- Tone: ${tone}
- Bio Type: ${bioType}

Requirements:
- Write in third person
- LinkedIn Bio: 3-4 sentences. CV Summary: 4-5 sentences. Personal Statement: 5-7 sentences.
- Match the ${tone.toLowerCase()} tone exactly
- Highlight skills and interests naturally
- End with a forward-looking statement about goals
- Output ONLY the bio text. No quotes, no labels, no markdown, no extra formatting.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500,
        });

        res.json({ bio: chatCompletion.choices[0]?.message?.content || '' });
    } catch (error) {
        console.error('Error generating bio:', error);
        res.status(500).json({ error: 'Failed to generate bio. Please try again later.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
