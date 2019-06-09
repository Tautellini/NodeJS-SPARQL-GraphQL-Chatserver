/*****************************************************************/
/*  RESTful Express Server with Support for GraphCool            */
/*  based on SPARQL                                              */
/** @author Florian Taute                                        */
/** @licence MIT                                                 */
/** @version 1.0                                                 */
/*****************************************************************/

/*
TEST DATA ON SERVER IN THE FOLLOWING FORM:
PREFIX schema: <http://schema.org/>
INSERT DATA
{ <http://localhost:3030/users> schema:user <http://localhost:3030/users/101> .
  <http://localhost:3030/users/101> schema:name "Florian Taute" .
  <http://localhost:3030/users/101> schema:tweets <http://localhost:3030/users/101/tweets/> .
  <http://localhost:3030/users/101/tweets/> schema:tweet  <http://localhost:3030/users/101/tweets/1> . 
  <http://localhost:3030/users/101/tweets/> schema:tweet  <http://localhost:3030/users/101/tweets/2> . 
  <http://localhost:3030/users/101/tweets/1> schema:text "Mein erster schöner Tweet..." .
  <http://localhost:3030/users/101/tweets/2> schema:text "Mein zweiter schöner Tweet..." .
  <http://localhost:3030/users> schema:user <http://localhost:3030/users/102> .
  <http://localhost:3030/users/102> schema:name "Achim Schliebener" .
  <http://localhost:3030/users/102> schema:tweets <http://localhost:3030/users/102/tweets/> .
  <http://localhost:3030/users/102/tweets/> schema:tweet  <http://localhost:3030/users/102/tweets/1> . 
  <http://localhost:3030/users/102/tweets/> schema:tweet  <http://localhost:3030/users/102/tweets/2> . 
  <http://localhost:3030/users/102/tweets/1> schema:text "Erstens: Bleib ruhig!" .
  <http://localhost:3030/users/102/tweets/2> schema:text "Zweitens: Bleib ruhiger!" .
}
*/

const express = require('express')
const app = express()
const port = 3000
var bodyParser = require('body-parser')
app.use(bodyParser.json());

/***************************************/
/*          SPARQL FUNCTION            */
/***************************************/
function sparqlQuery (method, action, query, data) {
    /* 
        ATTENTION - SUBJECT TO CHANGE - probably use request-promise instead
        We are using manual Promise on our functions, because we cant access our variables from
        an asynchronous callback within a synchronous Graphqool Resolver function --
        since we use this functions for every other Route, we use async/await everywhere
        Following the advise we got here: https://stackoverflow.com/questions/56496776/how-to-get-data-from-an-asynchronous-callback-inside-a-synchronous-root-function
    */
    return new Promise(function (resolve, reject) {
        /***************************************/
        /*          SPARQL QUERYS              */
        /***************************************/
        var queryGetUsers = `
        PREFIX schema: <http://schema.org/>
        SELECT ?user ?name ?tweets
        WHERE {
          ?users schema:user ?user .
          ?user schema:name ?name .
          ?user schema:tweets ?tweets
        }`
        var queryGetUser = `
        PREFIX schema: <http://schema.org/>
        SELECT (<http://localhost:3030/users/${data.id}>) ?name ?tweets
        WHERE {
        <http://localhost:3030/users/${data.id}> schema:name ?name .
        <http://localhost:3030/users/${data.id}> schema:tweets ?tweets
        }`
        var queryPostUser = `
        PREFIX schema: <http://schema.org/>
        INSERT DATA {
        <http://localhost:3030/users/${data.id}> schema:name "${data.name}" .
        <http://localhost:3030/users/${data.id}> schema:tweets <http://localhost:3030/users/${data.id}/tweets/>
        }`
        var queryGetTweets = `
        PREFIX schema: <http://schema.org/>
        SELECT ?user ?tweet ?text
        WHERE {
          ?user schema:tweets ?tweets .
          ?tweets schema:tweet ?tweet .
          ?tweet schema:text ?text
        }`
        var queryGetTweet = `
        PREFIX schema: <http://schema.org/>
        SELECT (<http://localhost:3030/users/${data.userid}/tweets/${data.tweetid}>) ?text
        WHERE {
        <http://localhost:3030/users/${data.userid}/tweets/${data.tweetid}> schema:text ?text
        }`
        /***************************************/
        /*           QUERY SETTERS             */
        /***************************************/
        console.log("Method: "+method+" Action: "+action)
        console.log("Data: "+JSON.stringify(data))
        if (action == "getusers") {
            query = queryGetUsers;
        }
        if (action == "getuser") {
            query = queryGetUser;
        }
        if (action == "postuser") {
            query = queryPostUser;
        }
        if (action == "gettweets") {
            query = queryGetTweets;
        }
        if (action == "gettweet") {
            query = queryGetTweet;
        }
        if (action == "puttweet") {
            query = queryPutTweet;
        }
        /***************************************/
        /*           SPARQL METHODS            */
        /***************************************/
        if (method == "get") {
            var request = require('request')
            request.get('http://localhost:3030/ds/sparql?query='+encodeURIComponent(query)+'&format=json',function(error,response,body) {
                temp = JSON.parse(body).results.bindings
                resolve(temp)
            })
        }
        // We are using POST for the FUSEKI Server, even when the Method is PUT. We simply delete the original
        // RDF Triple inside our query before inserting new Data - which resolves to smth "like" PUT
        if (method == "post" || method == "put") {
            var request = require('request')
            request.post({
                headers: {'content-type':'application/x-www-form-urlencoded'},
                url: 'http://localhost:3030/ds/update?update='+encodeURIComponent(query),
            },
                function (error, response, body) {
                    resolve(body)
                })
            }
        })
}

app.route('/sparql')
    .get( async (req, res) => {
        if (req.query != null) {
            let data = await sparqlQuery("", "", query, "")
            res.send(data);
        } else {
            res.error(400);
        }
    })
    .post((req, res) => {
    })


/* app.get('/graphql', (req,res, next) => {
    var request = require('request');
    // var Converter = require('graphql-to-sparql').Converter;
    // var algebra = new Converter().graphqlToSparqlAlgebra('{user{name}}', {
    //     "user" : "http://schema.org/user",
    //     "name": "http://schema.org/name"
    // })

    console.log(req.query.query);
}) */

    const graphqlHTTP = require('express-graphql');
    const { buildSchema } = require('graphql');

     const schema = buildSchema(`
        type Query {
           users: String
           user (id: Int!): String
           tweets: String
           tweet: String
       }
    `);

    const root = {
        users: async () => {
            let data = await sparqlQuery("get", "getusers", "")
            return JSON.stringify(data)
        },
        user: async (id) => {
            let data = await sparqlQuery("get", "getuser", "", id)
            return JSON.stringify(data)
        },
        tweets: async () => {
            let data = await sparqlQuery("get", "gettweets", "")
            return JSON.stringify(data)
        },
        tweet: async (id) => {
            let data = await sparqlQuery("get", "gettweet", "", id)
            return JSON.stringify(data)
        }
    }

    app.use('/graphql', graphqlHTTP({
       schema,
       rootValue: root,
       graphiql: true,
    }))

/***************************************/
/*             users block             */
/***************************************/
/* route = /users */
app.route('/users')
    .get( async (req, res) => {
        let data = await sparqlQuery("get", "getusers", "", "")
        res.send(data);
    })
    .put( (req, res) => {
        console.log("app.put auf /users wurde aufgerufen. Das Ersetzen aller User mit einem put ist nicht gestattet. Liefer Fehlermeldung zurück.")
        res.send('Operation not allowed')
    })
    .post( async (req, res) => {
        let tempUsers = await sparqlQuery("get", "getusers", "","")
        req.body.id = tempUsers.length
        let data = await sparqlQuery("post", "postuser", "", req.body)
        res.send(data)
    })
    .delete((req, res) => {
        console.log("app.delete auf /users wurde aufgerufen. Das Löschen aller User auf einmal ist nicht gestattet. Liefere Fehlermeldung aus. ")
        res.send('Operation not allowed')
    })

/* route = /users/:id */
app.route('/users/:id')
    .get( async (req, res) => {
        let data = await sparqlQuery("get", "getuser", null, req.params)
        res.send(data);
    })
    .put((req, res) => {
        console.log("app.put auf users:" + req.params.id + " wurde aufgerufen. Das neue Objekt sieht folgendermaßen aus: " + JSON.stringify(req.body))
        let newUser = req.body
        console.log("Die ID des neuen Objekts wird ausgelesen und die Felder href und tweets werden entsprechend richtig gesetzt.")
        newUser.id = Number(req.params.id)
        newUser.href = ("http://localhost/users/" + newUser.id)
        newUser.tweets = ("http://localhost/users/" + newUser.id + "/tweets")
        console.log("Ersetzung durch neues Objekt wird im Store durchgeführt.")
        store.replace("users", newUser.id, newUser)
        console.log(JSON.stringify(newUser))
        res.contentType('application/json').send(JSON.stringify(newUser))
    })
    .post((req, res) => {
        console.log("app.post auf users:" + req.params.id + " wurde aufgerufen. Post auf spezielle ID ist nicht gestattet. Fehlermeldung wird ausgeliefert.")
        res.send('Operation not allowed')
    })
    .delete((req, res) => {
        console.log("app.delete auf users:" + req.params.id + " wurde aufgerufen. Entferne das Objekt mit der gegebenen ID aus dem Store.")
        store.remove("users", req.params.id)
        if (store.select("users", req.params.id))
            res.send('Objekt konnte nicht entfernt werden.')
        else
            res.send('Objekt erfolgreich entfernt.')
    })


/***************************************/
/*              tweets  block          */
/***************************************/

/* route = /tweets */
app.route('/tweets')
    .get((req, res) => {
        console.log("app.get auf /tweets wurde aufgerufen. Liefere alle tweets aus.")
        let tweets = store.select("tweets")
        res.contentType('application/json').send(tweets)
    })
    .put((req, res) => {
        console.log("app.put auf /tweets wurde aufgerufen, aber PUT auf allen tweets ist nicht gestattet. ")
        res.send('Operation not allowed')
    })
    .post((req, res) =>{
        console.log("app.post auf /tweets wurde aufgerufen. Das folgende Objekt wurde erhalten: \n " + JSON.stringify(req.body))
        let newtweet = req.body
        let user = newtweet.user
        if (user) {
            userID = newtweet.user.substring(newtweet.user.lastIndexOf('/') + 1)
            console.log("Das Feld user wurde gesetzt. Überprüfe ob der User " + newtweet.user + " bekannt ist.")
            selectedUser =  store.select("users", userID)
            if (selectedUser) {
                console.log("Der User ist bekannt. Der tweet wird gespeichert.")
                newtweet =  store.insert("tweets", newtweet)
                newtweet.href = ("http://localhost/tweets/" + newtweet.id)
                newtweet =  store.replace("tweets", newtweet.id, newtweet)
                res.contentType('application/json').send(JSON.stringify(newtweet))
            }
            else
                res.contentType('text/plain').send("Unknown user id " + userID)
        }
    })
    .delete((req, res) => {
        console.log("app.delete auf /tweets wurde aufgerunfen. Das Löschen aller Tweets ist nicht erlaubt.")
        res.send('Operation not allowed')
    })

/* route = /tweets/:id */
app.all('/tweets/:id', (req,res) => {
    res.send("Operation not allowed. Use /users/:userid/tweets/:tweetid instead")
})

app.route('/users/:userid/tweets/:tweetid')
    .get( async (req, res) => {
        let data = await sparqlQuery("get", "gettweet", null, req.params)
        res.send(data);
    })
    .put((req, res) => {
        console.log("app.put auf tweets:" + req.params.id + " wurde aufgerufen. Überschreiben mit folgendem Objekt:\n" + JSON.stringify(req.body))
        let newtweet = req.body
        newtweet.id = Number(req.params.id)
        newtweet.href = ("http://localhost/tweets/" + newtweet.id)
        store.replace("tweets", newtweet.id, newtweet)
        res.contentType('application/json').send(JSON.stringify(newtweet))
    })
    .post((req, res) => {
        console.log("app.put auf tweets:" + req.params.id + " wurde aufgerufen. POST auf ID ist nicht erlaubt.")
        res.send('Operation not allowed')
    })
    .delete((req, res) =>  {
        console.log("app.delete auf tweets:" + req.params.id + " wurde aufgerufen. Das tweet mit der entsprechenden ID wird aus dem Store gelöscht.")
        store.remove("tweets", req.params.id)
        if (store.select("tweets", req.params.id))
            res.send('Objekt konnte nicht entfernt werden.')
        else
            res.send('Objekt wurde erfolgreich gelöscht.')
    })



/***************************************/
/*            tweets of user block     */
/***************************************/
app.route('/users/:id/tweets')
    .get((req, res) => {
        console.log("app.get auf users:" + req.params.id + " wurde aufgerunfen. Überprüfe ob der User bekannt ist.")
        let selectedUser = store.select("users", req.params.id)
        if (selectedUser) {
            let tweets = store.select('tweets')
            console.log("Der User ist bekannt. Alle tweets auf gefiltert auf user: " + selectedUser.href)
            tweets = tweets.filter(item => item.user == selectedUser.href);
            console.log("Folgende tweets wurden gefunden und werden ausgeliefert:\n" + JSON.stringify(tweets))
            res.contentType('application/json').send(tweets)
        }
        else
            res.send("user not known with id " + req.params.id)
    })



/******************************************/
/*       express.static, start server     */
/******************************************/
app.use(express.static('public'))
app.use('*', (req, res) => res.contentType('text/plain').sendStatus(404))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))