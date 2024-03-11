import redis from 'redis';

class RedisClient {

    constructor() {
        this.client = redis.createClient();

        this.client.on('error', (err) => {
            console.error(err.message);
        });
        // this.client.on('connect', () => {
        //     console.log('Connected!');
        // });
    }

    isAlive() {
        return (this.client.connected ? true : false);
    }

    async get(key) {
        return new Promise((res, rej) => {
            this.client.get(key, (err, reply) => {
                if (err) {
                    rej(err.message);
                } else {
                    res(reply);
                }
            });
        });
    }

    async set(key, value, dur) {
        return new Promise((res) => {
            this.client.set(key, value, 'EX', dur);
            res()
        });
    }

    async del(key) {
        return new Promise((res) => {
            this.client.del(key);
            res();
        });
    }
}

const redisClient = new RedisClient();
module.exports = redisClient;
