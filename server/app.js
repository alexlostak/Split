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

app.listen(80, () => console.log('listening on port 80!'));

connectToDB();  // connects to mongoDB. makes sure that dbo gets the database

/* Set up Server and Routes */
app.get('/',function(req, res) {
  res.sendFile(path.join(__dirname,"index.html"));
});

/******* Database related functions *******/
app.get("/addNewRestaurant", function (req, res) {
  //addRestaurantToDB("p-terrys2", 300, "guad", ["table1", "table2", "table3"]);
  addMenuToDB("breakfast", 1, "breakfast");
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
function addRestaurantToDB(restName, restCapacity, restLocation, restTables){
  // TODO check if location and restaurant exist  
  dbo.collection("config").findOne({restaurantID : { $exists: true }}, function(err, result) {
    if (err) throw err;
    var restID = result.restaurantID;
    if (restCapacity == null)
      restCapacity = 0
    if (restLocation == null)
      restLocation = 0
    var newRest = {restID : restID, name: restName, capacity: restCapacity , location : restLocation, tables : restTables};
    dbo.collection("restaurants").insertOne(newRest, function(err, res) {
      if (err) throw err;
      // increment counter
      var myquery = { restaurantID : restID};
      var newRestID = restID + 1;
      var newvalues = { $set: {restaurantID :  newRestID}};
      dbo.collection("config").updateOne(myquery, newvalues, function(err, res) {
        if (err) throw err;
        console.log("restaurant counter incremented");
      });
      console.log("a restaurant was created");
    });
  })
}

// examples for menuType: 'breakfast', 'happy hour'
function addMenuToDB(menuName, restID, menuType){
  dbo.collection("config").findOne({menuID : { $exists: true } }, function(err, result) {
    // TODO check if restID actually exists
    var newMenu = {restID : restID, menuName : menuName, menuID : result.menuID, menuType : menuType}
    dbo.collection("menus").insertOne(newMenu, function(err, res) {
      if (err) throw err;
      // increment counter
      dbo.collection("config").updateOne({ menuID : result.menuID}, { $set: {menuID :  result.menuID + 1}}, function(err, res) {
        if (err) throw err;
        console.log("menu counter incremented");
      });
      console.log("a menu was created");
    });
  })
}

// itemType example: 'drink', 'add-on', 'main', 'burgers'. In other words, the section in menu.
// price gotta be float
function addItemToDB(itemName, menuID, restID, itemType, price, description, isGluten, isDairy, isShellfish, isNuts){
  // TODO: ensure menuID and restID exist
  dbo.collection("config").findOne({itemID : { $exists: true }}, function(err, result) {
    var newItem = {itemID : result.itemID , itemName: itemName, menuID : menuID, restID : restID, itemType : itemType, price : price, description : description, isGluten : isGluten, isDairy : isDairy, isShellfish : isShellfish, isNuts : isNuts}
    dbo.collection("items").insertOne(newItem, function(err, res) {
      if (err) throw err;
      // increment counter
      dbo.collection("config").updateOne({itemID : result.itemID}, { $set: {itemID :  result.itemID + 1}}, function(err, res) {
        if (err) throw err;
        console.log("item counter incremented");
      });
      console.log("an item was created");
    });
  })
}

// receives restID and tableID and returns a tabID, or an error if tableID is currently in use
// AKA CreateTab
function addTabToDB(){

}

// receives userID and a tabID, returns 1 for success, 0 otherwise
function addUserToTab(){

}

// receives userID and a tabID, returns 1 for success, 0 otherwise
function removeUserFromTab(){

}

// receives tabID and itemID return 1 for success, 0 otherwise
function addItemToTab(){

}

// receives tabID and itemID return 1 for success, 0 otherwise
function removeItemFromTab(){

}

// receives userID, itemID, and tabID, returns 1 for success, 0 otherwise
function claimItem(){
  //TODO check if item taken already. return 0 if it is.
  //TODO check if status of tab has been changed
}

// receives userID, itemID, and tabID, returns 1 for success, 0 otherwise
function unClaimItem(){
  // TODO check if status of tab has been changed
  // TODO 
}

// receives an itemID, userID, tabID, numOf
function split(){

}


// DB retreival functions
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