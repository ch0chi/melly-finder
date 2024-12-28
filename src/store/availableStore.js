
import {Store} from './store.js';

export class AvailableStore {

    store;

    constructor() {
        this.store = new Store();
    }

    async init() {
        let lastAvailable = await this.store.getEntry('lastAvailable');
        if(lastAvailable === null ) {
            await this.setLastAvailable([]);
        }
    }

    async setLastAvailable(available) {
        await this.store.addEntry('lastAvailable',available);
    }

    async getLastAvailable() {
        return await this.store.getEntry('lastAvailable');
    }
}