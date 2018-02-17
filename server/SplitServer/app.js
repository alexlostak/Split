
/*
 * Server Sided NodeJS
 */

 /* Dependencies */
 var express = require('express');
 var path = require('path');
 var app = express();
 var serv = require('http').Server(app);
 var bodyParser = require('body-parser');
 var braintree = require("braintree");
 var cookieParser = require('cookie-parser'); 
 
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended: false }));
 app.use(cookieParser());

 var MongoClient = require('mongodb').MongoClient;
 var url = "mongodb://localhost:27017/myTestDB";
 var dbo ;
 var restCollection;  // db collection of restaurants

// var mongoClient = new MongoClient(new Server('localhost', 27017));
// mongoClient.open(function(err, mongoClient) {
//   var db1 = mongoClient.db("myTestDB");

//   mongoClient.close();
// });

 init();
 //addRestaurantToDB("Kerby Lanes", 150)


// make all initialization operations
function init(){
  connectToDB();  // connects to mongoDB. makes sure that dbo gets the database
  //setTimeout(addRestaurantToDB("p-terrys", 100), 3000);
}

app.get("/addNewRestaurant", function (req, res) {
  addRestaurantToDB("p-terrys", 100);
  res.send(getRestaurantFromDB("Kerby Lanes")); // TODO: fix. produces same error of stringify.
});


function connectToDB() {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database connected!");
    dbo = db.db("myTestDB");

    /*var newRest = { name: "Kerby Lanes", capacity: 150};
    dbo.collection("restaurants").insertOne(newRest, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");    
    });*/

    //restCollection = dbo.collection("restaurants");
    // TODO close DB ?
  });
}

function addRestaurantToDB(restName, restCapacity){
  var newRest = { name: restName, capacity: restCapacity };
  dbo.collection("restaurants").insertOne(newRest, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");    
  });
}

function getRestaurantFromDB(restName){
  return dbo.collection("restaurants").find(restName);
}

//braintree
var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "7yscfj8n3rd947jj",
  publicKey: "6q5yzrv75wqwwssq",
  privateKey: "4d11fbce8b80fdf9f3d9b55370247884"
});

/* Set up Server and Routes */
app.get('/',function(req, res) {
  res.sendFile(path.join(__dirname,"index.html"));
});
app.use('/client', express.static('client'));
var port = process.env.PORT || 80;  //tries to fetch port from env. variables, otherwise 80
serv.listen(port); //Start server on port
console.log("Server started.");

/*** braintree related interaction  ***/
/* provide client with token */
app.get("/client_token", function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    res.send(response.clientToken);
  });
});

/* process a sale(checkout) */
app.post("/checkout", function (req, res, next) {
  var nonceFromTheClient = req.body.paymentMethodNonce;
  var amount = req.body.amount;
  console.log("amount is: " + amount);
  // Make sale
  var newTransaction = gateway.transaction.sale({
    amount: amount,
    paymentMethodNonce: nonceFromTheClient,
    options: {
      submitForSettlement: true
    }
  }, function (error, result) {
    if (result) {
      console.log("transaction succeeded");
      console.log(result);
      res.send(result);  
    } else {
      console.log("transaction failed");
      res.status(500).send(error);
    }
  });
});