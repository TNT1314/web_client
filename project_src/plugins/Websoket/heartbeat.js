


function WS4Redis(options) {
    'use strict';

    var opts, ws, timeout = 60000; //60s
    var heartbeat_interval = null, missed_heartbeats = 0;

    if (this === undefined)
        return new WS4Redis(options);
    if (options.uri === undefined)
        throw new Error('No Websocket URI in options');

    opts = options;
    connect(opts.uri);

    function connect(uri) {
        try {
            console.log("Connecting to " + uri + " ...");
            ws = new WebSocket(uri);
            initEventHandle();
        } catch (err) {
            new Error(err);
        }
    }

    function initEventHandle() {
        ws.onopen = on_open;
        ws.onmessage = on_message;
        ws.onerror = on_error;
        ws.onclose = on_close;
    }

    function send_heartbeat() {
        try {
            missed_heartbeats++;
            if (missed_heartbeats > 3)
                throw new Error("Too many missed heartbeats.");
            ws.send(opts.heartbeat_msg);
        } catch(e) {
            clearInterval(heartbeat_interval);
            heartbeat_interval = null;
            console.warn("Closing connection. Reason: " + e.message);
            ws.close();
        }
    }

    function on_open() {
        console.log('Connected!');
        // new connection, reset attemps counter
        if (opts.heartbeat_msg && heartbeat_interval === null) {
            missed_heartbeats = 0;
            heartbeat_interval = setInterval(send_heartbeat, timeout);
        }
    }

    function on_close() {
        console.log("Connection closed!");

    }

    function on_error() {
        console.error("Websocket connection is broken!");
    }

    function on_message(e) {
            // reset the counter for missed heartbeats
            missed_heartbeats = 0;
            clearInterval(heartbeat_interval);
            heartbeat_interval = null;
            on_open();
    }

    // this code is borrowed from http://blog.johnryding.com/post/78544969349/
    //
    // Generate an interval that is randomly between 0 and 2^k - 1, where k is
    // the number of connection attmpts, with a maximum interval of 30 seconds,
    // so it starts at 0 - 1 seconds and maxes out at 0 - 30 seconds

    /*
    function generateInteval (k) {
        var maxInterval = (Math.pow(2, k) - 1) * 1000;

        // If the generated interval is more than 30 seconds, truncate it down to 30 seconds.
        if (maxInterval > 30*1000) {
            maxInterval = 30*1000;
        }

        // generate the interval to a random number between 0 and the maxInterval determined from above
        return Math.random() * maxInterval;
    }

    this.send_message = function(message) {
        ws.send(message);
    };
     */
}
