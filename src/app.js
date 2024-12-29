import {MellyFinder} from "./mellyFinder.js";
import dotenv from 'dotenv';

dotenv.config();
import {AvailableStore} from "./store/availableStore.js";
import {TelegramBot} from "./notification/TelegramBot.js";

const mellyFinder = new MellyFinder();
const availableStore = new AvailableStore();
const telegramBot = new TelegramBot();

let intervalTime = process.env.FETCH_INTERVAL;
let syncInterval;

const getMonth = () => {
    let month = process.env.MONTH;
    if (!month) {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-01`;
    }
    return month.toString();
}

const setIntervalTime = (time) => {
    intervalTime = time;
}

const getIntervalTime = () => {
    return intervalTime;
}

const stop = () => {
    clearInterval(syncInterval);
}


const init = async () => {
    console.log("Starting...");
    console.log(`Fetch Interval set to ${getIntervalTime()} minutes`);
    await telegramBot.init();
    telegramBot.setStats({status:'running',totalChecks:0,month:getMonth()});

    //check for appointments immediately
    let available = await mellyFinder.fetchMonthlyAppointments(getMonth());
    await availableStore.init();

    if (available.length > 0) {
        console.log(`Found available booking dates!`);
        await telegramBot.sendMessage(telegramBot.formatMsg(available));

    } else {
        await telegramBot.sendMessage("No available appointments found. " +
            "I'll let you know as soon as I find something.")
    }
    await availableStore.setLastAvailable(available);

    syncInterval = setInterval(async () => {

        let available = await mellyFinder.fetchMonthlyAppointments(getMonth());
        let shouldNotify = await telegramBot.shouldNotify(available);
        if (shouldNotify) {
            console.log(`Found available booking dates!`);
            await telegramBot.sendMessage(telegramBot.formatMsg(available));
        }
        await availableStore.setLastAvailable(available);

        totalIntervalCount++;
        telegramBot.setStats({status:'running',totalChecks:totalIntervalCount,month:getMonth()});

    }, parseInt(getIntervalTime()) * 60000);
}

await telegramBot.sendMessage(`Started Melly Finder!`);

let totalIntervalCount = 0;

await init()
    .catch(async (err) => {
        console.log(err);
        await telegramBot.sendMessage(`There was an error fetching booking dates and the app has quit running. Error :${err}`);
        stop();
    });
