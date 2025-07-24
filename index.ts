import OpenAI from 'openai';
import { generateUserMessage } from './BraveSearchAPI2';
const fs = require("node:fs/promises");

const Base_Url= "http://192.168.1.29:8080/v1";
const base_model = 'Qwen3 8B';


type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const ChatHistory: Message[] = [];

const client = new OpenAI({
  apiKey: "", 
});

async function readJSONFile(WebChatPrompt : string) {
  try {
    const data = await fs.readFile(WebChatPrompt, {encoding: "utf8"});
    return data;
  } catch (error) {
    console.error(`Error reading ${WebChatPrompt}: ${error}`);
    return [];
  }
}
async function main() {
  console.log("Welcome to AI WEB CHAT!")
  const systemPrompt = await readJSONFile("WebChatPrompt.txt");
  const systemMessage : Message = {
    role : "system",
    content : systemPrompt
  };

  const userInput = await generateUserMessage();
    const userMessage : Message = {
        role : 'user',
        content : JSON.stringify(userInput) 
    };
    ChatHistory.push(systemMessage);
    ChatHistory.push(userMessage);
    const completion = await client.chat.completions.create({
    model: base_model,
    messages: ChatHistory,
    }, {defaultBaseURL:Base_Url});

    const reply = completion.choices[0].message.content as string

    const aiReply : Message = {
        role: "assistant",
        content: reply
    };

    ChatHistory.push(aiReply);

    console.log("AI: ", reply);
}

main().then(() => {})
