const express = require('express')
const app = express()
var path = require('path');
var serv = require('http').Server(app);
var bodyParser = require('body-parser');
var braintree = require("braintree");
var MongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/myTestDB";
var dbo ;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(3000, () => console.log('listening on port 3000!'));

connectToDB();  // connects to mongoDB. makes sure that dbo gets the database

/* Set up Server and Routes */
app.get('/',function(req, res) {
  res.sendFile(path.join(__dirname,"index.html"));
});

/******* Database related functions *******/
app.get("/addNewRestaurant", function (req, res) {
  addRestaurantToDB("p-terrys2", 300, "guad", ["table1", "table2", "table3"]);
  res.send({"Kerby Lanes": "good"}); // TODO: fix. produces same error of stringify.
});


function connectToDB() {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database connected!");
    dbo = db.db("myTestDB");
  });
}

/*** Constructors ***/
// returns -1 if restaurant and locatio name exists
// return -2 if restName is null
function addRestaurantToDB(restName, restCapacity, restLocation, restTables, restMenus){
  // TODO check if location and restaurant exist
  // dbo.collection("config").findOne({}, function(err, result) {
  //   if (err) throw err;
  //   console.log(result);
  //   db.close();
  // });

//  var test = dbo.collection("config").find("restaurantID");
  console.log("THIS IS IT " + test);
  //if(dbo.collection("config").find(restaurantID))
  // TODO generate unique restaurantID
  console.log(restTables);    
  if (restCapacity == null)
    restCapacity = 0
  if (restLocation == null)
    restLocation = 0
  var newRest = { name: restName, capacity: restCapacity , location : restLocation, tables : restTables, menus : restMenus};
  dbo.collection("restaurants").insertOne(newRest, function(err, res) {
    if (err) throw err;
    console.log("a restaurant was created");
  });
}







function getRestaurantFromDB(restName){
  return dbo.collection("restaurants").find(restName);
}


/******* braintree related interaction  *******/

// braintree keys
var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "7yscfj8n3rd947jj",
  publicKey: "6q5yzrv75wqwwssq",
  privateKey: "4d11fbce8b80fdf9f3d9b55370247884"
});

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
      res.send(result);  
    } else {
      console.log("transaction failed");
      res.status(500).send(error);
    }
  });
});