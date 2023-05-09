"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractParser = void 0;
const log_1 = require("../utils/log");
class AbstractParser {
    constructor(name, errorPrefix) {
        this._name = name;
        this._errorPrefix = errorPrefix;
        this._nextErrorId = 0;
    }
    parseFile(filePath, errorCollection, excludeFiles, excludeErrors, onlyIncludeFiles, buildPath) {
        // Call the child class parser
        let buildErrors = this._parseFile(filePath, buildPath);
        // Log
        log_1.Log.message(`${this._name} parsed ${buildErrors.length} errors`);
        let filteredCount = 0;
        let addedCount = 0;
        for (let errorObj of buildErrors) {
            // Filter the Errors
            let errorFiltered = false;
            // Tool Exclude Files
            for (let toolExcludeFile of excludeFiles) {
                let regex = new RegExp(toolExcludeFile);
                errorFiltered = errorFiltered || (regex.exec(errorObj.fileName) != null);
            }
            // Tool Exclude Errors
            for (let toolExcludeError of excludeErrors) {
                let regex = new RegExp(toolExcludeError);
                errorFiltered = errorFiltered || (regex.exec(errorObj.errorType) != null);
            }
            // If we're only including errors from certain files, test that now
            if (onlyIncludeFiles.length > 0) {
                let includeError = false;
                for (let testFile of onlyIncludeFiles) {
                    if (errorObj.fileName.includes(testFile)) {
                        includeError = true;
                        break;
                    }
                }
                errorFiltered = errorFiltered || !includeError;
            }
            // If not Filtered, Add the Error
            if (!errorFiltered) {
                errorCollection.addCodeError(errorObj);
                addedCount++;
            }
            else {
                filteredCount++;
            }
        }
        log_1.Log.message(`${this._name} added ${addedCount} errors and filtered ${filteredCount} errors`);
    }
    _getNextErrorId() {
        let rVal = this._errorPrefix + this._nextErrorId.toString().padStart(6, "0");
        this._nextErrorId += 1;
        return rVal;
    }
}
exports.AbstractParser = AbstractParser;
//# sourceMappingURL=abstractParser.js.map