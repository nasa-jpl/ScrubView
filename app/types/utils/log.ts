import { EventEmitter } from "events";

export enum LogLevels 
{
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    FATAL
}

export class Log extends EventEmitter
{

    private static _log : Log;

    constructor() 
    {
        super();
        Log._log = this;
    }

    public static getInstance()
    {
        if(Log._log == undefined)
        {
            new Log();
        }
        return Log._log;
    }

    public static debug(message : string)
    {
        console.debug(message);
        Log._sendLogMessage(message, LogLevels.DEBUG);
    }

    public static message(message : string)
    {
        console.log(message);
        Log._sendLogMessage(message, LogLevels.INFO);
    }

    public static warning(message : string)
    {
        console.warn(message);
        Log._sendLogMessage(message, LogLevels.WARNING);
    }

    public static error(message : string)
    {
        console.error(message);
        console.trace();
        Log._sendLogMessage(message, LogLevels.ERROR);
    }

    public static fatal(message : string)
    {
        console.error(message);
        console.trace();
        Log._sendLogMessage(message, LogLevels.FATAL);
        process.exit(-1);
    }

    private static _sendLogMessage(message : string, level : LogLevels)
    {
        let log = Log.getInstance();
        log.emit("onLogMessage", message, level);
    }

}