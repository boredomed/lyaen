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

//creating user
app.post('/users', function(req, res){
  let name = req.body.name;
 
  let quer = "Insert into users (Name) VALUES( '"+ name +"')";
  db.query(quer,function(err,result){
    if (err) throw err;
    else res.send("User created");	
  });

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

//getting a particular user
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

//Visitors Code
//getting all visits data
app.get('/visits', function(req, res){
  db.query("Select * from visits", function(err,result){
  
  if (err) throw err
  if(result.length > 0){
	res.send(result);
  }
  else console.log("No current visit");
  });
});

//posting a visits
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

//getting all requests data shughal
app.get('/requests', function(req, res){
  db.query("Select * from requests", function(err,result){
  
  if (err) throw err
  if(result.length > 0){
	res.send(result);
  }
  else console.log("No current requests");
  });
});

//getting requests for a particular visit
app.get('/users/:id/visit/:vid/requests', function(req, res){
  let vid = req.params.vid;
  db.query("Select * from requests where VID = " + vid , function(err,result){
  
  if (err) throw err
  if(result.length > 0){
	res.send(result);
  }
  else console.log("No current requests");
  });
});

//updating status of reuest ie accepting and declining ie using put
app.put('/users/:id/visit/:vid/request/:rid', function(req, res){
  let rid = req.params.rid;
  let status = req.body.status;

  let quer = "Update requests set Status = '"+status+"' where ID = " + rid;

  db.query(quer,function(err,result){
    if (err) throw err;
  	res.send("Request status set");	
  });
});


//Requester part
//posting request
app.post('/visits/:vid/requests', function(req, res){
  let vid = req.params.vid;
  let desc = req.body.desc; 
  let uid = req.body.uid;

  let quer = "Insert into requests (Description, UID, VID) VALUES( '"+ desc +"', "+uid+", "+vid+")";
  db.query(quer,function(err,result){
    if (err) throw err;
    else res.send("Request created");	
  });

});

//getting all requests for that user
app.get('/users/:id/requests', function(req, res){
  let uid = req.params.id;
  console.log(uid);
  db.query("Select * from requests where UID = " + uid , 

function(err,result){
  
  if (err) throw err
  if(result.length > 0){
	res.send(result);
  }
  else console.log("No requests posted");
  });
});

//Requester accepting/declining requests that were unavailable
app.put('/users/:id/requests/:rid', function(req, res){
  let rid = req.params.rid;
  let status = req.body.status;
  db.query("Update requests set Status = '"+status+"' where ID = " + rid, 
function(err,result){
  if (err) throw err
  else res.send("Request status changed from Not available");
});

});

//Completing a visit and earning points
app.put('/users/:id/visit/:vid', function(req, res){

  let uid = req.params.id;
  let vid = req.params.vid;
  let status = req.body.status;

  //finding if any request is marked 'not available'
  let quer = "select count(Status) as coun from requests where Status = 'Not Available' and VID = " + vid + " and UID = " + uid;
  //update visits
  let quer1 = "update visits set Status = '"+status+"' where ID = " + vid + " and UID = " + uid;
  //calculating the total completed 
  let quer2 = "select count(Status) as coun1 from requests where Status = 'Completed' and VID = " + vid + " and UID = " + uid;

  db.query(quer, function(err, result){

  count = result[0]["coun"];
  if (err) throw err;
  else{
	if(count > 0){
		res.send("Request cannot be completed as some request are marked Not available");
	}else{ 
		// req complete
		// Updating status of visit
		db.query(quer1, function(err, result1){
		  if(err) throw err;
		  else res.send("Visit marked Completed");
		});

		db.query(quer2, function(err, result2){

			countComp = result2[0]["coun1"];
			let points;

			if(countComp == 0){
				points = 0;
			}
			else if(countComp > 0){
				reqPoint = countComp*5;
				points = 5 + reqPoint;
			}
			console.log(points);

			//points
			let quer3 = "update users set points = " + points + " where ID =" + uid;

			//Updating points of user
			db.query(quer3, function(err, result){
			  if(err) throw err;
			  else console.log("Updated points");
			});
				
		});
	     }
      }
});
});


app.listen(3000);
