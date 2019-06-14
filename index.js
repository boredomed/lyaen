var express = require('express');
var mysql = require('mysql');
var app = express();

var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "seecs123",
    database: "lyaen"
});

db.connect(function(err){
    if (err) throw err;
    console.log("Connected");
});
app.use(express.json());

app.get('/',function(req, res){
    res.send("Welcome to Lyaen API.");
});

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
    var uid = req.params.uid;
    var sql = "select * from users where ID=" + uid;
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

app.get('/visits/:vid', function (req, res) {
    var vid = req.params.vid;
    var sql = "select * from visits WHERE ID = " + vid;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No visit found!");
    })
    //res.end();
});

app.get('/users/:uid/visits', function(req, res){
    var uid = req.params.uid;
    var sql = "select * from visits where UID=" + uid;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No visit by you found!");
    });
});

app.get('/users/:uid/visits/:vid', function(req, res){
    var uid = req.params.uid;
    var vid = req.params.vid
    var sql = "select * from visits where UID=" + uid + " and ID=" + vid;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No visit by you with given Visit ID!");
    });
});

app.get('/users/:uid/visits/:vid/requests', function(req, res){
    var vid = req.params.vid;
    var sql = "select * from requests where VID = " + vid;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No Requests on your visit till now!");
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
    var uid = req.params.uid;
    var sql = "select * from requests where UID=" + uid;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        if (result.length > 0) res.send(result);
        else res.send("No request by you found!");
    });
});

app.get('/users/:uid/requests/:rid', function(req, res){
    var uid = req.params.uid;
    var rid = req.params.rid;
    var sql = "select * from requests where UID=" + uid + " and ID=" + rid;
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
    var uid = req.params.uid;
    var description = req.body.description;
    var destination = req.body.destination;
    var timestamp = req.body.timestamp;
    var sql = "INSERT into visits (Description, Destination, Timestamp, UID) values ('" + description + "','" + destination + "','" + timestamp + "'," + uid +");";
    db.query(sql, function(err, result){
        if (err) throw err;
        res.send("Your visit is registered!");
    });
});

app.post('/visits/:vid/request', function(req, res){
    var vid = req.params.vid;
    var description = req.body.description;
    var uid = req.body.uid;
    var sql = "INSERT into requests (Description, UID, VID) values ('"+ description +"',"+ uid +"," + vid + ");";
    db.query(sql, function(err, result){
        if (err) throw err;
        res.send("Your Request to visit having ID "+ vid + " submitted successfully!");
    });
});

app.put('/users/:uid/visits/:vid/requests/:rid', function(req, res){
    var rid = req.params.rid;
    var status = req.body.status;
    var sql = "UPDATE requests SET status = '" + status + "' WHERE ID = " + rid;
    db.query(sql, function(err, result){
        if (err) throw err;
        res.send("Request Status Updated!");
    });
});

app.put('/users/:uid/visits/:vid', function(req, res){
    var uid = req.params.uid;
    var vid = req.params.vid;
    var status = req.body.status;
    var sql = "SELECT count(*) as notavailable from requests WHERE status = 'Not Available' and VID = " + vid;
    db.query(sql, function(err, result, fields){
        if (err) throw err;
        var na_requests = result[0]["notavailable"];
        if (na_requests > 0){
            res.send("Sorry! You cannot complete a visit. There are " + na_requests + " requests pending on your visit.")
        }
        else {
            var sql = "SELECT count(*) as completed from requests WHERE status = 'Completed' and VID = " + vid;
            db.query(sql, function(err, result, fields){
                if (err) throw err;
                var completed_requests = result[0]["completed"];
                console.log(completed_requests);
                if (completed_requests > 0){
                    var points = (completed_requests * 5) + 5; 
                    var sql = "UPDATE users SET points = " + points + " WHERE ID = " + uid;
                    db.query(sql, function(err, result){
                        if (err) throw err;
                        res.send("Visit Status Updated!")
                    })
                }
                var sql = "UPDATE visits SET status = '" + status + "' WHERE ID = " + vid;
                db.query(sql, function(err, result){
                    if (err) throw err;
                    res.send("Visit Status Updated!");
                });
            });        
        }
    });
});

app.put('/users/:uid/requests/:rid', function(req, res){
    var uid = req.params.uid;
    var rid = req.params.rid;
    var status = req.body.status;
    var sql = "UPDATE requests SET status = '" + status + "' WHERE ID = " + rid;
    db.query(sql, function(err, result){
        if (err) throw err;
        res.send("Request Status Updated!");
    });
});

app.listen(3000);