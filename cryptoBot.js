/****************************************
*********** DEPENDENCIES *************
***************************************/
var gdax = require('gdax');
// var kraken = require('kraken-api'); TODO throwing errors when requiring...
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
var DEFAULT_INFO = {base: 'BTC', counter: 'USD'};

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

//Generic class for holding info about a single trade
var Trade = function(tradeInfo) {
  this.side = tradeInfo.side;
  this.base = tradeInfo.base || defaultInfo.base;
  this.counter = tradeInfo.counter || defaultInfo.counter;
  this.price = tradeInfo.price;
  this.size = tradeInfo.size;
};

Trade.prototype.getValue = function() {
  return this.size * this.price;
};

Trade.prototype.getPair = function() {
  return this.base + '/' + this.counter;
};

//Class for holding aggregate trades in a given time frame
//base and counter are optional
var Tradeblock = function(tradesFrom, tradesTo, base, counter) {
  this.tradesFrom = tradesFrom;
  this.tradesTo = tradesTo;
  this.base = base || DEFAULT_INFO.base;
  this.counter = counter || DEFAULT_INFO.counter;
  var trades = [];

  this.addTrade = function(trade) {
    //TODO add trade validation
    trades.push(trade);
  };
};

var GdaxTradeBlock = function(tradesFrom, tradesTo) {
  this.prototype = new Tradeblock(tradesFrom, tradesTo);
};

//data is from getProductTrades
//Parses in data.body
GdaxTradeBlock.prototype.parseTrades = function(data) {
  var result = {
    earliest: null,
    latest: null
  };
  var tradeArr = JSON.parse(data.body);
  tradeArr.forEach(function(trade) {
    var tradeTimeObj = new Date(trade.time);
    if (!result.earliest || tradeTimeObj < result.earliest) {
      result.earliest = tradeTimeObj;
    }
    if (!result.latest || tradeTimeObj > result.latest) {
      result.latest = tradeTimeObj;
    }
    if(tradeTimeObj <= this.tradesTo && tradeTimeObj >= this.tradesFrom) {
      trade.base = this.base;
      trade.counter = this.counter;
      this.addTrade(new Trade(trade));
    }
  });
};

//recursivePromise is not meant to be used as an arg
//TODO(continue here)
GdaxTradeBlock.prototype.populateTrades = function(client, recursiveQ) {
  var q = recursiveQ || $q.defer();
  client.getProductTrades(function(error, result) {
    var parseRes = this.parseTrades(result);
    if (parseRes.latest < )
    this.populateTrades
    q.resolve(result);
  });
  return q.promise;
};

/****************************************
*************** FUNCTIONS ***************
***************************************/

var getGdaxTradeBlock = function(client, tradesFrom, tradesTo) {
  var q = $q.defer();
  client.getProductTrades(function(error, result) {
    q.resolve(result);
  });
  return q.promise;
};

/****************************************
****************** MAIN ****************
***************************************/

//Init and test
var gdaxClient = new gdax.PublicClient();
var currentTime = new Date().getTime() / 1000;
var tradeBlock = new GdaxTradeBlock(currentTime - 600, currentTime);
getGdaxTradeBlock(gdaxClient, currentTime - 600, currentTime).then(function(data) {
  tradeBlock.parseInPage(data);
});
