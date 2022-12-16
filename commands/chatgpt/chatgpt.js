import dotenv from 'dotenv';
import { ChatGPTAPI, ChatGPTAPIBrowser, getOpenAIAuth } from 'chatgpt';

dotenv.config();

const MAX_RESPONSE_CHUNK_LENGTH = 1500;

async function setupOpenAISession(){
    const api = new ChatGPTAPIBrowser({
        email : process.env.OPENAI_EMAIL,
        password : process.env.OPENAI_PASSWORD,
    })

    await api.init();

    return api;
};

function askQuestion(api, question, cb,opts={}) {
  let tmr = setTimeout(() => {
      cb("Oppss, something went wrong! (Timeout)");
  }, 150000);

  api.sendMessage(question,opts).then((response) => {
      clearTimeout(tmr);
      cb(response);
  }).catch(() => {
      cb("Oppss, something went wrong! (Error)");
  })
}

async function splitAndSendResponse(resp,interaction){
  while(resp.length > 0){
      let end = Math.min(MAX_RESPONSE_CHUNK_LENGTH,resp.length);
      await interaction.channel.send(resp.slice(0,end));
      resp = resp.slice(end,resp.length);
  }
}

export default {
    setupOpenAISession,
    askQuestion,
    splitAndSendResponse
};