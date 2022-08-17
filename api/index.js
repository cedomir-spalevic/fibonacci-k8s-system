const express = require("express");
const redis = require("redis");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pgClient = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});
pgClient.on("error", () => console.log("Lost PG connection"));
pgClient.on("connect", (client) => {
    client
        .query("CREATE TABLE IF NOT EXISTS values (number INT)")
        .catch((err) => console.log(err));
});

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});
const redisPublisher = redisClient.duplicate();

redisClient.on("ready", () => {
    console.log("Redis client connected successfully");
});
redisPublisher.on("ready", () => {
    console.log("Redis publisher connected successfully");
});

app.get("/", (req, res) => {
    res.send("Hi");
});

app.get("/values/all", async (req, res) => {
    const values = await pgClient.query("SELECT * FROM values");
    res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
    const values = await redisClient.hGetAll("values");
    res.send(values);
});

app.post("/values", async (req, res) => {
    const index = req.body.index;
    if (parseInt(index) > 40) {
        return res.status(422).send("Index too high");
    }
    await redisClient.hSet("values", index, "Nothing yet!");
    await redisClient.publish("insert", index + "");
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
    res.send({ working: true });
});

(async () => {
    await redisClient.connect();
    await redisPublisher.connect();
    app.listen(5000, () => console.log("Listening on port 5000"));
})();
