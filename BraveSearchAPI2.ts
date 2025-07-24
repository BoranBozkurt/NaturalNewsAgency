import * as cheerio from "cheerio";
import * as readline from "readline";
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function BraveSearch(query:string): Promise<string> {
const apiKey: string = 'BSAvcFxiUOto_jMXtV9NPJ5bI2wRKxK'; 
const url: string = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=5`;

  try {
    const response: Response = await fetch(url, {
      method: 'GET',
      headers: {
        // "Accept": "application/json",
        "X-Subscription-Token": apiKey
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP Hatası: ${response.status}`);
    }

    const data: any = await response.json();
    const results = data.results ?? [];
    return results;
  } catch (error: any) {
    console.error('Hata:', error.message);
  }
}

async function scrapeContent(url: string) {
  
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const extract = (tag: string): string[] =>
      $(tag)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(text => text.length > 0);

    return {
      url,
      h2: extract("h2").slice(0, 3),
      h3: extract("h3").slice(0, 3),
      h4: extract("h4").slice(0, 3),
      p: extract("p").slice(0, 5)
    };
  } catch (err: any) {
    console.error(`${url} alınamadı:`, err.message);
    return null;
  }
}

export async function generateUserMessage() {
while(true){

  const query = await prompt(" Aramak istediğiniz kelime nedir? ");
  const urls = await BraveSearch(query);

if (query.toLowerCase() === 'çık') {
      console.log("Güle güle!");
      rl.close();
      break;
    }
  console.log(urls);
  const allUsrMessages = new Array();

 console.log("Brave Search URL’leri:", urls);

  if (urls.length === 0) return;

  for (const url of urls) {
    const content = await scrapeContent(url.url);
    if (content) {
        
      let totalNewsMessage = "";
      for(const eachContent of content.h2)
        {
            totalNewsMessage += eachContent + '\n';
        }
    for(const eachContent of content.h3)
        {
            totalNewsMessage += eachContent + '\n';
        }
    for(const eachContent of content.h4)
        {
            totalNewsMessage += eachContent + '\n';
        }
        totalNewsMessage += "\n\n";
    for(const eachContent of content.p)
        {
            totalNewsMessage += eachContent + '\n';
        }
      const usrMessage = {
        "url" : content.url,
        "content" : totalNewsMessage
      };
      allUsrMessages.push(usrMessage);
    }
  }
}}

generateUserMessage().then(() => {})