var express = require('express');
var app = express();


let visits = new Object();
app.get('/', function(req, res){
    let user = req.query.name;
    if (visits[user]){
        visits[user] = visits[user] + 1;
    }
    else{
        visits[user] = 1;
    }
   res.write('Hello ' + user + ". You have visited " + visits[user] + " times.");
   res.end();
});
app.listen(3000);