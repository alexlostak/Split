
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