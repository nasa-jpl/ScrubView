"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileMetrics = exports.CodeMetrics = void 0;
class CodeMetrics {
    constructor(tool, numberOfFiles, numberOfFunctions, physicalLines, linesOfCode, cyclomaticComplexity, fileMetrics) {
        this._tool = tool;
        this._numberOfFiles = numberOfFiles;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;
        this._cyclomaticComplexity = cyclomaticComplexity;
        this._fileMetrics = fileMetrics;
    }
    // Accessors   
    get tool() { return this._tool; }
    get numberOfFiles() { return this._numberOfFiles; }
    get numberOfFunctions() { return this._numberOfFunctions; }
    get physicalLines() { return this._physicalLines; }
    get linesOfCode() { return this._linesOfCode; }
    get fileMetrics() { return this._fileMetrics; }
}
exports.CodeMetrics = CodeMetrics;
class FileMetrics {
    constructor(file, parentDirectory, numberOfFunctions, physicalLines, linesOfCode, cyclomaticComplexity) {
        this._file = file;
        this._parentDirectory = parentDirectory;
        this._numberOfFunctions = numberOfFunctions;
        this._physicalLines = physicalLines;
        this._linesOfCode = linesOfCode;
        this._cyclomaticComplexity = cyclomaticComplexity;
    }
    // Accessors   
    get file() { return this._file; }
    get parentDirectory() { return this._parentDirectory; }
    get numberOfFunctions() { return this._numberOfFunctions; }
    get physicalLines() { return this._physicalLines; }
    get linesOfCode() { return this._linesOfCode; }
    get cyclomaticComplexity() { return this._cyclomaticComplexity; }
}
exports.FileMetrics = FileMetrics;
//# sourceMappingURL=codeMetrics.js.map