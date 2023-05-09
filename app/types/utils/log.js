"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.LogLevels = void 0;
const events_1 = require("events");
var LogLevels;
(function (LogLevels) {
    LogLevels[LogLevels["DEBUG"] = 0] = "DEBUG";
    LogLevels[LogLevels["INFO"] = 1] = "INFO";
    LogLevels[LogLevels["WARNING"] = 2] = "WARNING";
    LogLevels[LogLevels["ERROR"] = 3] = "ERROR";
    LogLevels[LogLevels["FATAL"] = 4] = "FATAL";
})(LogLevels = exports.LogLevels || (exports.LogLevels = {}));
class Log extends events_1.EventEmitter {
    constructor() {
        super();
        Log._log = this;
    }
    static getInstance() {
        if (Log._log == undefined) {
            new Log();
        }
        return Log._log;
    }
    static debug(message) {
        console.debug(message);
        Log._sendLogMessage(message, LogLevels.DEBUG);
    }
    static message(message) {
        console.log(message);
        Log._sendLogMessage(message, LogLevels.INFO);
    }
    static warning(message) {
        console.warn(message);
        Log._sendLogMessage(message, LogLevels.WARNING);
    }
    static error(message) {
        console.error(message);
        console.trace();
        Log._sendLogMessage(message, LogLevels.ERROR);
    }
    static fatal(message) {
        console.error(message);
        console.trace();
        Log._sendLogMessage(message, LogLevels.FATAL);
        process.exit(-1);
    }
    static _sendLogMessage(message, level) {
        let log = Log.getInstance();
        log.emit("onLogMessage", message, level);
    }
}
exports.Log = Log;
//# sourceMappingURL=log.js.map