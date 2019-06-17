var express = require('express');
var app = express();
var session = require('express-session');
var router = express.Router();
var mysql = require('mysql');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'seecs@123',
  database: 'nodeapp'
});

//connection created
db.connect(function (err) {
  if (err) throw err;
  console.log('Connected to database');
});

//creating user
app.post('/users', function (req, res) {
  let name = req.body.name;

  let quer = "Insert into users (Name) VALUES(?)";
  db.query(quer,[name], function (err, result) {
    if (err) throw err;
    res.send("User created");
  });

});

//all users
app.get('/users', function (req, res) {
  db.query("Select * from users", function (err, result) {

    if (err) throw err
    res.send(result);
  });
});

//getting a particular user
app.get('/users/:id', function (req, res) {
  let id = req.params.id;
  let quer = "Select * from users where ID = ?";
  db.query(quer,[id], function (err, result) {

    if (err) throw err
    res.send(result);
  });

});

//Visitors Code
//getting all visits data
app.get('/visits', function (req, res) {
  db.query("Select * from visits where Status != 'Completed'", function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});

//posting a visits
app.post('/users/:uid/visit', function (req, res) {
  let uid = req.params.uid;
  let desc = req.body.desc,
    dest = req.body.dest, time = req.body.time;

  let quer = "Insert into visits (Description, Destination, Timestamp, UID) VALUES(?,?,?,?)";

  db.query(quer,[desc, dest, time, uid], function (err, result) {
    if (err) throw err;
    res.send(result);
  });

});

//getting all requests data shughal
app.get('/requests', function (req, res) {
  db.query("Select * from requests", function (err, result) {

    if (err) throw err
    res.send(result);
  });
});

//getting requests for a particular visit posted by a user
app.get('/users/:id/visit/:vid/requests', function (req, res) {
  let vid = req.params.vid;
  db.query("Select * from requests where VID = ?", [vid], function (err, result) {

    if (err) throw err
    res.send(result);
  });
});

//updating status of request ie accepting and declining or completed ie using put
app.put('/users/:id/visit/:vid/request/:rid', function (req, res) {
  let rid = req.params.rid;
  let status = req.body.status;

  let quer = "Update requests set Status = ? where ID = ?";

  db.query(quer, [status, rid], function (err, result) {
    if (err) throw err;
    res.send("Request status set to " + status);
  });
});


//Requester part

//posting request on a particular visit
app.post('/visits/:vid/requests', function (req, res) {
  let vid = req.params.vid;
  let desc = req.body.desc;
  let uid = req.body.uid;

  let quer = "Insert into requests (Description, UID, VID) VALUES( ?,?,?)";
  db.query(quer,[desc, uid, vid], function (err, result) {
    if (err) throw err;
    else res.send("Request created");
  });

});

//getting all requests for that user
app.get('/users/:id/requests', function (req, res) {
  let uid = req.params.id;
  console.log(uid);
  db.query("Select * from requests where UID = ?",

    function (err,[uid], result) {
      if (err) throw err
      res.send(result);
    });
});

//Requester completing/declining requests that were unavailable
app.put('/users/:id/requests/:rid', function (req, res) {
  let rid = req.params.rid;
  let status = req.body.status;
  db.query("Update requests set Status = ? where ID = ?",[status, rid],
    function (err, result) {
      if (err) throw err;
      res.send("Request status changed from Not available");
    });

});

//Completing a visit and earning points
app.put('/users/:id/visit/:vid', function (req, res) {

  let uid = req.params.id;
  let vid = req.params.vid;
  let status = req.body.status;

  //finding if any request is marked 'not available'
  let quer = "select count(Status) as coun from requests where (Status = 'Not Available' OR 'Accepted' OR 'Requested') and VID = ?";
  //update visits
  let quer1 = "update visits set Status = ? where ID = ?";
  //calculating the total completed 
  let quer2 = "select count(Status) as coun1 from requests where Status = 'Completed' and VID = ?";

  db.query(quer,[vid], function (err, result) {

    count = result[0]["coun"];
    if (err) throw err;
      if (count > 0) {
        res.send("Visit cannot be completed as  " + count +
         " request not marked completed or rejected");
      } else {
        // req complete
        // Updating status of visit
        db.query(quer1,[status, vid], function (err, result1) {
          if (err) throw err;
          res.send("Visit marked " + status);
        });

        db.query(quer2,[vid], function (err, result2) {

          //get points 
          let quer3 = "Select Points from users where uid = ?";
          let initPoints = 0;
          db.query(quer3, [uid], function(err, result){
            initPoints = result['Points'];
          });

          countComp = result2[0]["coun1"];
          let points = initPoints;

          if (countComp == 0) {
            points = initPoints + 0;
          }
          else if(countComp > 0) {
            reqPoint = countComp * 5;
            points = 5 + reqPoint;
          }
          console.log(points);

          //points
          let quer4 = "update users set points = ? where ID = ?";

          //Updating points of user
          db.query(quer4,[points, uid], function (err, result) {
            if (err) throw err;
            console.log("Updated points");
          });

        });
      }
  });
});


app.listen(3000);
