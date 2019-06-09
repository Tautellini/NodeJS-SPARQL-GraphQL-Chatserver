/**
 * Das ist ein Beispiel für die Verwendung von graphql
 * Das simple-memory-store aus der ersten Übung wird hier wiederverwendet um die Daten intern zu speichern.
 * Mit GraphQL kann der Client mittels einer Abfragesprache gezielt nach bestimmten Element aus der Datenquelle fragen. 
 * Die Serverseite muss nicht jede einzelne Resource und jede einzelne Abfrage selber implementieren.
 * Durch GraphQL bekommt die Clientseite also mehr Spielraum im Konsumieren der Daten und die Implementierung der Serverseite wird vereinfacht.
 *  
 * Am Ende dieser Datei befinden sich Beispielabfragen für GraphQL. 
 */


const storage = new (require('simple-memory-store'))();
const express = require('express');

/**
 * Erstellung von Beispieldatensätzen
 */
storage.insert("users", { "firstName": "Gökhan", "lastName": "Coskun", "login": "gcoskun" })
storage.insert("users", { "firstName": "George", "lastName": "Clooney", "login": "gclooney" })


/**
 * Für die Verwendung von GraphQL wird die exrpess-graphql Bibliothek verwendet. 
 */
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

/**
 * In diesem Abschnitt wird das Schema der eigentlichen Daten beschrieben. Außerdem werden die GraphQL spezifischen Elemente "Query" und "Mutation" genau definiert.
 */
const schema = buildSchema(`
     input UserInput {
         login: String!
         firstName: String!
         lastName: String!
     }

     type User {
         id: Int!
         login: String!
         firstName: String!
         lastName: String!
     }
    
      type Query {       
         "Returns a list of users."
         users: [User]
         
         "Returns a single user matching an ID."
         user(id: Int!): User
     }

     type Mutation {
        createUser(input: UserInput): User
        removeUser(input: UserInput): User
     }
 `);

/**
 * In diesem Element werden die Funktionen implementiert, auf die sich die "Query" und "Mutation" Elemente aus dem Schema beziehen. 
 * Im oberen Schema werden die Funktionen also nur referenziert und hier wird die dazugehörige Logik implementiert.
 * 
 */
const root = {
    users: () => {
        return storage.select("users")
    },
    user: (id) => {
        console.log("returning object " + JSON.stringify(id.id) + " " + JSON.stringify(storage.select("users", id.id)))
        return storage.select("users", id.id)
    },
    createUser: (user) => {
        console.log("running input with " + JSON.stringify(user))
        return storage.insert("users", user.input)
    }
}



const app = express();
/**
 * Hier wird die express-graphql Bibliothek mit den richtigen Parametern gesetzt:
 * schema ist das oben definierte Schema
 * rootValue ist die Logik, die oben definiert wurde
 * graphiql ist ein flag, welches hier gesetzt wird, damit das interaktive User Interface verwendet werden kann
 */
app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
}));

app.listen(4001);

console.log("Running express server on localhost:4001");







/**
 * Beispielabfragen für graphql
 *  
 * Alle user mit den Feldern "id" und "firstName" zurückgeben: 
 * 
 * query {
 *  users{
 *   id
 *   firstName
 *  }
 * }
 * 
 * 
 * 
 * Einen speziellen User mit bestimmter ID zurückgeben
 * query {
 *   user(id:103) {
 *     id
 *     firstName
 *   }
 * }
 * 
 * 
 * Einen neuen User anlegen und dann alle Felder zurückgeben
 * mutation {
 *   createUser(
 *     input :{
 *       firstName:"Michael",
 *       lastName:"Jackson",
 *       login:"MJ"
 *     }
 *   ) {
 *     id
 *     firstName
 *     lastName
 *     login
 *   }
 * }
 * 
 */
