var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var server = require('http').Server(app);
var app = express();

var braintree = require("braintree");


//braintree
var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "7yscfj8n3rd947jj",
  publicKey: "7yscfj8n3rd947jj",
  privateKey: "4d11fbce8b80fdf9f3d9b55370247884"
});
// generate student token
app.get("/client_token", function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    res.send(response.clientToken);
  });
});

/* process a sale(checkout) */
app.post("/checkout", function (req, res) {
  var nonceFromTheClient = req.body.paymentMethodNonce;
  var amount = req.body.amount;
  console.log("amount is: " + amount);
  // Make sale
  var result = gateway.transaction.sale({
  amount: amount,
  paymentMethodNonce: nonceFromTheClient,
  options: {
    submitForSettlement: true
  }
  }, function (err, result) {
      if (result) {
        res.send(result);
  console.log("transaction succeeded");
      } else {
  console.log("transaction failed");
        res.status(500).send(error);
      }
  });
});


/* Set up Server and Routes */
app.get('/',function(req, res) {
  res.sendFile(path.join(__dirname,"index.html"));
});

//for client
app.use('/client', express.static('client'));
var port = process.env.PORT || 80;  //tries to fetch port from env. variables, otherwise 80
server.listen(port); //Start server on port
console.log("Server started.");


//braintree token the hard one TODO
// gateway.clientToken.generate({
//   customerId: aCustomerId
// }, function (err, response) {
//   var clientToken = response.clientToken
// });




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;