const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const Base_Url = "http://192.168.1.29:8080/v1"; 
const base_model = "Qwen2.5 7B Instruct 1M";    

const client = new OpenAI({
  apiKey: "", 
});

async function BraveSearch(query) {
  const apiKey = "BSAvcFxiUOto_jMXtV9NPJ5bI2wRKxK";
  const url = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=5`;

  const response = await fetch(url, {
    headers: { "X-Subscription-Token": apiKey }
  });

  const data = await response.json();
  return data.results ?? [];
}

async function scrapeContent(url) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await response.text();
    const $ = cheerio.load(html);

    const extract = tag => $(tag).map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0);
    return {
      url,
      h2: extract("h2").slice(0, 3),
      h3: extract("h3").slice(0, 3),
      h4: extract("h4").slice(0, 3),
      p: extract("p").slice(0, 5)
    };
  } catch (e) {
    console.error(`${url} alınamadı: ${e.message}`);
    return null;
  }
}

async function readPrompt() {
  try {
    return await fs.readFile("WebChatPrompt.txt", { encoding: "utf8" });
  } catch (err) {
    return "Sen bir haber analiz uzmanısın. Her haberin içeriğini yorumla, sağcı ve solcu eğilim oranlarını belirt. Örneğin: Sağcı: %70, Solcu: %30.";
  }
}

function extractOranFromReply(reply) {
  const sagMatch = reply.match(/Sağ(cı)?[:\s]*%?(\d+)/i);
  const solMatch = reply.match(/Sol(cu)?[:\s]*%?(\d+)/i);
  const sag = sagMatch ? parseInt(sagMatch[2]) / 100 : 0;
  const sol = solMatch ? parseInt(solMatch[2]) / 100 : 0;
  return { sag, sol };
}


app.post('/api/gonder', async (req, res) => {
  const query = req.body.query;
  const urls = await BraveSearch(query);

  const rawHaberler = [];

  for (const url of urls) {
    const content = await scrapeContent(url.url);
    if (content) {
      let full = [...content.h2, ...content.h3, ...content.h4].join('\n') + '\n\n' + content.p.join('\n');
      rawHaberler.push({ url: content.url, content: full });
    }
  }

  const systemPrompt = await readPrompt();
  const analizler = [];

  for (const haber of rawHaberler) {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: haber.content }
    ];

    try {
      const completion = await client.chat.completions.create({
        model: base_model,
        messages
      }, { defaultBaseURL: Base_Url });
      console.log(completion);
      const reply = completion.choices[0].message.content;
      const oran = extractOranFromReply(reply);

      analizler.push({
        url: haber.url,
        summary: reply,
        ...oran
      });
    } catch (err) {
      console.error(`Hata oluştu: ${haber.url}`, err.message);
    }
  }

  res.json({ analizler });
});

app.listen(3001, () => {
  console.log("Backend http://localhost:3001 çalışıyor");
});
