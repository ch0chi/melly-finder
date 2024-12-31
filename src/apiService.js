import axios from "axios";

export class ApiService {

    api;
    constructor() {
        this.api = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        this.api.interceptors.response.use(
            (res) => this.responseInterceptor(res),
            (err) => this.errorInterceptor(err));
    }

    responseInterceptor(res) {
        let data = res;
        if(res && typeof res.data !== 'undefined'){
            data = res.data;
        }
        return data;
    }

    errorInterceptor(err) {
        let errData = [];
        if(err.response) {
            errData.push(err.response.data);
            errData.push(err.response.status);
            errData.push(err.response.headers);
        } else if (err.request) {
            errData.push("The request was made but no response was received");
            errData.push(err.request);
        } else {
            errData.push('Error', err.message);
        }
        console.log(errData);
        return Promise.reject(err);
    }

    processError(error) {
        if (error.response
            && error.response.data
            && error.response.data.error
        ) {
            error.message = error.response.data.error;
        }
        return error;
    }

    errorMessage(error) {
        return this.processError(error).message;
    }

    async get(url) {
        return await this.api.get(url);
    }

    async post(url,data = {},options = {}) {
        return await this.api.post(url,data,options);
    }
}