

export class CodeMetrics
{
    protected _tool: string;
    protected _numberOfFiles: string;
    protected _numberOfFunctions: string;
    protected _physicalLines: string;
    protected _linesOfCode: string;
    
    // Accessors   
    get tool() : string { return this._tool; }
    get numberOfFiles() : string { return this._numberOfFiles; }
    get numberOfFunctions() : string { return this._numberOfFunctions; }
    get physicalLines() : string { return this._physicalLines; }
    get linesOfCode() : string { return this._linesOfCode; }

    constructor(tool:string, numberOfFiles:string, numberOfFunctions:string, physicalLines:string, linesOfCode:string)
    {
        // super(id, fileLocation);
        // super(state, "ErrorList", "error-list-children");

        this._tool = tool;
        this._numberOfFiles = numberOfFiles;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;

        // this._errorType = errorType;
        // this._errorMessage = errorMessage;
        // this._errorPath = errorPath == undefined ? new Array<ErrorPathStep>() : errorPath;
        
        // if(hash == undefined) {
        //     hash = this._calcHash();
        // }
        // this._hash = hash;
    }

    // private _calcHash() : string
    // {
    //     let inputString = `${this.tool}, ${this.moduleName}, ${this.fileName}, ${this.lineNumber}, ${this.errorType}, ${this.errorMessage}`
    //     return <string>md5.Md5.hashAsciiStr(inputString);
    // }

    // public toJSON()
    // {
    //     return {
    //         errorId:this.id,
    //         errorHash:this.hash,
    //         tool: this.tool,
    //         moduleName : this.moduleName,
    //         file : this.fileName,
    //         line : this.lineNumber,
    //         errorType : this.errorType,
    //         errorMessage : this.errorMessage,
    //         devDisposition : this.devDisposition,
    //         leadDisposition : this.leadDisposition,
    //     }
    // }

    // public toString()
    // {
    //     return this.hash;
    // }

    // public formatErrorTypeForScreen()
    // {
    //     let errorType = this.errorType.toLowerCase();
    //     let re = /_/gi;
    //     errorType = errorType.replace(re, " ");

    //     let str  = errorType.split(' ');
    //     for (var i = 0; i < str.length; i++) {
    //         str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
    //     }
    //     errorType = str.join(' ');
    //     return errorType;
    // }
}