import {MellyFinder} from "./mellyFinder.js";
import dotenv from 'dotenv';

dotenv.config();
import {AvailableStore} from "./store/availableStore.js";
import {TelegramBot} from "./notification/TelegramBot.js";
import {IntervalManager} from "./intervalManager.js";

const mellyFinder = new MellyFinder();
const availableStore = new AvailableStore();


let intervalTime = process.env.FETCH_INTERVAL;
let totalIntervalCount = 0;


const getMonth = () => {
    let month = process.env.MONTH;
    if (!month) {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-01`;
    }
    month += '-01';
    return month.toString();
}

const fetchAppointments = async () => {
    let available = await mellyFinder.fetchMonthlyAppointments(getMonth());
    if (available.error) {
        await bot.sendError(available.error);
    }
    let shouldNotify = await bot.shouldNotify(available);
    if (shouldNotify) {
        console.log(`Found available booking dates!`);
        await bot.sendMessage(bot.formatBookings(available));
    }
    await availableStore.setLastAvailable(available);

    totalIntervalCount++;
}

const intervalManager = new IntervalManager(fetchAppointments, intervalTime);
const bot = new TelegramBot(intervalManager);

const init = async () => {
    console.log("Starting...");
    console.log(`Fetch Interval set to ${intervalManager.getIntervalTime()} minutes`);
    await bot.init();

    // Check for appointments immediately
    await availableStore.init();
    await fetchAppointments();
    intervalManager.start();

    bot.setStats({
        status: intervalManager.getStatus(),
        totalChecks: totalIntervalCount,
        month: getMonth(),
        intervalTime:intervalManager.getIntervalTime()
    });
}

await bot.sendMessage(`Started Melly Finder!`);

await init()
    .catch(async (err) => {
        console.log(err);
        await bot.sendMessage(`There was an error fetching booking dates and the app has quit running. Error :${err}`);
        stop();
    });
