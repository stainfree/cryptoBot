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

//Class for holding aggregate order book information (combine exchanges)
var Orderbook = function() {
};

//Class for holding aggregate trades in a given time frame
var Tradeblock = function() {

};

//Generic class for holding info about a single trade
var Trade = function() {

};

//TODO Aggregate information from available exchanges
