import * as cheerio from 'cheerio';
import axios from "axios";
import {Store} from "./store/store.js";

export class MellyFinder {
    url = 'https://melanzana.com/wp-admin/admin-ajax.php';
    store;
    nonce;
    nonceTries = 0;

    constructor() {
        this.store = new Store();
    }

    updateNonceTries() {
        this.nonceTries = this.nonceTries++;
    }

    getNonceTries() {
        return this.nonceTries;
    }

    async getNonce() {
        return await this.store.getEntry('nonce')
    }

    async fetchNonce() {
        try {
            console.log("Fetching nonce from site...");
            const $ = await cheerio.fromURL('https://melanzana.com/book-an-appointment');
            const bookedFunctions = $('#booked-functions-js-extra').text();
            const nonceMatch = bookedFunctions.match(/"nonce":"([a-f0-9]+)"/);
            if(nonceMatch && nonceMatch[1]){
                const nonce = nonceMatch[1];
                await this.store.addEntry('nonce',nonce);
                return nonce;
            } else {
                return null;//todo maybe throw an error?
            }
        }
        catch(e) {
            console.log(e);
        }
    }

    async fetchMonthlyAppointments(month) {
        const {data} = await axios.post(this.url, {
            action:'booked_calendar_month',
            gotoMonth:month,
            force_default:month,
            nonce: await this.getNonce()
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if(data && data.includes('Required "nonce" value is not here, please let the developer know.')){
            console.log("nonce was invalid or wasn't found");

            if(this.getNonceTries() === 5) {
                console.log("Exceeded nonce tries. Shutting app down.")
                process.exit();
            }

            this.updateNonceTries();
            await this.fetchNonce();
            console.log("Retrying fetchMonthlyAppointments...");
            return await this.fetchMonthlyAppointments(month);
        }

        let appointments = [];
        const $ = cheerio.load(data,null,false);
        let rows = $('.bc-row.week');
        for(let i = 0; i <rows.length;i++) {
            let cols = $(rows[i]).find('.bc-col');
            for (let j = 0; j < cols.length; j++) {
                let date = $(cols[j]).attr('data-date');
                let available = $(cols[j]).find('.date').attr('title') ?? null;
                appointments.push({date:date, slots:available});
            }
        }
        return await this.getAvailableAppointments(appointments);
    }

    async fetchDailySlots(date) {
        try {
            const {data} = await axios.post(this.url, {
                action:'booked_calendar_date',
                date:date,
                calendar_id:"0",
                nonce: await this.getNonce()
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if(data && data.includes('Required "nonce" value is not here, please let the developer know.')){
                await this.fetchNonce();
            }
            return data;
        } catch(err) {
            console.log(err);
        }
    }

    async getAvailableAppointments(appointments) {
        let available = [];
        for (const appointment of appointments) {
            if(appointment.slots) {
                let slots= appointment.slots.trim();
                let slotsArr = slots.split(' ');
                let numOfSlots = +slotsArr[0];
                if(numOfSlots === 1) {
                    let hasTimeSlot = await this.checkIfAppointmentHasTimeSlot(appointment);
                    if(hasTimeSlot) {
                        available.push(`${appointment.date} - ${appointment.slots}`);
                    }
                } else{
                    available.push(`${appointment.date} - ${appointment.slots}`);
                }
            }
        }
        return available;
    }

    async checkIfAppointmentHasTimeSlot(appointment) {
        let dailySlots = await this.fetchDailySlots(appointment.date);
        const $ = cheerio.load(dailySlots);
        const slotText = $('.booked-appt-list').find('p').text();
        return !(slotText && slotText.includes('There are no appointment time slots available for this day.'));
    }


}


