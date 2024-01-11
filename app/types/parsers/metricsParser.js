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
exports.MetricsParser = void 0;
const fs = __importStar(require("fs"));
// import { Log } from "../utils/log"
const codeMetrics_1 = require("../codeMetrics");
class MetricsParser {
    parseFile(filePath) {
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
        // Parse the project metrics
        let pathSplit = filePath.split('/');
        let toolName = pathSplit[pathSplit.length - 1].replace('_metrics.csv', '');
        // Parse the file metrics, if they exist
        let fileMetrics = new Array;
        let projectNumberOfFiles = 0;
        let projectNumberofFunctions = 0;
        let projectPhysicalLines = 0;
        let projectLinesOfCode = 0;
        let projectCyclomaticComplexity = 0;
        for (let i = 2; i < lines.length; i++) {
            let rawFileData = lines[i];
            let lineSplit = rawFileData.split(',');
            let fileNumberOfFunctions = Number(lineSplit[3]);
            let filePhyscialLines = Number(lineSplit[4]);
            let fileLinesOfCode = Number(lineSplit[5]);
            let fileCyclomaticComplexity = Number(lineSplit[7]);
            fileMetrics.push(new codeMetrics_1.FileMetrics(lineSplit[0], lineSplit[1], fileNumberOfFunctions, filePhyscialLines, fileLinesOfCode, fileCyclomaticComplexity));
        }
        return new codeMetrics_1.CodeMetrics(toolName, projectNumberOfFiles, projectNumberofFunctions, projectPhysicalLines, projectLinesOfCode, projectCyclomaticComplexity, fileMetrics);
    }
}
exports.MetricsParser = MetricsParser;
//# sourceMappingURL=metricsParser.js.map