import * as comments from "./commentObjects"
import * as md5 from 'ts-md5';
import { AbstractReviewItem } from "./abstractReviewItem";
import { FileLocation } from "./utils/fileLocation";


/**
 * ErrorPathStep
 * Contains the information for one portion of the overall error path as. This
 * is generated as part of the SARIF parsing of an error. 
 */
export class ErrorPathStep
{
    public readonly fileLocation : FileLocation;
    protected _message : string;
    get message() : string { return this._message; }

    constructor(fileLocation : FileLocation, message? : string)
    {
        this.fileLocation = fileLocation;
        this._message = message == undefined ? "" : message;
    }

    public setMessage(message : string) {
        this._message = message;
    }
}

export class CodeError extends AbstractReviewItem
{
    protected _tool: string;
    protected _errorType : string;
    protected _errorMessage : string;
    protected _hash : string;
    protected _errorPath : Array<ErrorPathStep>;
    
    // Accessors   
    get tool() : string { return this._tool; }
    get errorType() : string { return this._errorType; }
    get errorMessage() : string { return this._errorMessage; }
    get comments() : Array<comments.AbstractComment> { return this._comments; }
    get hash() : string { return this._hash; }
    get errorPath() : Array<ErrorPathStep> { return this._errorPath; }


    constructor(id:string, tool:string, fileLocation : FileLocation, errorType:string, errorMessage:string, hash? :string, errorPath? : Array<ErrorPathStep>)
    {
        super(id, fileLocation);

        this._tool = tool;
        this._errorType = errorType;
        this._errorMessage = errorMessage;
        this._errorPath = errorPath == undefined ? new Array<ErrorPathStep>() : errorPath;
        
        if(hash == undefined) {
            hash = this._calcHash();
        }
        this._hash = hash;
    }

    private _calcHash() : string
    {
        let inputString = `${this.tool}, ${this.moduleName}, ${this.fileName}, ${this.lineNumber}, ${this.errorType}, ${this.errorMessage}`
        return <string>md5.Md5.hashAsciiStr(inputString);
    }

    public toJSON()
    {
        return {
            errorId:this.id,
            errorHash:this.hash,
            tool: this.tool,
            moduleName : this.moduleName,
            file : this.fileName,
            line : this.lineNumber,
            errorType : this.errorType,
            errorMessage : this.errorMessage,
            devDisposition : this.devDisposition,
            leadDisposition : this.leadDisposition,
        }
    }

    public toString()
    {
        return this.hash;
    }

    public formatErrorTypeForScreen()
    {
        let errorType = this.errorType.toLowerCase();
        let re = /_/gi;
        errorType = errorType.replace(re, " ");

        let str  = errorType.split(' ');
        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
        }
        errorType = str.join(' ');
        return errorType;
    }
}