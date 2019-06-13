var express = require('express');
var mysql = require('mysql');
var app = express();

var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "seecs123",
    database: "nodeapp"
});

db.connect(function(err){
    if (err) throw err;
    console.log("Connected");
});
app.use(express.json());

app.get('/users', function (req, res) {
    var sql = "select * from users;";
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No user found!");
    })
    //res.end();
});

app.get('/users/:uid', function(req, res){
    var UID = req.params.uid;
    var sql = "select * from users where ID=" + UID;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No user found!");
    });
});

app.get('/visits', function (req, res) {
    var sql = "select * from visits;";
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No visit found!");
    })
    //res.end();
});

app.get('/users/:uid/visits', function(req, res){
    var UID = req.params.uid;
    console.log(UID);
    var sql = "select * from visits where UID=" + UID;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No visit by you found!");
    });
});

app.get('/users/:uid/visits/:vid', function(req, res){
    var UID = req.params.uid;
    var VID = req.params.vid
    console.log(UID);
    var sql = "select * from visits where UID=" + UID + " and ID=" + VID;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No visit by you with given Visit ID!");
    });
});

app.get('/requests', function (req, res) {
    var sql = "select * from requests;";
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No request found!");
    })
    //res.end();
});

app.get('/users/:uid/requests', function(req, res){
    var UID = req.params.uid;
    var sql = "select * from requests where UID=" + UID;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No request by you found!");
    });
});

app.get('/users/:uid/requests/:rid', function(req, res){
    var UID = req.params.uid;
    var RID = req.params.rid;
    var sql = "select * from requests where UID=" + UID + " and ID=" + RID;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No request by you with given Request ID!");
    });
});

app.post('/users',function(req, res){
    var name = req.body.name;
    var sql = "INSERT into users (Name) values ('" + name + "');";
    db.query(sql, function(err, result){
        if (err) throw err;
        res.send("User added Successfully!");
    });
});

app.post('/users/:uid/visit', function(req, res){
    var UID = req.params.uid;
    var description = req.body.description;
    var destination = req.body.destination;
    var timestamp = req.body.timestamp;
    var sql = "INSERT into visits (Description, Destination, Timestamp, UID) values ('" + description + "','" + destination + "','" + timestamp + "'," + UID +");";
    db.query(sql, function(err, result){
        if (err) throw err;
        res.send("Your visit is registered!");
    });
});

app.post('/visits/:vid/request', function(req, res){
    var VID = req.params.vid;
    var description = req.body.description;
    var UID = req.body.uid;
    var sql = "INSERT into requests (Description, UID, VID) values ('"+ description +"',"+ UID +"," + VID + ");";
    db.query(sql, function(err, result){
        if (err) throw err;
        res.send("Your Request to visit having ID "+ VID + " submitted successfully!");
    });
});

app.listen(3000);