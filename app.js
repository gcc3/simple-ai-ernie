import { config } from 'dotenv';
import express from 'express';
import axios from 'axios';

config();
const app = express();

app.get('/api/generate', async (req, res) => {
  let response;

  try {
    const input = decodeURIComponent(req.query.input);
    const histories = decodeURIComponent(req.query.histories);
    const files = decodeURIComponent(req.query.files);

    response = await generate(input, JSON.parse(histories), JSON.parse(files));
  } catch (error) {
    console.error('Error generating:', error);
    res.status(500).send('Error generating');
    return;
  }

  if (response.status === 'failed') {
    res.status(500).send({
      success: false,
      error: response.error,
    });
    return;
  }

  const text = response.result;
  res.send({
    success: true,
    result: text
  });
});

app.get('/', (req, res) => {
  res.send(process.env.NODE)
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function generate(input, histories, files) {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`;

    // Files
    if (files) {
      for (const f of files) {
        messages.push({
          role: 'user',
          content: f.text
        });
      }
    }

    // Histories
    let messages = [];
    if (histories) {
      for (const h of histories) {
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

    // User
    messages.push({
      role: 'user',
      content: input
    });

    // Make the request
    const headers = {
        'Content-Type': 'application/json'
    };
    try {
      console.log("Input:");
      console.log(JSON.stringify(messages));
      const response = await axios.post(url, { messages }, { headers });

      console.log("Output:");
      console.log(response.data);
      return response.data;
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
