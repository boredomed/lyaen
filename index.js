var express = require('express');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var session = require('express-session');
var redis = require('redis');
var redisStore = require('connect-redis')(session);
var client = redis.createClient();
var app = express();
var cors = require('cors');
app.use(cors());

var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "seecs123",
    database: "lyaen"
});

db.connect(function (err) {
    if (err) throw err;
    console.log("Connected");
});

function validateEmail(email) {
    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(String(email).toLowerCase());
}

function validateName(name) {
    var regex = /^[A-Za-z ]+$/;
    return regex.test(String(name).toLowerCase());
}


app.use(express.json());

client.auth("seecs123");
app.use(session({
    secret: 'seecs123',
    saveUninitialized: true,
    resave: false,
    store: new redisStore({
        host: "localhost",
        port: 6379,
        ttl: 300,
        client: client
    }),
}));

app.use('/', express.static('views'));

app.post('/signin', function (req, res) {
    let email = req.body.email;
    let pwd = req.body.pwd;
    if (validateEmail(email)) {
        let sql = "SELECT ID, Points, Name, Pwd as hash from users WHERE Email = ?;";
        db.query(sql, [email], function (err, result) {
            if (result.length > 0) {
                var hash = result[0]["hash"];
                var uid = result[0]["ID"];
                var name = result[0]["Name"];
                var points = result[0]["Points"];
                bcrypt.compare(pwd, hash, function (err, response) {
                    if (response) {
                        req.session.user = uid;
                        req.session.username = name
                        req.session.points = points; 
                        res.status(200).send({ "status": true, "Message": "Access Granted!" });
                    }
                    else {
                        res.status(200).send({ "status": false, "Message": "Access Denied!" });
                    }
                });
            }
            else {
                res.status(200).send({ "status": false, "Message": "Access Denied!" })
            }
        });
    }
    else {
        res.status(200).send({ "status": false, "Message": "Invalid Email!" });
    }
});

app.post('/signup', function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var pwd = req.body.pwd1;
    var cpwd = req.body.cpwd;
    if (validateName(name)) {
        if (validateEmail(email)) {
            var sql = "SELECT * from users WHERE Email = ?;";
            db.query(sql, [email], function (err, result) {
                if (result.length > 0) {
                    res.status(200).send({ "status": false, "Message": "Sorry! Email is already in use!" });
                }
                else {
                    if (pwd == cpwd) {
                        var saltRounds = 10;
                        bcrypt.hash(pwd, saltRounds, function (err, hash) {
                            var sql = "INSERT into users (Name, Email, Pwd) values (?, ?, ?);";
                            db.query(sql, [name, email, hash], function (err, result) {
                                if (err) throw err;
                                res.status(200).send({ "status": true, "Message": "Sign Up Successful!" });
                            });
                        });
                    }
                    else {
                        res.status(200).send({ "status": false, "Message": "Passwords DoNot Match!" });
                    }
                }
            });

        }
        else {
            res.status(200).send({ "status": false, "Message": "Invalid Email!" });
        }
    }
    else {
        res.status(200).send({ "status": false, "Message": "Name can only contains Spaces or Alphabets!" });
    }
});

app.get('/', function (req, res) {
    res.send("Welcome to Lyaen API.");
});

app.use(function (req, res, next) {
    if (req.session.user) {
        next();
    }
    else {
        res.status(401).send({ "status": false, "Message": "Authentication Required!" });
    }
});

app.get('/session', function (req, res) {
    res.status(200).send({ "status": true, "Message": "Access Granted!", "ID": req.session.user, "name": req.session.username, "points": req.session.points })
});

app.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) throw err;
        res.status(200).send({ "status": true });
    });
});

app.get('/users', function (req, res) {
    var sql = "select ID, Name, Email, Points from users;";
    db.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    })
    //res.end();
});

app.get('/users/:uid', function (req, res) {
    var uid = req.params.uid;
    var sql = "select * from users where ID = ?;";
    db.query(sql, [uid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    });
});

app.get('/visits', function (req, res) {
    var uid = req.session.user;
    var sql = "SELECT users.Name, visits.Description, visits.Destination, visits.Timestamp, visits.maxRequests, visits.Status, visits.ID FROM visits JOIN users WHERE visits.UID = users.ID AND status = 'Announced' AND UID <> ? ORDER BY Timestamp";
    db.query(sql, [uid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    })
    //res.end();
});

app.get('/visits/:vid', function (req, res) {
    var vid = req.params.vid;
    var sql = "select * from visits WHERE ID = ?;";
    db.query(sql, [vid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    })
    //res.end();
});

app.get('/myvisits', function (req, res) {
    var uid = req.session.user;
    var sql = "select * from visits where UID = ?;";
    db.query(sql, [uid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    });
});

//Getting visits of a particular user
app.get('/users/:uid/visits/:vid', function (req, res) {
    var uid = req.params.uid;
    var vid = req.params.vid
    var sql = "select * from visits where UID = ? and ID = ?;";
    db.query(sql, [uid, vid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    });
});

app.get('/visits/:vid/requests', function (req, res) {
    var vid = req.params.vid;
    var sql = "SELECT users.Name, requests.Description, requests.Status, requests.UID, requests.VID, requests.ID from requests JOIN users WHERE requests.UID = users.ID AND requests.VID = ?;";
    db.query(sql, [vid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    });
});

//View request of a particular user
app.get('/requests', function (req, res) {
    var uid = req.session.user;
    var sql = "SELECT users.Name, requests.Description, requests.Status, requests.UID, requests.VID, requests.ID FROM requests JOIN visits JOIN users WHERE requests.VID = visits.ID AND visits.UID = users.ID AND requests.UID = ?;";
    db.query(sql, [uid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    });
});

app.get('/users/:uid/requests/:rid', function (req, res) {
    var uid = req.params.uid;
    var rid = req.params.rid;
    var sql = "select * from requests where UID = ? and ID = ?;";
    db.query(sql, [uid, rid], function (err, result) {
        if (err) throw err;
        res.status(200).send(result);
    });
});

app.post('/visit', function (req, res) {
    var uid = req.session.user;
    var description = req.body.description;
    var destination = req.body.destination;
    var timestamp = req.body.timestamp;
    var maxrequests = req.body.maxrequests
    var sql = "INSERT into visits (Description, Destination, Timestamp, maxRequests, UID) values (?, ?, ?, ?, ?);";
    db.query(sql, [description, destination, timestamp, maxrequests, uid], function (err, result) {
        if (err) throw err;
        res.status(200).send({ "status": true, "Message": "Your visit is registered!" });
    });
});
app.post('/request', function (req, res) {
    var vid = req.body.vid;
    var description = req.body.description;
    var uid = req.session.user;
    var sql = "SELECT maxRequests as max from visits WHERE ID = ?;";
    db.query(sql, [vid], function (err, result) {
        if (err) throw err;
        var max = result[0]["max"];
        if (max == 0) {
            res.status(200).send({ "status": false, "Message": "Maximum Requests Reached!" });
        }
        else {
            max = max - 1;
            var sql = "UPDATE visits SET maxRequests = ? WHERE ID = ?;";
            db.query(sql, [max, vid], function (err, result) {
                if (err) throw err;
                var sql = "INSERT into requests (Description, UID, VID) values (?, ?, ?);";
                db.query(sql, [description, uid, vid], function (err, result) {
                    if (err) throw err;
                    res.status(200).send({ "status": true, "Message": "Request Placed Successfully!" });
                });
            });
        }
    });
});

app.put('/users/:uid/visits/:vid/requests/:rid', function (req, res) {
    var rid = req.params.rid;
    var status = req.body.status;
    var sql = "UPDATE requests SET status = ? WHERE ID = ?;";
    db.query(sql, [status, rid], function (err, result) {
        if (err) throw err;
        res.status(200).send({ "status": true, "Message": "Request Status Updated!" });
    });
});

//Completeing visit by a particular user
app.put('/visit', function (req, res) {
    var uid = req.session.user;
    var vid = req.body.vid;
    var comingstatus = req.body.status;
    var sql = "SELECT status from visits WHERE ID = ?;";
    db.query(sql, [vid], function (err, result) {
        if (err) throw err;
        var status = result[0]["status"];
        if (status == "Cancelled") {
            res.status(200).send({ "status": false, "Message": "Sorry! You cannot change the status of an already cancelled visit!" });
        }
        else if (status == "Completed") {
            res.status(200).send({ "status": false, "Message": "Sorry! You cannot change the status of an already completed visit!" });
        }
        else {
            if (comingstatus == "Cancelled") {
                var sql = "UPDATE requests SET status = 'Cancelled' WHERE VID = ?;";
                db.query(sql, [vid], function (err, result) {
                    if (err) throw err;
                    var sql = "UPDATE visits SET status = ? WHERE ID = ?;";
                    db.query(sql, [comingstatus, vid], function (err, result) {
                        if (err) throw err;
                        res.status(200).send({ "status": true, "Message": "Visit Status Updated!" });
                    });
                });
            }
            else {
                var sql = "SELECT count(*) as notavailable from requests WHERE (status = 'Not Available' OR status = 'Accepted' OR status = 'Requested') and VID = ?;";
                db.query(sql, [vid], function (err, result) {
                    if (err) throw err;
                    var na_requests = result[0]["notavailable"];
                    if (na_requests > 0) {
                        res.status(200).send({ "status": true, "Message": "Sorry! You cannot complete a visit. There are " + na_requests + " requests pending on your visit." })
                    }
                    else {
                        var sql = "SELECT count(*) as completed from requests WHERE status = 'Completed' and VID = ?;";
                        db.query(sql, [vid], function (err, result) {
                            if (err) throw err;
                            var completed_requests = result[0]["completed"];
                            if (completed_requests > 0) {
                                var sql = "SELECT points from users WHERE ID = ?;";
                                db.query(sql, [uid], function (err, result) {
                                    if (err) throw err;
                                    var previous_points = result[0]["points"];
                                    var points = (completed_requests * 5) + 5;
                                    points = previous_points + points;
                                    var sql = "UPDATE users SET points = ? WHERE ID = ?;";
                                    db.query(sql, [points, uid], function (err, result) {
                                        if (err) throw err;
                                        var sql = "UPDATE visits SET status = ? WHERE ID = ?;";
                                        db.query(sql, [comingstatus, vid], function (err, result) {
                                            if (err) throw err;
                                            res.status(200).send({ "status": true, "Message": "Visit Status Updated!" });
                                        });
                                    });
                                });
                            }
                            else {
                                var sql = "UPDATE visits SET status = ? WHERE ID = ?;";
                                db.query(sql, [comingstatus, vid], function (err, result) {
                                    if (err) throw err;
                                    res.status(200).send({ "status": true, "Message": "Visit Status Updated!" });
                                });
                            }
                        });
                    }
                });
            }
        }
    });
});

app.put('/request', function (req, res) {
    var uid = req.session.user;
    var rid = req.body.rid;
    var status = req.body.status;
    var vid = req.body.vid;
    if (status == "Declined") {
        var sql = "SELECT maxRequests as max from visits WHERE ID = ?;";
        db.query(sql, [vid], function (err, result) {
            if (err) throw err;
            var maxRequests = result[0]["max"];
            maxRequests = maxRequests + 1;
            var sql = "UPDATE visits SET maxRequests = ? WHERE ID = ?;";
            db.query(sql, [maxRequests, vid], function (err, result) {
                if (err) throw err;
            });
        });
    }
    var sql = "UPDATE requests SET status = ? WHERE ID = ?;";
    db.query(sql, [status, rid], function (err, result) {
        if (err) throw err;
        res.status(200).send({ "status": true, "Message": "Request Status Updated!" });
    });
});

app.listen(3000);