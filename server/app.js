const express = require('express')
const app = express()
var path = require('path');
var serv = require('http').Server(app);
var bodyParser = require('body-parser');
var braintree = require("braintree");
var MongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/SplitServer";
var dbo;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(80, () => console.log('listening on port 80!'));

connectToDB();  // connects to mongoDB. makes sure that dbo gets the database

/***** Set up Server and Routes (API calls) *****/
app.get('/',function(req, res) {
  res.sendFile(path.join(__dirname,"index.html"));
});

/*** Constructor APIs ***/

app.post("/postTest", function (req, res) {
  console.log(req);
  console.log(req.body);
  console.log(req.body.cc_code);
  res.send({"response": "aight"}); // TODO: fix. produces same error of stringify.
});

app.get("/createRestaurant", function (req, res) {
  addRestaurantToDB("p-terrys2", 300, "guad", ["table1", "table2", "table3"]);
  //addRestaurantToDB(req.body.restName, req.body.restCapacity, req.body.restLocation, req.body.restTables)
  res.send({"p-terrys2": "good"}); 
});

app.get("/createMenu", function (req, res) {
  // addMenuToDB(req.body.menuName, req.body.restID, req.body.menuType)  
  addMenuToDB("breakfast", 1, "breakfast");
  res.send("success"); // TODO: fix. produces same error of stringify.
});

app.get("/createItem", function (req, res) {
  // addItemToDB(req.body.itemName, req.body.menuID, req.body.restID, req.body.itemType, req.body.price, req.body.description, req.body.isGluten, req.body.isDairy, req.body.isShellfish, req.body.isNuts);
  addItemToDB("Potatoes", 2, 1, "Appetizer", 5, "yummy dish", false, false, false, false);
  addItemToDB("Creamed Spinach", 2, 1, "Appetizer", 7, "yummy dish", false, false, false, false);
  addItemToDB("Hamburger", 2, 1, "Main", 5, "seven patties on a warm brioche with a side of creamy spinach", false, false, false, false);	
  res.send("created item");
});

app.get("/createTab", function (req, res) {
  addTabToDB(parseInt(req.body.restID),parseInt(req.body.tableID));
  //addTabToDB(1,1);
  res.send("tab created"); 
});

app.get("/createUser", function (req, res) {
  // addTabToDB(req.body.restID,req.body.tableID);
  // names to lower case?
  addUserToDB("john1", "john", "doe", "Pass1234");
  res.send("User Created"); 
});

/*** Getter APIs ***/

// given a tabID, sends back a tab JSON object
app.post("/getTab", function (req, res) {
   console.log(parseInt(req.body.tabID));
   dbo.collection("tabs").findOne({tabID : parseInt(req.body.tabID)}, function(err, result) {    
     res.send(result); 
   });
});

app.post("/getRest", function (req, res) {
	   console.log(parseInt(req.body.restID));
	   dbo.collection("restaurants").findOne({restID : parseInt(req.body.restID)}, function(err, result) {
		        res.send(result);
		      });
});

app.get("/getMenu", function (req, res) {
    dbo.collection("items").find({}).toArray(function(error, documents) {
      if (error) throw error;
      res.send(documents);
    });
});

/*** Setter APIs ***/

// given a tabID, sends back a tab JSON object
app.get("/addUserToTab", function (req, res) {
  //TODO this function
  //addUserToTab()
  
  res.send("added user to tab"); 
  

});

app.get("/addItemToTab", function (req, res) {
  //TODO this function
  //addItemToTab(req.body.tabID, req.body.itemID)
  addItemToTab(1, 1);
  addItemToTab(1, 2);
  addItemToTab(1, 3);

  res.send("added item to tab"); 

});

app.post("/claimItem", function (req, res) {
  //TODO this function

  claimItem(parseInt(req.body.userID), parseInt(req.body.tabItemID), parseInt(req.body.tabID));
  console.log(req.body.userID);
  console.log(req.body.itemID);
  console.log(req.body.tabID);

	console.log(typeof req.body.userID);
	  console.log(typeof req.body.itemID);
	  console.log(typeof req.body.tabID);
  //claimItem(2, 1, 1);
  res.send("claimed item"); 

});

/*** Delete APIs ***/

app.get("/removeItemFromTab", function (req, res) {
  //TODO this function 
  //removeItemFromTab(req.body.tabID, req.body.itemID)
  removeItemFromTab(1, 5);
  res.send("removed item from menu"); 
});

app.get("/removeItemFromMenu", function (req, res) {
  //TODO this function
  //removeItemFromDB(req.body.itemID)
  res.send("removed item from menu"); 
});

app.post("/unclaimItem", function (req, res) {
  unclaimItem(parseInt(req.body.userID), parseInt(req.body.tabItemID), parseInt(req.body.tabID));
  //unclaimItem(2, 1, 1);
  res.send("unclaimed item"); 
});

/*** Split Checkout API ***/

// receives a tabID
app.get("/splitCheckout", function (req, res) {
  //TODO this func
  // TODO make all users pay. (add tab/amount to their history?). have restaurant revenue?
  //dbo.collection("tabs").updateOne({tabID : req.body.tabID}, { $set: {activeTab : tabID}}, function(err, res) {
  dbo.collection("tabs").updateOne({tabID : 1}, { $set: {status : "closed"}}, function(err, res2) {
      if (err) throw err;
      //console.log("succesful tab checkout for tab " + req.body.tabID);
      console.log("succesful tab checkout");
      res.send("succesful tab checkout");
  });
});


app.get("/reopenTab", function (req, res) {
	dbo.collection("tabs").updateOne({tabID : 1}, { $set: {status : "open"}}, function(err, res2) {
	if (err) throw err;
	        console.log("succesful tab reopen");
	        res.send("succesful tab reopen");
	});
});

/******* Database related functions *******/

function connectToDB() {
  MongoClient.connect(url,{auth: {user: 'dbadmin', password: 'startup$2018'}}, function(err, db) {
  //MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database connected!");
    dbo = db.db("SplitServer");

    //db.authenticate("dbadmin", "startup$2018", function(err, res) {
//	    if (err) throw err;
//	    console.log("db authenticated");
  //  });
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

function removeItemFromDB(itemID){
  dbo.collection("items").deleteOne({itemID : itemID}, { $set: {activeTab : tabID}}, function(err, res) {
      if (err) throw err;
      console.log("item removed from database");
    });
}

// receives restID and tableID and returns a tabID, or an error if tableID is currently in use
// AKA CreateTab
// status can have open/closed (any other thing?)
// cleaimed items is a list of this type: {itemID:[userID, userID]}
function addTabToDB(tableID, restID){
  // ensure restID and tableID exist
  dbo.collection("config").findOne({tabID : { $exists: true }}, function(err, result) {
    var newTab = {tabID : result.tabID , restID : restID, tableID : tableID, status : "open", itemList : [], claimedItems : []};
    dbo.collection("tabs").insertOne(newTab, function(err, res) {
      if (err) throw err;
      // increment counter
      dbo.collection("config").updateOne({tabID : result.tabID}, { $set: {tabID :  result.tabID + 1}}, function(err, res) {
        if (err) throw err;
        console.log("tab counter incremented");
      });
      console.log("a tab was created");
    });
  }) 
}

// add user to database
function addUserToDB(userName, firstName, lastName, password){
  // TODO ensure unique name?
  dbo.collection("config").findOne({userID : { $exists: true }}, function(err, result) {
    newUser = {userID : result.userID, userName : userName, activeTab : null, tabHistory: [], firstName : firstName, lastName : lastName, frinedList : [], password : password}
    dbo.collection("users").insertOne(newUser, function(err, res) {
      if (err) throw err;
      // increment counter
      dbo.collection("config").updateOne({userID : result.userID}, { $set: {userID :  result.userID + 1}}, function(err, res) {
        if (err) throw err;
        console.log("user counter incremented");
      });
      console.log("a user was created");
    });
  }); 
}



// receives userID and a tabID, returns 1 for success, 0 otherwise
function addUserToTab(tabID, userID){
  // TODO ensure tabid and userID exist
  // TODO check if user already has an active tab
  dbo.collection("users").updateOne({userID : userID}, { $set: {activeTab : tabID}}, function(err, res) {
        if (err) throw err;
        console.log("user actived tab");
      });
}

// receives userID and a tabID, returns 1 for success, 0 otherwise
function removeUserFromTab(tabID, userID){
  // TODO ensure tabid and userID exist
  // TODO check if user has tabID as its active tab
  // assume that user has no claimed items
    dbo.collection("users").updateOne({userID : userID}, { $set: {activeTab : null}}, function(err, res) {
        if (err) throw err;
        console.log("user deactivated tab");
      });
}

// receives tabID and itemID return 1 for success, 0 otherwise
function addItemToTab(tabID, itemID){
    // TODO ensure tabid and itemID exist    
  dbo.collection("config").findOne({tabItemID : { $exists: true }}, function(err, result) {
    dbo.collection("tabs").updateOne({tabID : tabID}, { $push: {claimedItems: {tabItemID : result.tabItemID, itemID : itemID, userList : []}}}, function(err, res) {
        if (err) throw err;
        console.log("added item to tab");
        dbo.collection("config").updateOne({tabItemID : result.tabItemID}, { $set: {tabItemID :  result.tabItemID + 1}}, function(err, res2) {
          if (err) throw err;
          console.log("item counter incremented");
        });      
      });
  });

  

  dbo.collection("items").findOne({itemID : itemID}, function(err, result) {
     dbo.collection("tabs").updateOne({tabID : tabID}, { $push: {itemList : result}}, function(err, res) {
        if (err) throw err;
        console.log("added item to tab item list");
      });
  });
}

// receives tabID and itemID return 1 for success, 0 otherwise
function removeItemFromTab(tabID, itemID){
  //TODO make sure that we delete from claimedItems
  dbo.collection("tabs").updateOne({tabID : tabID}, { $pull: {itemList : itemID}, $pull: {claimedItems : {itemID:itemID}}  }, function(err, res) {
        if (err) throw err;
        console.log("removed item from tab");
      });
}

// receives userID, itemID, and tabID, returns 1 for success, 0 otherwise
function claimItem(userID, tabItemID, tabID){
  //TODO check if item taken already. return 0 if it is.
  //TODO check if status of tab has been changed
  dbo.collection("tabs").updateOne({tabID : tabID, 'claimedItems.tabItemID' : tabItemID}, { $push: {'claimedItems.$.userList' : userID }}, function(err, res) {
        if (err) throw err;
        console.log("claimed item");
      });
}

// receives userID, itemID, and tabID, returns 1 for success, 0 otherwise
function unclaimItem(userID, tabItemID, tabID){
  // TODO check if status of tab has been changed
  dbo.collection("tabs").updateOne({tabID : tabID, 'claimedItems.tabItemID' : tabItemID}, { $pull: {'claimedItems.$.userList' : userID }}, function(err, res) {
        if (err) throw err;
        console.log("unclaimed item");
      });
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
