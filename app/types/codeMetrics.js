"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeMetrics = void 0;
class CodeMetrics {
    constructor(tool, numberOfFiles, numberOfFunctions, physicalLines, linesOfCode) {
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
    // Accessors   
    get tool() { return this._tool; }
    get numberOfFiles() { return this._numberOfFiles; }
    get numberOfFunctions() { return this._numberOfFunctions; }
    get physicalLines() { return this._physicalLines; }
    get linesOfCode() { return this._linesOfCode; }
}
exports.CodeMetrics = CodeMetrics;
//# sourceMappingURL=codeMetrics.js.map