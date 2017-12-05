TradeBlock/****************************************
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
  this.base = tradeInfo.base || DEFAULT_INFO.base;
  this.counter = tradeInfo.counter || DEFAULT_INFO.counter;
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
var TradeBlock = function(tradesFrom, tradesTo, base, counter) {
  this.tradesFrom = tradesFrom;
  this.tradesTo = tradesTo;
  this.base = base || DEFAULT_INFO.base;
  this.counter = counter || DEFAULT_INFO.counter;
  var trades = [];

  this.addTrade = function(trade) {
    //TODO add trade validation
    trades.push(trade);
  };

  this.getTrades = function() {
    return trades;
  };
};

var GdaxTradeBlock = function(tradesFrom, tradesTo) {
  var tradeBlock = new TradeBlock(tradesFrom, tradesTo);

  //data is passed in from client.getProductTrades
  tradeBlock.parseTrades = function(data) {
    var _this = this;
    var result = {
      earliest: null,
      latest: null
    };
    var tradeArr = JSON.parse(data.body);
    if (!data || !data.body || !data) {
      console.error('Expected JSON array as body');
      return null;
    }
    tradeArr.forEach(function(trade) {
      var tradeTimeObj = new Date(trade.time);
      if (!result.earliest || tradeTimeObj < result.earliest) {
        result.earliest = tradeTimeObj;
      }
      if (!result.latest || tradeTimeObj > result.latest) {
        result.latest = tradeTimeObj;
      }
      if(tradeTimeObj <= _this.tradesTo && tradeTimeObj >= _this.tradesFrom) {
        trade.base = _this.base;
        trade.counter = _this.counter;
        _this.addTrade(new Trade(trade));
      }
    });
    return result;
  };

  //only client is needed as an argument, other 2 are for recursion
  tradeBlock.populateTrades = function(client, params, recursiveQ) {
    var _this = this;
    var q = recursiveQ || $q.defer();
    var callParams = params || {};
    client.getProductTrades(callParams, function(error, result) {
      var parseRes = _this.parseTrades(result);
      if (!parseRes || parseRes.earliest <= _this.tradesFrom) {
        q.resolve();
      } else {
        callParams.after = result.headers['cb-after'];
        _this.populateTrades(client, callParams, q);
      }
    });
    return q.promise;
  };
  return tradeBlock;
};

/****************************************
*************** FUNCTIONS ***************
***************************************/


/****************************************
****************** MAIN ****************
***************************************/

//Init and test
var gdaxClient = new gdax.PublicClient();
var currentTime = new Date().getTime();
var tradeBlock = new GdaxTradeBlock(currentTime - 300000, currentTime);
tradeBlock.populateTrades(gdaxClient).then(function() {
  console.log('done');
});
