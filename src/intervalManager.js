export class IntervalManager {

    constructor(callback, intervalTime) {
        this.callback = callback;
        this.intervalTime = intervalTime;
        this.intervalId = null;
        this.status = 'stopped';
    }

    getStatus() {
        return this.status;
    }

    start() {
        this.stop();
        this.intervalId = setInterval(this.callback, this.intervalTime * 60000);
        this.status = 'running';
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.status = 'stopped';
    }

    setIntervalTime(intervalTime) {
        this.intervalTime = intervalTime;
        this.start();
    }

    getIntervalTime() {
        return this.intervalTime;
    }
}