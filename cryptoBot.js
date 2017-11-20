/****************************************
*********** DEPENDENCIES *************
***************************************/
var Gdax = require('gdax');
var Kraken = require('kraken-api');
var Pushover = require('pushover-notifications');

/****************************************
************* CONSTANTS *************
***************************************/
var DEBUG = true;
var TIME_FRAME = 60000*5; //60000*x = x minutes
var VOLUME_THRESHOLD = 500;
var DUMPALERT_TOKEN = 'aiaymynvmwaxovky5z7uagciqv2opj'; //Pushover app token
var MIKE_TOKEN = 'ujt68kne2nc2ye6wav5pund5v61fuz'; //Pushover user Key

/****************************************
****************** MAIN ****************
***************************************/

var defaultInfo = {};

//Class for holding aggregate order book information (combine exchanges)
var Orderbook = function(pair) {
  var product = pair.split('/')[0];
  var currency = pair.split('/')[1];
  var buys = [];
  var sells = [];

  //May want to add auto sorting buy price
  var addOrder = function(quantity, price, side) {
    if (side !== 'buy' || side !== 'sell') {
      console.error('bug');
      return;
    }
    var sideArr = side == 'buy' ? buys : sells;
    var order = {quantity: quantity, price: price};
    sideArr.push(order);
  };
};

//Class for holding aggregate trades in a given time frame
var Tradeblock = function(tradesFrom, tradesTo) {

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

//TODO Aggregate information from available exchanges
