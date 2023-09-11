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
        // Parse the metrics
        let pathSplit = filePath.split('/');
        let toolName = pathSplit[pathSplit.length - 1].replace('_metrics.csv', '');
        let lineSplit = lines[1].split(',');
        let numberOfFiles = lineSplit[2];
        let numberOfFunctions = lineSplit[3];
        let physicalLines = lineSplit[4];
        let linesOfCode = lineSplit[5];
        return new codeMetrics_1.CodeMetrics(toolName, numberOfFiles, numberOfFunctions, physicalLines, linesOfCode);
    }
}
exports.MetricsParser = MetricsParser;
//# sourceMappingURL=metricsParser.js.map