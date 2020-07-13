var should = require("should"); //  It keeps your test code clean, and your error messages helpful.
var monk = require("monk"); // a framework that makes accessing MongoDb really easy
var db = monk('localhost/msgdb');
should.exists(db);

var usersCollection = db.get("users");
should.exists(usersCollection);

var msgsCollection = db.get("msgs");
should.exists(msgsCollection);

var groupsCollection = db.get("groups");
should.exists(groupsCollection);

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');


var app = express();
var socket = require('socket.io');
//Server instance
var server = http.createServer(app);
//build a socket using the instance of the server
var io = socket(server);

var logger = require('morgan');  // isteklerle ilgili logları konsola yazmak için

app.use(bodyParser.urlencoded({ extended: false })); //post body praser
app.use(logger('dev'));
app.use(express.static(__dirname + '/node_modules'));


//INDEX REQUEST
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

//GET SITE JS
app.get('/js/Site.js', function (req, res) {
    res.sendFile(__dirname + '/js/Site.js');
});
//GET SITE CSS
app.get('/css/Site.css', function (req, res) {
    res.sendFile(__dirname + '/css/Site.css');
});

//GET REQUEST EXAMPLE
app.get('/hello', function (req, res) {
    // input value from search
    var url = req.query.search;
    console.log(url); // prints value

});

//SIGN UP
app.post('/signup', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    console.log("/POST");
    var user = {
        "user_name": req.body.username,
        "password": req.body.password,
        "status": "offline"
    }
    usersCollection.insert(user, function (err, doc) {
        if (err)
            res.end('Please choose another user name!');
        else
            res.end('Thanks, You can now log in !');
    });
});

//LOGIN
app.post('/login', function (req, res) {

    var username = req.body.username,
        password = req.body.password;
    usersCollection.findOne({ user_name: username, password: password }, function (err, doc) {
        if (doc == null) {
            //Not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('error');
        }

        //logged in
        else {
            res.writeHead(200, { 'Content-Type': 'text/html' });

            var userinfo = {
                "user_name": req.body.username,
                "password": req.body.password,
                "status": "online"
            };
            usersCollection.update({ user_name: username }, userinfo);

            var destgrouptest = "";

            //SOCKET IO
            io.on('connection', function (socket) // bağlantı kurulduğunda
            {
                //tekrar bağlanmaması için
                io.removeAllListeners('connection');
                console.log(username + ' Connected');
                socket.join(username);

                socket.on('message', function (msg, dest, suser) // kullanıcı tanımlı olay
                {
                    var newDate = new Date();
                    var datetime = newDate.today() + " @ " + newDate.timeNow();
                    var usrmsg = datetime + " " + username + " sending to (" + dest + "): " + msg;

                    //SWITCH ON CASES
                    switch (dest) {

                        // ALL CONNECTED USERS
                        case 'All Connected Users': {
                            //LEAVE GROUP
                            if (destgrouptest !== "") {
                                socket.leave(destgrouptest);
                                destgrouptest = "";
                                io.to(username).emit('message', 'You left the group.');
                            }
                            io.emit('message', usrmsg);
                            break;
                        }

                        // TO A SPECIFIC GROUP
                        case 'A Group': {
                            io.in(destgrouptest).emit('message', usrmsg);

                            msgsCollection.insert({
                                "sender": username,
                                "receiver": destgrouptest,
                                "msg": msg,
                                "time": datetime,
                                "status": "delivered"
                            });

                            break;
                        }

                        // TO A SPECIFIC USER
                        case 'A User': {
                            //LEAVE GROUP
                            if (destgrouptest !== "") {
                                socket.leave(destgrouptest);
                                destgrouptest = "";
                                io.to(username).emit('message', 'You left the group.');
                            }
                            usersCollection.findOne({ user_name: suser }, function (err, doc) {
                                if (err) {
                                    io.to(username).emit('message', 'NO SUCH USER, Your Message hasn\'t been sent.');
                                    console.log("no such user");
                                }
                                else if (doc.status == "online") {
                                    if (username != suser) {
                                        io.to(socket.id).emit('message', usrmsg);
                                    }
                                    io.to(suser).emit('message', usrmsg);
                                    msgsCollection.insert({
                                        "sender": username,
                                        "receiver": suser,
                                        "msg": msg,
                                        "time": datetime,
                                        "status": "delivered"
                                    });
                                }
                                else if (doc.status == "offline") {
                                    if (username != suser) {
                                        io.to(socket.id).emit('message', usrmsg + " *(will be delivered)");
                                    }
                                    msgsCollection.insert({
                                        "sender": username,
                                        "receiver": suser,
                                        "msg": msg,
                                        "time": datetime,
                                        "status": "not delivered"
                                    });
                                }
                            });
                            break;
                        }
                    }
                });

                socket.on('join', function (destgroup) {
                    if (destgrouptest == destgroup) {
                        io.to(username).emit('message', 'You\'re already in ' + destgrouptest);
                        return;
                    };
                    destgrouptest = destgroup;
                    console.log(username + " has joinning " + destgrouptest + " room");

                    groupsCollection.insert({ groupname: destgrouptest, createdby: username }, function (err, doc) {
                        if (err)
                            console.log('Group exists');
                        else
                            console.log('New Group Has Been Added: ' + destgrouptest);

                    });
                    socket.join(destgrouptest);
                    io.to(username).emit('message', 'You\'re Now Connected To: ' + destgrouptest);

                });

                socket.on('disconnect', function () {
                    var userinfo = {
                        "user_name": req.body.username,
                        "password": req.body.password,
                        "status": "offline"
                    };
                    usersCollection.update({ user_name: username }, userinfo);
                    socket.removeAllListeners('send message');
                    socket.removeAllListeners('disconnect');
                    io.removeAllListeners('connection');
                    io.to(username).emit('message', 'You Just Signed Out, Please Login Again..');
                    io.to(username).emit('disconnected', 'signedout');
                    console.log(username + ' Signed Off...');
                });
            });

            msgsCollection.find({ "receiver": username, "status": "not delivered" }, function (err, docs) {
                if (err) {
                    res.end("can't retrieve messages");
                    console.log("Error:" + err);
                }
                else {
                    if (docs.length == 0) {
                        res.end("welcome, there is no new msgs");
                        return;
                    }
                    var messages = "[";
                    for (i = 0; i < docs.length; i++) {
                        messages += "{\"time\":" + "\"" + docs[i].time + "\"" + ",\"sender\":\"" + docs[i].sender + "\",\"msg\":" + "\"" + docs[i].msg + "\"" + "},";
                        msgsCollection.findAndModify(
                            {
                                "query": { "status": "not delivered" },
                                "update": {
                                    "$set": {
                                        "status": "delivered"
                                    }
                                },
                                "options": { "new": true, "upsert": true }
                            },
                        );
                    }
                    messages = messages.substr(0, messages.length - 1);
                    messages += "]";
                    console.log(messages);

                    //send to client
                    res.end(messages);
                }
            });
        }
    });
});

app.post('/joingroup', function (req, res) {
    // input value from search
    var groupname = req.body.destgroup;
    socket.join(groupname);
    res.end("joined!");
});

//LISTENER
server.listen(8080, function () {
    console.log('8080 Portu dinleniyor...');
});

// For todays date;
Date.prototype.today = function () {
    return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "/" + (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "/" + this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function () {
    return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
}