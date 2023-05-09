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
exports.SarifParser = void 0;
const fs = __importStar(require("fs"));
const abstractParser_1 = require("./abstractParser");
const codeError_1 = require("../codeError");
const log_1 = require("../utils/log");
const fileLocation_1 = require("../utils/fileLocation");
/**
 * Sarif Parser
 */
class SarifParser extends abstractParser_1.AbstractParser {
    /**
     * Parses a file of the SARIF file format into an array of CodeError objects
     * @param filePath Path to the file to parse
     * @returns An array of CodeError objects parsed from the file
     */
    _parseFile(filePath, buildPath) {
        let errorList = new Array();
        // Parse the JSON
        let fileContents;
        let sarifResults;
        try {
            log_1.Log.message(`Parsing SARIF File from: ${filePath}`);
            fileContents = fs.readFileSync(filePath).toString();
            sarifResults = JSON.parse(fileContents);
        }
        catch (e) {
            log_1.Log.error(`Error parsing SARIF file from ${filePath}. Error ${e}.`);
            return errorList;
        }
        // Files Array
        let fileArray = sarifResults.runs[0].files;
        // For each of the results in the sarif file, create a CodeError object
        for (let resultObject of sarifResults.runs[0].results) {
            let errorFileLocation;
            if (fileArray == undefined) {
                // errorFileLocation = FileLocation.fromAnalyzerPath(resultObject.locations[0].physicalLocation.artifactLocation.uri, resultObject.locations[0].physicalLocation.region.startLine, buildPath)
                errorFileLocation = new fileLocation_1.FileLocation(resultObject.locations[0].physicalLocation.artifactLocation.uri, resultObject.locations[0].physicalLocation.region.startLine, buildPath);
            }
            else {
                errorFileLocation = this._getFileInfoFromObject(resultObject.locations[0], fileArray, buildPath);
            }
            // Parse the Code Flows
            let errorSteps = new Array();
            if (resultObject.codeFlows != undefined) {
                for (let step of resultObject.codeFlows[0].threadFlows[0].locations) {
                    // Get the location
                    let threadLocation = this._getFileInfoFromObject(step.location, fileArray, buildPath);
                    // Get the Message Text
                    let messageText = `${step.kind} - ${step.location.message.text}`;
                    // Create the object 
                    let errorStep = new codeError_1.ErrorPathStep(threadLocation, messageText);
                    // Add to the Array
                    errorSteps.push(errorStep);
                }
            }
            // Get the warning description
            let scrubFormatDesc = resultObject.message.text;
            // Create the New Error
            let newError = new codeError_1.CodeError(this._getNextErrorId(), this._name, errorFileLocation, resultObject.ruleId, scrubFormatDesc.replace(/\n/gi, "<br>"), undefined, // Hash
            errorSteps);
            errorList.push(newError);
        }
        // Done
        return errorList;
    }
    _getFileInfoFromObject(object, filesObject, buildPath) {
        let fileUri = filesObject[object.physicalLocation.fileLocation.fileIndex].fileLocation.uri;
        let lineNumber = object.physicalLocation.region.startLine;
        return fileLocation_1.FileLocation.fromAnalyzerPath(fileUri, lineNumber, buildPath);
    }
}
exports.SarifParser = SarifParser;
//# sourceMappingURL=sarif.js.map