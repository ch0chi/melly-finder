import {MellyFinder} from "./MellyFinder.js";
import dotenv from 'dotenv';
dotenv.config();
import {IncomingWebhook} from "@slack/webhook";


const mellyFinder = new MellyFinder();

let slackWebhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
let intervalTime = process.env.FETCH_INTERVAL;
let syncInterval;

const getMonth = () => {
    let month = process.env.MONTH;
    if(!month) {
        const date = new Date();
        return`${date.getFullYear()}-${date.getMonth()+1}-01}`;
    }
    return month.toString();
}

const notifySlack = async (message,important = false) => {
    let text = `${message}`;
    if(important) {
        text = `<!channel> ${message}`;
    }
    await slackWebhook.send({
        "text": `${text}`
    })
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
    let nonce = await mellyFinder.getNonce();
    if(nonce === null){
        let fetched = await mellyFinder.fetchNonce();
        if(fetched === null) {
            await notifySlack(`There was an error fetching the nonce and the app has quit running`,true);
        }
    }

    //check for appointments immediately
    let appointments = await mellyFinder.fetchMonthlyAppointments(getMonth());
    let available = await mellyFinder.getAvailableAppointments(appointments);

    if(available.length > 0) {
        let msg = "";
        for(let slot of available) {
            msg += `\n${slot}\n`;
        }
        await notifySlack(`${msg}`,true);
    }

    syncInterval = setInterval(async () => {
        let appointments = await mellyFinder.fetchMonthlyAppointments(getMonth());
        let available = await mellyFinder.getAvailableAppointments(appointments);

        if(available.length > 0) {
            let msg = "";
            for(let slot of available) {
                msg += `${slot}\n`;
            }
            await notifySlack(`\n${msg}`,true);
        }

        intervalCount++;
        totalIntervalCount++;

        if(intervalCount === 12) {
            await notifySlack(
                `Finder still running and no new booking dates have been found.
                There have been ${totalIntervalCount} booking date checks since starting.`
            )
            intervalCount = 0;
        }
    },parseInt(getIntervalTime())*60000);
}

await notifySlack(`Started Melly Finder!`, true);

let intervalCount = 0;
let totalIntervalCount = 0;

await init()
.catch(async (err) => {
    console.log(err);
    await notifySlack( `There was an error fetching booking dates and the app has quit running. Error :${err}`,
        true)
    stop();
});