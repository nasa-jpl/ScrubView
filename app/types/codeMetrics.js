"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileMetrics = exports.CodeMetrics = void 0;
class CodeMetrics {
    constructor(tool, numberOfFiles, numberOfFunctions, physicalLines, linesOfCode) {
        // super(id, fileLocation);
        // super(state, "ErrorList", "error-list-children");
        this._tool = tool;
        this._numberOfFiles = numberOfFiles;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;
    }
    // Accessors   
    get tool() { return this._tool; }
    get numberOfFiles() { return this._numberOfFiles; }
    get numberOfFunctions() { return this._numberOfFunctions; }
    get physicalLines() { return this._physicalLines; }
    get linesOfCode() { return this._linesOfCode; }
}
exports.CodeMetrics = CodeMetrics;
class FileMetrics {
    constructor(file, parentDirectory, numberOfFunctions, physicalLines, linesOfCode) {
        // super(id, fileLocation);
        // super(state, "ErrorList", "error-list-children");
        this._file = file;
        this._parentDirectory = parentDirectory;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;
    }
    // Accessors   
    get file() { return this._file; }
    get parentDirectory() { return this._parentDirectory; }
    get numberOfFunctions() { return this._numberOfFunctions; }
    get physicalLines() { return this._physicalLines; }
    get linesOfCode() { return this._linesOfCode; }
}
exports.FileMetrics = FileMetrics;
//# sourceMappingURL=codeMetrics.js.map