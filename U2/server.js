/**
 *  
 * Simple Express-WS Chatserver
 * 
 * @author Florian Taute
 *         Achim Schliebener
 *         Mohamad Ali
 * 
 * @licence Public Domain
 * @version 1.0
 * 
 */

// Testkommentar
"use strict";

    // 1. - REQUIRES ----------------------------------------------
    // ------------------------------------------------------------
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const store = new (require('simple-memory-store'))();
const HttpError = require('./http-error.js');

    // 2. - CONFIG ------------------------------------------------
    // ------------------------------------------------------------    
const port = 3000;
store.initWithDefaultData();    // Füllt DB-Objekt mit ein paar Testdaten
const app = express();
const expressWs = require('express-ws')(app);
app.use(express.static('public'));
app.use(bodyParser.json());

var clients = {};

app.ws('/', (client, req) => {
    socketList.push(client);
    client.on('message', message => {
        var parsedJson = JSON.parse(message);
        console.log(parsedJson);
        if ("name" in parsedJson) {
            clients[parsedJson.name] = client;
        } else {
            var key = parsedJson.recipient;
            if (clients[key]) {
                clients[parsedJson.recipient].send(parsedJson.message);
            } else {
                socket.send("Sry dude, your friend is not online!");
            }
        }

        if (message.type === 'utf8') {
            console.log('Recieved: ' + message);
            socketList.forEach(socket => {
                socket.send("SERVER RECIEVED: "+message);
            })
        }
    })
    client.on('close', () => {
        console.log("Connection Closed");
    })
});

/**
 * Logging Middleware
 * @param {*} req HTTP-Anforderungsargument
 * @param {*} res HTTP-Antwortsargument
 * @param {*} next Callback-Argument zur Middlewarefunktion (next ist konventionell)
 */
app.use((req, res, next) => {
    console.log(`REQUEST-TYP: ${req.method} ----- PATH: ${req.originalUrl}`);
    next();
});

    // 8. - SERVERSTART -------------------------------------------
    // ------------------------------------------------------------

/**
 * Server-Start / Log
 * @param {*} err hochgereichtes Error-Argument
 * @param {*} req HTTP-Anforderungsargument
 * @param {*} res HTTP-Antwortsargument
 * @param {*} next Callback-Argument zur Middlewarefunktion (next ist konventionell)
 */
app.listen(port, (err) => {
    if (err !== undefined) {
        console.log('Error beim starten:' + err);
    } else { 
        console.log("Server läuft auf Port:" + port);
    }
});
