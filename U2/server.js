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

function postStuff() {
    var request = require('request');

    var myjsonld = {
        "@context" :
        {
            "name": "http://schema.org/name",
            "email" : "http://schema.org/email",
            "homepage" :
            {
                "@id" : "http://schema.org/url",
                "@type" : "@id"
            },
            "Person" : "http://schema.org/Person/",
        },
        "@id" : "Person:Florian",
        "@type" : "Person",
        "name" : "Florian",
        "email" : "bla@bla.de",
        "homepage" : "http://tauteweb.de"
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

function postStuff2() {
    var request = require('request');

    var myjsonld = {
        "@context" :
        {
            "name": "http://schema.org/name",
            "email" : "http://schema.org/email",
            "homepage" :
            {
                "@id" : "http://schema.org/url",
                "@type" : "@id"
            },
            "Person" : "http://schema.org/Person/",
        },
        "@id" : "Person:Dennis",
        "@type" : "Person",
        "name" : "Dennis",
        "email" : "dennis@bla.de",
        "homepage" : "http://dennisweb.de"
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

function postMessage() {
    var request = require('request');

    var sender = "Florian";
    var recipient = "Dennis";

    var myjsonld = {
        "@context" :
        {
            "Messages" : "http://schema.org/Messages/",
            "Message" : {
                "@id" : "http://schema.org/Message",
                "@type" : "@id",
                "sender" : "http://schema.org/Person/",
                "recipient" : "http://schema.org/Person/",
            }
        },
        "@id" : "Messages:"+sender+recipient,
        "@type" : "Messages",
        "Message" : {
            "text" : "Lorem Ipsum Dolor Sit Achim",
            "sender" : "http://schema.org/Person/"+sender,
            "recipient" : "http://schema.org/Person/"+recipient,
        }
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


function postSparqlQuery(query) {
    var http = require('http');

    var options = {
        host: 'localhost',
        path: '/ds/query?update=',
        port: '3030',
        method: 'POST'
    };

    var req = http.request(options, function(res) {
        res.setEncoding("utf8");
        res.on('data', function(chunk) {
            console.log('Response: ' + chunk);
        });
    });
    //This is the data we are posting, it needs to be a string or a buffer
    req.write("PREFIX test:<http://www.semanticweb.org/muhammad/ontologies/2017/2/untitled-ontology-14#> INSERT { ?KPIs test:hasValue 2009} WHERE { ?KPIs test:hasValue ?Newvalue}");
    req.end();
}

app.ws('/', (client, req) => {
    client.on('message', message => {
        var parsedJson = JSON.parse(message);
        console.log("User connected: ")
        console.log(parsedJson);
        if ("name" in parsedJson) {
            clients[parsedJson.name] = client;
            // postSparqlQuery(parsedJson);
            postStuff();
            postStuff2();
            postMessage();
        } else {
            var key = parsedJson.recipient;
            if (!(clients[key] === undefined)) {
                clients[parsedJson.recipient].send(parsedJson.message);
            } else {
                client.send("Sry dude, your friend is not online!");
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
