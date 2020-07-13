# nodejs-chat-app

Basic Web Based Messaging App

## Libraries used

[ [Node.JS](https://nodejs.org/) / [npm](https://www.npmjs.com/) ]

[ [Socket.IO](http://socket.io/) :: [ExpressJS](http://expressjs.com/) :: [ejs](https://www.npmjs.com/package/ejs/) ]


# Screenshots

-   Singup/Signin Screen

     <img src=./docs/ss2.jpg>
     
     
-   App Screen

     <img src=./docs/ss1.jpg>


# Functionality
<ol>
  <li>Send real-time messages to all connected users, groups and single users.</li>
  <li>All private messages are recorded to a MongoDB database.</li>
  <li>Offline users will recieve their messages when they signin.</li>
</ol>

# Setup
Create the database using msgdb.agz file then:

open the terminal and type: 
```sh
$ npm install
```
and to run:
```sh 
$ npm start
```
