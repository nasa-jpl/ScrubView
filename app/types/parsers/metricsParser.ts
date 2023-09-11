import * as fs from 'fs';
import { Log } from "../utils/log"
import { CodeMetrics } from '../codeMetrics';

export class MetricsParser
{
    public parseFile(filePath : string) : CodeMetrics
    {
        // Open and read the input file
        let fileContents;
        try {
            fileContents = fs.readFileSync(filePath).toString();
        }
        // Catch any errors
        catch(e) {
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

        return new CodeMetrics(toolName, numberOfFiles, numberOfFunctions, physicalLines, linesOfCode);

    }
}