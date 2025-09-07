import {Bot, GrammyError, HttpError} from "grammy";
import {AvailableStore} from "../store/availableStore.js";
import dotenv from 'dotenv';
dotenv.config();
import {Scraper} from "../scraper.js";

export class TelegramBot {
    bot;
    chatId;
    availableStore;
    stats = {};
    intervalManager;

    constructor(intervalManager) {
        this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.availableStore = new AvailableStore();
        this.intervalManager = intervalManager;
    }

    async init() {
        console.log("Starting Telegram Bot...");
        this.bot.start() .catch((err) => {
            console.log(err);
        });
        this.bot.catch((err) => {
            const ctx = err.ctx;
            console.error(`Error while handling update ${ctx.update.update_id}:`);
            const e = err;
            if (e instanceof GrammyError) {
                console.error("Error in request:", e.description);
            } else if (e instanceof HttpError) {
                console.error("Could not contact Telegram:", e);
            } else {
                console.error("Unknown error:", e);
            }
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

        this.bot.command('help', async(ctx) => {
            let msg = "Available commands:\n" +
                "/help - Show this message\n" +
                "/start - Restart the bot\n" +
                "/stop - Stop the bot\n" +
                "/appointments - Check the available appointments\n" +
                "/stats - Get the current scraper statistics\n" +
                "/changemonth [month YYYY-MM] - Change the month to check for appointments. Example: /changemonth 2025-09\n" +
                "/changeinterval [minutes] - Change the interval to check for appointments. Example: /changeinterval 5\n" +
                "/checkdate [day YYYY-MM-DD] - Check if a specific date has appointments. Example: /checkdate 2025-01-26\n" +
                "/checkmonth [month YYYY-M] - Checks for both public and hidden appointments. Example: /checkmonth 2025-1";
            await this.reply(ctx,msg);
        });

        this.bot.command('start', async(ctx) => {
            this.intervalManager.start();
            let stats = this.getStats();
            stats.status = this.intervalManager.getStatus();
            this.setStats(stats);
            await this.reply(ctx,'Started Melly Finder!');
        });

        this.bot.command('stop', async(ctx) => {
            this.intervalManager.stop();
            let stats = this.getStats();
            stats.status = this.intervalManager.getStatus();
            this.setStats(stats);
            await this.reply(ctx,'Stopped Melly Finder! You can start it again by typing /start');
        });

        this.bot.command('appointments', async(ctx) => {
            let lastAvailable = await this.availableStore.getLastAvailable();
            let msg = "";
            if(lastAvailable.length > 0) {
                msg = `Here are all the available appointments from the last check:\n${this.formatBookings(lastAvailable)}`;
                await this.reply(ctx,msg);
            } else {
                await this.reply(ctx,"No available appointments found. " +
                    "I'll let you know as soon as I find something.");
            }
        });

        this.bot.command('changeinterval', async (ctx) => {
            let interval = ctx.message.text.split(' ')[1];
            if (interval) {
                this.intervalManager.setIntervalTime(parseInt(interval));
                let stats = this.getStats();
                stats.status = this.intervalManager.getStatus();
                stats.intervalTime = this.intervalManager.getIntervalTime();
                this.setStats(stats);
                await this.reply(ctx,`Interval set to ${interval} minutes.`);
            } else {
                await this.reply(ctx,"Please enter a valid interval");
            }
        });

        this.bot.command('stats', async(ctx) => {
            let stats = this.getStats();
            let msg = "";
            if(Object.keys(stats).length !== 0) {
                for(let key in stats) {
                    msg += `${key}: ${stats[key]}\n`;
                }
            } else {
                msg = "Starting up...";
            }


            await this.reply(ctx,`Current Stats:\n${msg}`);
        });

        this.bot.command('changemonth', async(ctx) => {
            let month = ctx.message.text.split(' ')[1];
            month = month.match(/\d{4}-\d{2}/);
            month = month ? month[0] : null;

            if(month) {
                process.env.MONTH = month;
                let currentStats = this.getStats();
                currentStats.month = month;
                this.setStats(currentStats);
                await this.availableStore.setLastAvailable([]);
                let msg = "Month set to " + month + "." + " I'll start checking for appointments for that month, and I will notify you if I find any.\n\n" +
                    "You can always check the available appointments by typing /appointments";
                await this.reply(ctx,msg);
            } else {
                await this.reply(ctx,"Please enter a valid month in the format of YYYY-MM");
            }
        });

        this.bot.command('checkdate', async(ctx) => {
            let date = ctx.message.text.split(' ')[1];
            //check if date in the format of YYYY-MM-DD or YYYY-MM-D
            if (date && date.match(/^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/)) {
                let scraper = new Scraper();
                let appointments = await scraper.getAppointmentsByDate(date);
                if(appointments.slots !== null) {
                    await this.reply(ctx,this.formatDailyBookings([appointments]));
                } else {
                    await this.reply(ctx,`No available appointments for ${date}`);
                }
            } else {
                await this.reply(ctx,"Please enter a valid date in the format of YYYY-MM-DD or YYYY-MM-D");
            }
        });

        this.bot.command('checkmonth', async(ctx) => {
            let date = ctx.message.text.split(' ')[1];
            if(date && date.match(/^\d{4}-(0?[1-9]|1[0-2])$/)) {
                let scraper = new Scraper();
                date = date.split('-');
                let year = date[0];
                let month = date[1];
                let appointments = await scraper.getDailyAppointmentsForMonth(year,month);
                let msg = "No available appointments found.";
                if(appointments.length > 0) {
                    msg = this.formatDailyBookings(appointments);
                }

                await this.reply(ctx,msg);
            } else {
                await this.reply(ctx,"Please enter a valid date in the format of YYYY-MM or YYYY-M");
            }

        });
    }

    async sendMessage(msg,options = {}) {
        await this.bot.api.sendMessage(this.chatId,msg,options)
            .catch((err) => {
                console.log(err);
            });
    }

    async reply(ctx,msg) {
        if(msg.length > 4096) {
            let chunks = this.chunkLongMsg(msg,4096);
            for(const parts of chunks) {
                await ctx.reply(parts);
            }
        } else {
            await ctx.reply(msg);
        }
    }

    chunkLongMsg (str, size) {
        return Array.from({ length: Math.ceil(str.length / size) }, (v, i) =>
            str.slice(i * size, i * size + size))
    }


    async sendError(error) {
        let msg = "An error occurred:\n```\n" + error + "```";
        await this.sendMessage(msg,{parse_mode:"MarkdownV2"});
    }



    formatBookings(bookings) {
        let msg = "";

        if(Array.isArray(bookings)) {
            for(const booking of bookings) {
                msg += `${booking.date}\n`;
            }

        } else {
            msg = bookings;
        }

        return msg;
    }

    formatDailyBookings(bookings) {
        let msg = "";
        for(const booking of bookings) {
            let slots = booking.slots;
            if(slots === null) {//todo is this still needed?
                continue;
            }
            if(booking.slots.length > 1 ) {
                slots = booking.slots.map((slot,idx) => {
                    if(idx > 0) {
                        return ' ' + slot;
                    }
                    return slot;
                });
            }
            msg += `\n${booking.day}\n${slots}\n`;
        }
        return msg
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
