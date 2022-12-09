import dotenv from 'dotenv';
import { ChatGPTAPI } from 'chatgpt';
import { Client, GatewayIntentBits, REST, Routes, Partials, ChannelType, SlashCommandBuilder } from 'discord.js';
import OPENAI_SESSION from './openai_session.js';
import CHATGPT from './commands/chatgpt.js';

dotenv.config();

const MAX_RESPONSE_CHUNK_LENGTH = 1500;
const commands = [
    {
        name: 'chatgpt',
        description: 'Demandez n\'importe quoi, chatGPT est là !',
        options: [
            {
                type: 3,
                name: "question",
                description: "Your question",
                required: true,
            },
            
        ]
    }
];

async function initDiscordCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
};

async function main() {

    await initDiscordCommands();

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageTyping,
            GatewayIntentBits.MessageContent,
        ],
        partials: [Partials.Channel]
    });

    client.on('ready', () => {
        console.log('Ready!');
        console.log(`Logged in as ${client.user.tag}!`);
        console.log(new Date());
    });

    //askquestion
    //splitAndSendResponse

    client.on("interactionCreate", async interaction => {

        if (!interaction.isCommand()) return;

        if (interaction.commandName === "chatgpt") {
            const question = interaction.options.getString("question");

            interaction.reply({ content: "Je prépare ma réponse..." });

            try {
                CHATGPT.askQuestion(question, (content) => {
                    if(content.length >= MAX_RESPONSE_CHUNK_LENGTH){
                        interaction.editReply({ content:"Ma réponse est trop grande, je réponds en DM." });
                        CHATGPT.splitAndSendResponse(content,interaction.user);
                    }else{
                        interaction.editReply("```Question posée : " + question + "```\n" + content);
                    }
                })
            } catch (e) {
                console.error(e)
            }
        }

        

    });

    client.login(process.env.DISCORD_BOT_TOKEN);
};

main()