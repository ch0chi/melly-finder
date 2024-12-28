import { Bot } from "grammy";
import {AvailableStore} from "../store/availableStore.js";
import dotenv from 'dotenv';
dotenv.config();

export class TelegramBot {
    bot;
    chatId;
    availableStore;

    constructor() {
        this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.availableStore = new AvailableStore();
    }

    async init() {
        console.log("Starting Telegram Bot...");
        this.bot.start()
            .catch((err) => {
                console.log(err);
            });

        this.commands();
    }

    commands(){
        this.bot.command('appointments', async(ctx) => {
            let lastAvailable = await this.availableStore.getLastAvailable();
            let msg = "";
            if(lastAvailable.length > 0) {
                msg = `Here are all the available appointments from the last check:\n${this.formatMsg(lastAvailable)}`;
                await ctx.reply(msg);
            } else {
                await ctx.reply("No available appointments found." +
                    "I'll let you know as soon as I find something.");
            }
        });

        //todo
        this.bot.command('runs', async(ctx) => {
            await ctx.reply('10 runs');
        })
    }

    async sendMessage(msg) {
        await this.bot.api.sendMessage(this.chatId,msg)
            .catch((err) => {
                console.log(err);
            });
    }

    formatMsg(bookings) {
        let msg = "";
        for(const booking of bookings) {
            msg += `${booking}\n`;
        }
        return msg;
    }

    shouldNotify(newAppointments) {
        const lastAvailable = this.availableStore.getLastAvailable()
            .then((lastAvailable) => {
                return lastAvailable;
            })
            .catch((err) => {
                console.log(err);
            });

        if(lastAvailable === newAppointments) {
            return false;
        }

        if(lastAvailable.length === 0 && newAppointments.length === 0 ) {
            return false;
        }

        if(newAppointments.length === 0 && lastAvailable > 0 ) {
            return false;
        }

        if(lastAvailable.length > 0 && newAppointments.length > 0) {
            let diff = newAppointments.filter((slot) => {
                return !lastAvailable.includes(slot);
            });
            return diff.length > 0;
        }

        if(lastAvailable.length === 0 && newAppointments.length > 0){
            return true;
        }
    }
}