import dotenv from 'dotenv-safe';
import { ChatGPTAPI } from 'chatgpt';
import OPENAI_SESSION from './openai_session.js';

dotenv.config();

const MAX_RESPONSE_CHUNK_LENGTH = 1500;

const chatGTP = await initChatGPT().catch(e=>{
  console.error(e)
  process.exit()
});

async function initChatGPT() {
  let sessionToken;
  let counter = 10;
  while (counter>0) {
      try {
          sessionToken = await OPENAI_SESSION.getSession(process.env.OPENAI_EMAIL, process.env.OPENAI_PASSWORD);
          break
      } catch (e) {
          console.error("initChatGPT ERROR : " + e);
          counter--;
      }
  }

  if(counter==0){
      throw "Invalid Auth Info!";
  }

  let api = new ChatGPTAPI({ 
        sessionToken : process.env.SESSION_TOKEN,
        clearanceToken : process.env.CLEARANCE_TOKEN,
        userAgent : '',
   });

  await api.ensureAuth();

  async function updateSessionToken(){
      try {
          let sessionToken = await OPENAI_SESSION.getSession(process.env.OPENAI_EMAIL, process.env.OPENAI_PASSWORD);
          let new_api = new ChatGPTAPI({ sessionToken });

          await new_api.ensureAuth();

          api = new_api;
          console.log("Session Token Changed - ", new Date());
      } catch (e) {
          console.error(e);
      }finally{
          setTimeout(updateSessionToken,600000);
      }
  }
  setTimeout(updateSessionToken,600000);

  return {
      sendMessage: (message, opts = {}) => {
          return api.sendMessage(message, opts);
      }
  };
};

function askQuestion(question, cb,opts={}) {
  let tmr = setTimeout(() => {
      cb("Oppss, something went wrong! (Timeout)");
  }, 150000);

  chatGTP.sendMessage(question,opts).then((response) => {
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
  initChatGPT,
  askQuestion,
  splitAndSendResponse
};