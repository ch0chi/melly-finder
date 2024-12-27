import {readFile,writeFile,truncate} from 'fs/promises';
import {resolve} from 'node:path';

export class Store {

    filePath = resolve('./store.json');

    async getStore() {
        try{
            let data  = await readFile(this.filePath,{ encoding: 'utf8' });
            if(data.length === 0) {
                return {};//maybe?
            }
            return JSON.parse(data);
        } catch (err) {
            if(err.code === 'ENOENT') {
                try {
                    await writeFile(this.filePath,'{}');
                    return {};
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

    async getEntry(key) {
        try {
            let data = await this.getStore();
            if(key in data){
                return data[key];
            } else {
                return null;
            }
        } catch (err) {
            console.log(err);
        }
    }

    async addEntry(key,value) {
        try{
            let data = await this.getStore();
            data[key] = value
            data = JSON.stringify(data);
            await writeFile(this.filePath,data);
        } catch(err) {
            console.log(err);
        }
    }

    async removeEntry(key) {
        try {
            let data = await this.getStore();
            if(data[key]){
                delete data[key];
            }
            data = JSON.stringify(data);
            await writeFile(this.filePath,data);
        } catch(err) {
            console.log(err);
        }
    }

    async clearStore() {
        try {
            await truncate(this.filePath);
        } catch (err) {
            console.log(err);
        }
    }
}