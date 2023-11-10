

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
    }

}

export class FileMetrics
{
    protected _file: string;
    protected _parentDirectory: string;
    protected _numberOfFunctions: string;
    protected _physicalLines: string;
    protected _linesOfCode: string;
    
    // Accessors   
    get file() : string { return this._file; }
    get parentDirectory() : string { return this._parentDirectory; }
    get numberOfFunctions() : string { return this._numberOfFunctions; }
    get physicalLines() : string { return this._physicalLines; }
    get linesOfCode() : string { return this._linesOfCode; }

    constructor(file:string, parentDirectory:string, numberOfFunctions:string, physicalLines:string, linesOfCode:string)
    {
        // super(id, fileLocation);
        // super(state, "ErrorList", "error-list-children");

        this._file = file;
        this._parentDirectory = parentDirectory;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;
    }

}