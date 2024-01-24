

export class CodeMetrics
{
    protected _tool: string;
    protected _numberOfFiles: number;
    protected _numberOfFunctions: number;
    protected _physicalLines: number;
    protected _linesOfCode: number;
    protected _numberOfComments : number;
    protected _commentDensity : number;
    protected _cyclomaticComplexity: number;
    protected _fileMetrics: Array<FileMetrics>;
    
    // Accessors   
    get tool() : string { return this._tool; }
    get numberOfFiles() : number { return this._numberOfFiles; }
    get numberOfFunctions() : number { return this._numberOfFunctions; }
    get physicalLines() : number { return this._physicalLines; }
    get linesOfCode() : number { return this._linesOfCode; }
    get numberOfComments() : number { return this._numberOfComments; }
    get commentDensity() : number { return this._commentDensity; }
    get fileMetrics() : Array<FileMetrics> { return this._fileMetrics }

    constructor(tool:string, numberOfFiles:number, numberOfFunctions:number, physicalLines:number, linesOfCode:number, numberOfComments:number, commentDensity:number, cyclomaticComplexity:number, fileMetrics:Array<FileMetrics>)
    {
        this._tool = tool;
        this._numberOfFiles = numberOfFiles;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;
        this._numberOfComments = numberOfComments;
        this._commentDensity = commentDensity;
        this._cyclomaticComplexity = cyclomaticComplexity;
        this._fileMetrics = fileMetrics;
    }

}

export class FileMetrics
{
    protected _file: string;
    protected _parentDirectory: string;
    protected _numberOfFunctions: number;
    protected _physicalLines: number;
    protected _linesOfCode: number;
    protected _numberOfComments: number;
    protected _commentDensity: number;
    protected _cyclomaticComplexity : number;
    
    // Accessors   
    get file() : string { return this._file; }
    get parentDirectory() : string { return this._parentDirectory; }
    get numberOfFunctions() : number { return this._numberOfFunctions; }
    get physicalLines() : number { return this._physicalLines; }
    get linesOfCode() : number { return this._linesOfCode; }
    get numberOfComments() : number { return this._numberOfComments; }
    get commentDensity() : number { return this._commentDensity; }
    get cyclomaticComplexity() : number { return this._cyclomaticComplexity }

    constructor(file:string, parentDirectory:string, numberOfFunctions:number, physicalLines:number, linesOfCode:number, numberOfComments:number, commentDensity:number, cyclomaticComplexity:number)
    {
        this._file = file;
        this._parentDirectory = parentDirectory;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;
        this._numberOfComments = numberOfComments;
        this._commentDensity = commentDensity;
        this._cyclomaticComplexity = cyclomaticComplexity;
    }

}