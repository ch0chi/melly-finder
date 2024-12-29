import { Bot } from "grammy";
import {AvailableStore} from "../store/availableStore.js";
import dotenv from 'dotenv';
dotenv.config();

export class TelegramBot {
    bot;
    chatId;
    availableStore;
    stats = {};

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

    setStats(stats) {
        this.stats = stats;
    }

    getStats() {
        return this.stats;
    }

    commands(){
        this.bot.command('appointments', async(ctx) => {
            let lastAvailable = await this.availableStore.getLastAvailable();
            let msg = "";
            if(lastAvailable.length > 0) {
                msg = `Here are all the available appointments from the last check:\n${this.formatMsg(lastAvailable)}`;
                await ctx.reply(msg);
            } else {
                await ctx.reply("No available appointments found. " +
                    "I'll let you know as soon as I find something.");
            }
        });

        this.bot.command('stats', async(ctx) => {
            let stats = this.getStats();
            let msg = "";
            for(let key in stats) {
                msg += `${key}: ${stats[key]}\n`;
            }
            await ctx.reply(`Current Stats:\n${msg}`);
        });

        this.bot.command('changeMonth', async(ctx) => {
            let month = ctx.message.text.split(' ')[1];
            if(month) {
                process.env.MONTH = month;
                let currentStats = this.getStats();
                currentStats.month = month;
                this.setStats(currentStats);
                await this.availableStore.setLastAvailable([]);
                let msg = "Month set to " + month + "." + " I'll start checking for appointments for that month, and I will notify you if I find any.\n\n" +
                    "You can always check the available appointments by typing /appointments";
                await ctx.reply(msg);
            } else {
                await ctx.reply("Please enter a valid month");
            }
        });
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

    async shouldNotify(newAppointments) {
        let lastAvailable = await this.availableStore.getLastAvailable();

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
