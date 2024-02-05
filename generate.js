import { config } from 'dotenv';
import express from 'express';
import axios from 'axios';

config();
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(process.env.NODE)
});

app.get('/api/generate', async (req, res) => {
  let result;

  try {
    const input = decodeURIComponent(req.query.input);
    const histories = JSON.parse(decodeURIComponent(req.query.histories));
    const files = JSON.parse(decodeURIComponent(req.query.files));

    result = await generate(input, histories, files);
  } catch (error) {
    console.error('Error generating:', error);
    res.status(500).send('Error generating');
    return;
  }

  res.send({
    success: true,
    result: result
  });
});

async function generate(input, histories, files) {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`;

    let messages = [];

    // File content
    let fileContent = "";
    if (files) {
      for (const f of files) {
        fileContent += "File url: " + f.file + "\n" + "File content: " + f.text + "\n\n";
      }
    }

    // Histories messages
    if (histories) {
      for (const h of histories) {
        if (h.input && h.output) {
          messages.push({
            role: 'user',
            content: h.input
          });
          messages.push({
            role: 'assistant',
            content: h.output
          });
        }
      }
    }

    // User message and file content
    messages.push({
      role: 'user',
      content: input + "\n\n"
             + fileContent
    });

    // Make the request
    const headers = {
        'Content-Type': 'application/json'
    };
    try {
      console.log("Input:\n" + JSON.stringify(messages));
      const response = await axios.post(url, { messages }, { headers });

      console.log("Output:\n" + JSON.stringify(response.data));
      return response.data.result;
    } catch (error) {
      console.error('Error making the request:', error);
    }
  }
}

async function getAccessToken() {
  const url = 'https://aip.baidubce.com/oauth/2.0/token';
  const params = {
    grant_type: 'client_credentials',
    client_id: process.env.API_KEY,
    client_secret: process.env.SECRET_KEY
  };

  try {
    const response = await axios.post(url, null, { params });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});