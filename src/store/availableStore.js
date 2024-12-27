
import {Store} from './store.js';

export class AvailableStore {

    lastAvailable = [];
    store;

    constructor() {
        this.store = new Store();
    }

    async init() {
        this.lastAvailable = await this.store.getEntry('lastAvailable');
        if(this.lastAvailable === null ) {
            await this.setLastAvailable([]);
        }
    }

    async setLastAvailable(available) {
        this.lastAvailable = available;
        await this.store.addEntry('lastAvailable',available);
    }

    getLastAvailable() {
        return this.lastAvailable;
    }

    shouldNotify(newAppointments) {

        if(this.lastAvailable === newAppointments) {
            return false;
        }

        if(this.lastAvailable.length === 0 && newAppointments.length === 0 ) {
            return false;
        }

        if(newAppointments.length === 0 && this.lastAvailable > 0 ) {
            return false;
        }

        if(this.lastAvailable.length > 0 && newAppointments.length > 0) {
            let diff = newAppointments.filter((slot) => {
                return !this.lastAvailable.includes(slot);
            });
            return diff.length > 0;
        }

        if(this.lastAvailable.length === 0 && newAppointments.length > 0){
            return true;
        }
    }
}