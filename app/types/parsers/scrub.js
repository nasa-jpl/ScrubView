"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrubParser = void 0;
const fs = __importStar(require("fs"));
const abstractParser_1 = require("./abstractParser");
const codeError_1 = require("../codeError");
const log_1 = require("../utils/log");
const fileLocation_1 = require("../utils/fileLocation");
// Define the parser states: 
var ParseStates;
(function (ParseStates) {
    ParseStates[ParseStates["WarningLocation"] = 0] = "WarningLocation";
    ParseStates[ParseStates["WarningMessage"] = 1] = "WarningMessage";
})(ParseStates || (ParseStates = {}));
class ScrubParser extends abstractParser_1.AbstractParser {
    _parseFile(filePath, buildPath) {
        // Open and read the input file
        let fileContents;
        try {
            fileContents = fs.readFileSync(filePath).toString();
        }
        // Catch any errors
        catch (e) {
            throw new Error(`${e}`);
        }
        // Split the lines
        let lines = fileContents.split('\n');
        // Initialize variables
        let pathSplit = filePath.split('/');
        let toolName = pathSplit[pathSplit.length - 1].replace('.scrub', '');
        let parseState = ParseStates.WarningLocation;
        let errorType = null;
        let errorPaths = null;
        let fileLocation = null;
        let warningMessage = [];
        let errorList = new Array();
        let locationRegex = /^[a-z]+[0-9]+ <.*>.*:.*:.*:/;
        let descriptionRegex = /        */;
        // Iterate through every line of the input file
        for (let lineNum = 0; lineNum < lines.length; ++lineNum) {
            // Get the line of interest
            let line = lines[lineNum];
            switch (parseState) {
                /////////////////////////////////////////
                // Gather the location data
                /////////////////////////////////////////
                case ParseStates.WarningLocation:
                    // Clear the previous warning
                    warningMessage = [];
                    // Go to the next line if the regex doesn't match
                    if (locationRegex.exec(line) == null) {
                        continue;
                    }
                    // Get the severity
                    errorType = line.split(/[<>]+/)[1];
                    // Get the warning location
                    // fileLocation = FileLocation.fromAnalyzerPath(line.split(":")[1], +line.split(":")[2], buildPath);
                    fileLocation = new fileLocation_1.FileLocation(line.split(":")[1], +line.split(":")[2], buildPath);
                    errorPaths = new Array();
                    // Update the parsing state
                    parseState = ParseStates.WarningMessage;
                    break;
                /////////////////////////////////////////
                // Gather the message
                /////////////////////////////////////////
                case ParseStates.WarningMessage:
                    // Make sure the 
                    if (errorPaths == null) {
                        throw new Error("Parser is in an impossible state: PathLine with no errorPaths object defined");
                    }
                    // Check to see if the end of the error message has been found
                    if (line == "") {
                        // Test if we have everything we need
                        if (errorType == null || fileLocation == null || warningMessage == null) {
                            throw new Error("Bad parse.");
                        }
                        // Add the warning data
                        errorPaths.push(new codeError_1.ErrorPathStep(fileLocation, warningMessage.join('<br>')));
                        // Create the new Error
                        let newError = this._createError(this._getNextErrorId(), toolName, errorType, errorPaths);
                        errorList.push(newError);
                        // Update the parser state
                        parseState = ParseStates.WarningLocation;
                        break;
                    }
                    else if (descriptionRegex.exec(line) != null) {
                        // Test if we have everything we need
                        if (warningMessage == null) {
                            log_1.Log.error("Bad Parse.");
                            parseState = ParseStates.WarningLocation;
                            continue;
                        }
                        // Append line to the warning message
                        warningMessage.push(line.trim());
                        break;
                    }
            }
        }
        return errorList;
    }
    _createError(id, tool, errorType, errorPath, hash) {
        // Get the warning location
        let fileLocation = errorPath[0].fileLocation;
        return new codeError_1.CodeError(id, tool, fileLocation, errorType, errorPath[errorPath.length - 1].message, hash, errorPath);
    }
}
exports.ScrubParser = ScrubParser;
//# sourceMappingURL=scrub.js.map