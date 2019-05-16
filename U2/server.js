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

function postMessage(sender, recipient, text) {
    var request = require('request');
    var now = new Date();
    console.log(now);
    var myjsonld = {
        "@context" : "http://schema.org/",
        "@type" : "Message",
        "@id" : now,
        "sender" : {
            "@id" : sender,
            "@type" : "Person",
            "name" : sender,
        },
        "recipient" : {
            "@id" : recipient,
            "@type" : "Person",
            "name" : recipient,
        },
        "text" : text
    }

    request.post( {
        headers: {'content-type' : 'application/ld+json'},
        url:'http://localhost:3030/ds/data',
        method: 'post',
        json: true,
        body: myjsonld,
        function (error, response, body) {
            // console.log('successful update');
            console.log(body);
            console.log(response.statusCode)
            console.warn(error);
        }
    });
}

function getAllNodes(person, callback) {
    var request = require('request');

    var options = {
        'bla' : "PREFIX schema: <http://schema.org/> SELECT * WHERE { ?person schema:name '"+person+"' . ?message schema:sender ?person . ?message schema:text ?text . ?message schema:recipient ?empf }",
        'Accept': 'application/json',
    }

    console.log("GET ALL NODES:");

    request.get('http://localhost:3030/ds/sparql?query='+encodeURIComponent(options.bla),options,function(error,response,body){
        if(error) {
            console.warn(error);
        }
        if(response.statusCode == 200 ) {
            // console.log(response);
            // console.log(response.statusCode);
            console.log(body);
            callback(body);
        } else {
            console.log("What happened?");
            console.log(response.statusCode);
            console.log(response);
        }
    });
}

app.ws('/', (client, req) => {
    client.on('message', message => {
        var parsedJson = JSON.parse(message);
        console.log("User connected: ")
        if ("name" in parsedJson) {
            clients[parsedJson.name] = client;
            console.log(getAllNodes(parsedJson.name, function(body) {
                client.send(body);
            }));
            // postSparqlQuery(parsedJson);
            // postUser(parsedJson.name);
        } else {
            var text = parsedJson.message;
            var key = parsedJson.recipient;
            postMessage(parsedJson.sender, parsedJson.recipient, text);
            if (!(clients[key] === undefined)) {
                clients[parsedJson.recipient].send(parsedJson.message);
            } else {
                client.send("Sry dude, your friend is not known!");
            }
        }
    });
    client.on('close', () => {

        console.log("Connection Closed");
    });
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
