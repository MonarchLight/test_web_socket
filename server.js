"use strict";

import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from "uuid";
import fs from 'fs';

const log = fs.existsSync('log') && fs.readFileSync('log');

const clients = {};
const messages = log ? JSON.parse(log) : [];

const wss = new WebSocketServer({ port: 8000 });

wss.on("connection", (ws) => {
    const id = uuidv4();
    clients[id] = ws;

    ws.send(JSON.stringify(messages));

    ws.on("message", (rawMessage) => {
        const { name, message } = JSON.parse(rawMessage);
        messages.push({ name, message });

        for (const id in clients) {
            clients[id].send(JSON.stringify([{ name, message }]));
        }
    });

    ws.on("close", () => {
        delete clients[id];
        console.log(`Client disconnected: ${id}`);
    });

    ws.on("error", (error) => {
        console.log(`Error: ${error}`);
    });
});

process.on("SIGINT", () => {
    wss.close();
    fs.writeFile("log", JSON.stringify(messages), err => {
        if (err) console.log(err);
        process.exit();
    });
});