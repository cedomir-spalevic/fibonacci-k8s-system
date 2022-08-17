const redis = require("redis");

const client = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },    
});
const sub = client.duplicate();

const fibonacci = (n) => {
    if (n < 2) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
};

(async () => {
    await client.connect();
    await sub.connect();
    await sub.subscribe("insert", (message, channel) => {
        client.hSet("values", message, fibonacci(parseInt(message, 10)));
    });
})();