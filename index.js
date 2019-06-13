var express = require('express');
var app = express();
var session = require('express-session');
var router = express.Router();
var mysql = require('mysql');

var bodyParser = require('body-parser');
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
})); 

const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: 'seecs@123',
    database: 'nodeapp'
});

//connection created
db.connect(function(err){
    if (err) throw err;
    console.log('Connected to database');
});

//all users
app.get('/users', function(req, res){
  db.query("Select * from users", function(err,result){
  
  if (err) throw err
  if(result.length > 0){
	res.send(result);
  }
  else console.log("No User Found");
  });
});

//accesing a particular user
app.get('/users/:id', function(req, res){
  let id = req.params.id;
  let quer = "Select * from users where ID =" + id;
  db.query(quer,function(err,result){
  
  if (err) throw err
  if(result.length > 0){
	res.send(result);
  }
  else console.log("No User Found");
  });

});

app.post('/users/:uid/visit', function(req, res){
  let uid = req.params.uid;
  let desc = req.body.desc, 
           dest = req.body.dest, time = req.body.time; 

  let quer = "Insert into visits (Description, Destination, Timestamp, UID) VALUES( '"+ desc +"', '" +dest+ "', '"+time+"', "+uid+" )";

  db.query(quer,function(err,result){
    if (err) throw err;
  	res.send(result);	
  });

});

app.get('/visits', function(req, res){
  db.query("Select * from visits", function(err,result){
  
  if (err) throw err
  if(result.length > 0){
	res.send(result);
  }
  else console.log("No current visit");
  });
});

app.listen(3000);
