/****************************************
*********** DEPENDENCIES *************
***************************************/
var http = require('http');
var https = require('https');
var querystring = require('querystring');

/****************************************
************* CONSTANTS *************F
***************************************/
var DEBUG = true;
var TIME_FRAME = 60000*5; //60000*x = x minutes
var VOLUME_THRESHOLD = 500;
var DUMPALERT_TOKEN = 'aiaymynvmwaxovky5z7uagciqv2opj'; //Pushover app token
var MIKE_TOKEN = 'ujt68kne2nc2ye6wav5pund5v61fuz'; //Pushover user Key

/****************************************
*********** GDAX FUNCTIONS *************
***************************************/

var getGdaxOptions = function(prod, page) {
    if (!prod) {
        console.error('invalid product');
        return null;
    }

    page = page || 0;
    //GET Request options
    var gdaxOptions = {
        host: 'api.gdax.com',
        port: 443,
        path: '/products/' + prod + '/trades' + (page ? ('?after=' + page) : ''),
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'R'
        }
    };
    return gdaxOptions;
};

var logGdaxTrade = function(trade, tracker) {
    tracker.log('Type: %s, Price: %s, Size: %s, Time: %s', trade.side, trade.price, trade.size, trade.time);
};

/**
 * gdaxPageCallback: callback for a single paged request from GDAX,
 * sets tracker.page = null when finished parsing
 * @param result: JSON result array from gdax
 * @param tracker: {} pre-initialized object containing attributes: firstDate, cumulative, page
 */
var gdaxPageCallback = function(result, tracker) {
    tracker.cumulative = tracker.cumulative || {};
    tracker.firstDate = tracker.firstDate || result[0].time;

    //Parse result trade array
    for (var i = 0; i < result.length; i++) {
        var trade = result[i];
        if (new Date(tracker.firstDate) - new Date(trade.time) > TIME_FRAME) {
            tracker.log('Exceeded interval: %s', TIME_FRAME);
            tracker.page = 'eof';
            return;
        }

        logGdaxTrade(trade, tracker);
        tracker.cumulative[trade.side] = tracker.cumulative[trade.side] || 0;
        tracker.cumulative[trade.side] += parseFloat(trade.size);
    }
    tracker.page += 1;
};

var chainGdaxPageRequests = function (tracker) {
    tracker.log('Tracker Page: %s', tracker.page);
    if (tracker.page === 'eof') {
        //Termination code
        if ((tracker.cumulative.sell || 0) + (tracker.cumulative.buy || 0) >= VOLUME_THRESHOLD) {
            var message = constructPushoverMsg('GDAX', tracker);
            sendPushover(message);
        }
        tracker.log('GDAX %s sell volume: %s', tracker.product, tracker.cumulative.sell || 0);
        tracker.log('GDAX %s buy volume: %s', tracker.product, tracker.cumulative.buy || 0);
        tracker.output();
    } else {
        makeRequest(getGdaxOptions(tracker.product, tracker.page), function(result) {
            gdaxPageCallback(result, tracker);
            chainGdaxPageRequests(tracker);
        });
    }
};

var newTracker = function(prod) {
    var logArr = [];

    var queueLog = function() {
        logArr.push(arguments);
    };

    var outputLog = function() {
        if (!DEBUG) {
            return;
        }

        logArr.forEach(function(args) {
            console.log.apply(this, args);
        });
    };

    return {
        firstDate: null,
        cumulative: {},
        page: 0,
        product: prod,
        log: queueLog,
        output: outputLog
    };
};

//MAIN GDAX FN
var queryGdax = function() {
    var usdTracker = newTracker('ETH-USD');
    chainGdaxPageRequests(usdTracker);

    var btcTracker = newTracker('ETH-BTC');
    chainGdaxPageRequests(btcTracker);
};

/****************************************
************** FUNCTIONS *************
***************************************/

var getPushoverOptions = function(payload) {
    var pushoverOptions = {
        host: 'api.pushover.net',
        port: 443,
        path: '/1/messages.json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'R'
        },
        payload: payload
    };
    return pushoverOptions;
};

var constructPushoverPayload = function(message) {
    var payload = {
        token: DUMPALERT_TOKEN,
        user: MIKE_TOKEN,
        message: message,
        title: 'Dump (or pump) Alert!',
        priority: 1
    };
    return querystring.stringify(payload);
};

var sendPushover = function(message) {
    var payload = constructPushoverPayload(message);
    makeRequest(getPushoverOptions(payload), function(res) {
        // console.log(res);
    });
};

/**
 * [description]
 * @param  {[type]} exch    [description]
 * @param  {[type]} tracker [description]
 * @return {[type]}         [description]
 */
var constructPushoverMsg = function(exch, tracker) {
    var message = 'Volume exceeded threshold: ' + VOLUME_THRESHOLD;
    message += '\nExchange: ' + exch;
    message += '\nProduct: ' + tracker.product;
    message += '\n>>>>>>>>>>>>>>>';
    message += '\nsell volume: ' + (tracker.cumulative.sell || 0);
    message += '\nbuy volume: ' + (tracker.cumulative.buy || 0);
    return message;
};

/**
 * makeRequest:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
var makeRequest = function(options, resCallback) {
    // console.log('start request');

    var prot = options.port === 443 ? https : http;
    var req = prot.request(options, function(res){
        var output = '';
        // console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            if (resCallback) {
                resCallback(obj);
            }
        });
    });

    req.on('error', function(err) {
        req.send('error: ' + err.message);
    });

    if (options.method === 'POST' && options.payload) {
        req.write(options.payload);
    }

    req.end();
};

/****************************************
***************  MAIN  ***************
***************************************/
queryGdax();
setInterval(queryGdax, TIME_FRAME);
