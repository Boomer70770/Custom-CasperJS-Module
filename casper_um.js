/*
 * Casper_UM is an extension of the casperjs singleton instance
 *
 * Copyright (c) 2015 
 *
 * Author: Ryan Long
 * Version: 1.0
 */

/* global patchRequire, module*/

var require = patchRequire(require),
    casper = require("casper").create(),
    exec = require("child_process").execFile;

casper.options.pageSettings = {
    loadImages: false,
    loadPlugins: false,
    userAgent: "Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0",
    webSecurityEnabled: false,
    ignoreSslErrors: true, //this bs doesnt work
    localToRemoteUrlAccessEnabled: true,
    XSSAuditingEnabled: false
};
casper.options.logLevel = "info";
casper.options.verbose = false;
casper.options.waitTimeout = 120 * 1000;

/********************************************************
 * CASPER VARIABLES
 * ******************************************************/
casper.pageIsLoaded = true;
casper.account = {};
casper.logType = {
    "DEBUG": 1,
    "REQUEST": 1,
    "RESPONSE": 1,
    "INFO": 2,
    "MESSAGE": 2,
    "WARN": 3,
    "ERROR": 4
};

/********************************************************
 * UTILITY FUNCTIONS
 * ******************************************************/

/**
 * Returns a time stamp
 *
 * @method timesStamp
 * @return {String} Returns a string containing the date and local time
 */
casper.timeStamp = function () {
    "use strict";
    var date = new Date();
    return (date.toDateString() + " " + date.toLocaleTimeString());
};

/**
 * Saves a snapshot of the current web page
 *
 * @method snap
 * @param {string} path - (optional) the path to store the screen shot.  The default is the current directory with /timestamp/_screenshot.png
 * @return {Boolean} Returns true on success
 */
casper.snap = function (path) {
    "use strict";
    this.capture(path || new Date().getTime().toString() + "_screenshot.png");
    return true;
};

/**
 * Saves a snapshot of the current web page and exits execution
 *
 * @method snapAndExit
 * @param {string} path - (optional) the path to store the screen shot.  The default is the current directory with /timestamp/_screenshot.png
 * @return {Boolean} Returns true on success
 */
casper.snapAndExit = function (path) {
    "use strict";
    this.capture(path || new Date().getTime().toString() + "_screenshot.png");
    this.exit();
    return true;
};

//TODO STILL IN DEVELOPMENT - DO NOT USE
casper.fileType = function (path) {
    "use strict";
    var fileType = null;
    exec("file", [path], null, function (error, stdout, stderr) {
        fileType = stdout;
    });
    while (!fileType) {}
    fileType = fileType.replace(path, "").replace(/:/g, "").replace(/^\s/, "");
    return fileType;
};

/**
 * Determines if a file is a PDF 
 *
 * @method isPDF
 * @param {string} path - (optional) the path to store the screen shot.  The default is the current directory with /timestamp/_screenshot.png
 * @return {Boolean} Returns true if the file is a PDF, false otherwise.
 */
casper.isPDF = function (path) {
    "use strict";
    //ensure the file exists, log error message and return false
    if (!require('fs').exists(path)) {
        casper.log(path + " does not exist", "error");
        return false;
    }
    //get the contents of the file
    var searchString = require('fs').read(path);

    //if file starts with %PDF- and ends with %%EOF, good chance its a pdf
    if (searchString.trim().search(/^%PDF-/) === -1 && searchString.trim().search(/$%%EOF/) === -1) {
        return false;
    } else {
        return true;
    }
};

/**
 * Removes all leading and trailing whitespace and carriage return from a string
 * @method trim
 * @param {String} string - the string to trim
 * @return {String} Returns the trimmed string
 */
casper.trim = function (string) {
    "use strict";
    return string.trim().replace("\n", "").replace(/\s{2,}/g, " ");
};

/**
 * Waits for page to fully load then executes callback
 * @method waitForPageLoad
 * @param {Function} callback - callback function
 */
casper.waitForPageLoad = function (callback) {
    "use strict";
    this.waitFor(function () {
        return this.pageIsLoaded;
    }, function () {
        callback();
    });
};

/********************************************************
 * DEBUGGING METHODS
 * ******************************************************/

/**
 * Assertion to test if a statement evaluates to true or false.  If the statement
 * evaluates to false, message is logged to console and a callback is fired
 *
 * @method assert
 * @param {Boolean} test - statement to test
 * @param {String} message - the message to log if the test is true
 * @param {Function} callback
 */
casper.assert = function (test, message, callback) {
    "use strict";
    if (!test) {
        this.log(message, "error");
        if (callback) {
            callback();
        }
    }
};

/**
 * Assertion to test if a statement evaluates to true or false.  If the statement
 * evaluates to false, message is logged to console and a callback is fired
 *
 * @method assert
 * @param {Boolean} test - statement to test
 * @param {String} message - the message to log if the test is true
 * @param {Function} callback
 */
casper.assertNot = function (test, message, callback) {
    "use strict";
    if (test) {
        this.log(message, "error");
        if (callback) {
            callback();
        }
    }
};

/**
 * Logs messges to the console.
 *
 * If no type is given, the default of "INFO" is used.
 *
 * @method log
 * @param {String} Argument[0] the message to be logged
 * @param {String} Argument[1] the log type
 */
//redefine casper.log to write to stderr instead of stdout
/*eslint-disable*/
casper.log = function () {
    var type = (arguments[1] === undefined) ? "INFO" : arguments[1].toString().toUpperCase(),
        msg = arguments[0];

    if (casper.logType[type] >= casper.logType[this.options.logLevel.toUpperCase()]) {
        switch (type) {
        case "MESSAGE":
            type = "\033[1;97;42m[REMSG]\033[0m ";
            break;
        case "REQUEST":
            type = "\033[1;97;45m[ RQST]\033[0m ";
            break;
        case "RESPONSE":
            type = "\033[1;97;44m[ RESP]\033[0m ";
            break;
        case "DEBUG":
            type = "\033[;93m[DEBUG]\033[0m ";
            break;
        case "ERROR":
            type = "\033[1;97;41m[ERROR]\033[0m ";
            break;
        case "WARN":
            type = "\033[1;91;220m[ WARN]\033[0m ";
            break;
        case "INFO":
        default:
            type = "\033[;92m[ INFO]\033[0m ";
            break;
        }
        require("system").stderr.write(type + "\033[96m" + this.timeStamp() + "\033[97m " + msg + "\033[0m\n");
    }
};
/*eslint-enable*/

/**
 * Exits out of casper and sends an error object to STDOUT
 *
 * @method errorExit
 * @param {String} Argument 0 the error code
 * @param {String} Argument 1 the error type
 * @param {String} Argument 2 the error message
 */
casper.errorExit = function () {
    "use strict";
    var errorObject = {
        "success": false,
        "errorCode": arguments[0],
        "errorType": arguments[1],
        "errorMsg": arguments[2]
    };
    require("system").stdout.write(JSON.stringify(errorObject, null, 4) + "\n");
    this.exit();
};

/**
 * Converts an object to JSON string
 *
 * @method renderJSON
 * @param {Object} object the object to be rendered as JSON
 * @return {String} Returns the object converted to JSON string
 */
casper.renderJSON = function (object) {
    "use strict";
    return JSON.stringify(object, null, 4);
};

/**
 * Parses a date object to YYYY-MM-DD
 *
 * @method parseDate
 * @param {Date} date an instance of Date
 * @return {String} Returns the parsed date string
 */
casper.parseDate = function (date) {
    "use strict";
    var year, day, month;
    year = date.getFullYear();
    day = date.getDate();
    month = date.getMonth() + 1;
    day = "0" + day;
    month = "0" + month;
    day = day.slice(-2);
    month = month.slice(-2);
    return (year.toString() + "-" + month.toString() + "-" + day.toString());
};

/********************************************************
 * CASPER EVENT LISTENERS
 * *****************************************************/
casper.on("page.initialized", function () {
    "use strict";
    this.log("Current URL: " + this.getCurrentUrl(), "info");
});

casper.on("page.error", function (err, trace) {
    "use strict";
    this.log("Page error\n" + JSON.stringify(err, null, 4) + trace, "warn");
});

casper.on("timeout", function (err) {
    "use strict";
    this.log("Timeout\n" + JSON.stringify(err, null, 4), "error");
});

casper.on("waitFor.timeout", function (err) {
    "use strict";
    this.log("waitFor timeout\n" + JSON.stringify(err, null, 4), "error");
});

casper.on("complete.error", function (err) {
    "use strict";
    this.log("Complete error\n" + JSON.stringify(err, null, 4), "warn");
});

casper.on("load.failed", function (err) {
    "use strict";
    this.log("Load failed\n" + JSON.stringify(err, null, 4), "warn");
});

casper.on("step.error", function (err) {
    "use strict";
    this.log("Step error\n" + JSON.stringify(err, null, 4), "warn");
});

casper.on("resource.error", function (err) {
    "use strict";
    //Loops through all errors that should be ignored to prevent the script from stopping on acceptable errors
    this.log("Resource error\n" + JSON.stringify(err, null, 4), "warn");
});

casper.on("error", function (err, trace) {
    "use strict";
    this.log("Unknown error\n" + JSON.stringify(err, null, 4) + trace, "warn");
});

//Used to catch remote messages, like console.log messages in a CasperJS
//evaluate()
casper.on("remote.message", function (msg) {
    "use strict";
    this.log(msg, "message");
});

casper.on("remote.alert", function (msg) {
    "use strict";
    this.log(msg, "message");
});

//Used to tell if a page has finished loading or not
casper.on("load.started", function () {
    "use strict";
    this.pageIsLoaded = false;
});

//Used to tell if a page has finished loading or not
casper.on("load.finished", function () {
    "use strict";
    this.pageIsLoaded = true;
});

//For Debugging
casper.on("resource.requested", function (request) {
    "use strict";
    if (casper.options.verbose === true) {
        this.log(JSON.stringify(request, null, 4), "request");
    }
});

//For Debugging
casper.on("resource.received", function (response) {
    "use strict";
    if (casper.options.verbose === true) {
        this.log(JSON.stringify(response, null, 4), "response");
    }
});

module.exports = casper;
