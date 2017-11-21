/****************************************
*********** DEPENDENCIES *************
***************************************/
var gdax = require('gdax');
var kraken = require('kraken-api');
var pushover = require('pushover-notifications');
var $q = require('q');

/****************************************
************* CONSTANTS *************
***************************************/
var DEBUG = true;
var TIME_FRAME = 60000*5; //60000*x = x minutes
var VOLUME_THRESHOLD = 500;
var DUMPALERT_TOKEN = 'aiaymynvmwaxovky5z7uagciqv2opj'; //Pushover app token
var MIKE_TOKEN = 'ujt68kne2nc2ye6wav5pund5v61fuz'; //Pushover user Key

/****************************************
***************** CLASSES ***************
***************************************/
//Class for holding aggregate order book information (combine exchanges)
var Orderbook = function(pair) {
  // var product = pair.split('/')[0];
  // var currency = pair.split('/')[1];
  // var buys = [];
  // var sells = [];
  //
  // //May want to add auto sorting buy price
  // var addOrder = function(quantity, price, side) {
  //   if (side !== 'buy' || side !== 'sell') {
  //     console.error('bug');
  //     return;
  //   }
  //   var sideArr = side == 'buy' ? buys : sells;
  //   var order = {quantity: quantity, price: price};
  //   sideArr.push(order);
  // };
};

//Class for holding aggregate trades in a given time frame
var Tradeblock = function(tradesFrom, tradesTo) {
  this.tradesFrom = tradesFrom;
  this.tradesTo = tradesTo;
  var trades = [];

  this.addTrade = function(trade) {
    //TODO add trade validation
    trades.push(trade);
  };
};

//Generic class for holding info about a single trade
var Trade = function(tradeInfo) {
  this.side = tradeInfo.side;
  this.base = tradeInfo.base || defaultInfo.base;
  this.counter = tradeInfo.counter || defaultInfo.counter;
  this.ratio = tradeInfo.ratio;
  this.amount = tradeInfo.amount;
};

Trade.prototype.getValue = function() {
  return this.amount * this.ratio;
};

Trade.prototype.getPair = function() {
  return this.base + '/' + this.counter;
};

/****************************************
*************** FUNCTIONS ***************
***************************************/

var getGdaxTradeBlock = function(client, tradesFrom, tradesTo) {
  var q = $q.defer();
  client.getProductTrades(function(result) {
    q.resolve(result);
  });
  return q.promise;
};

/****************************************
****************** MAIN ****************
***************************************/

var defaultInfo = {};
var setDefault = function(prop, val) {
};

//Init and test
var gdaxClient = new gdax.PublicClient();
var currentTime = new Date().getTime() / 1000;
var trades;
getGdaxTradeBlock(gdaxClient, currentTime - 600, currentTime).then(function(data) {
  trades = data;
});
