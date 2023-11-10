import * as fs from 'fs';
import { Log } from "../utils/log"
import { CodeMetrics, FileMetrics } from '../codeMetrics';

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
        
        // Parse the project metrics
        let pathSplit = filePath.split('/');
        let toolName = pathSplit[pathSplit.length - 1].replace('_metrics.csv', '');
        let lineSplit = lines[1].split(',');
        let numberOfFiles = lineSplit[2];
        let numberOfFunctions = lineSplit[3];
        let physicalLines = lineSplit[4];
        let linesOfCode = lineSplit[5];

        // Parse the file metrics, if they exist
        let fileMetrics = new Array;
        for(let i = 2; i < lines.length; i++){
            let rawFileData = lines[i];
            lineSplit = rawFileData.split(',');
            fileMetrics.push(new FileMetrics(lineSplit[0], lineSplit[1], lineSplit[3], lineSplit[4], lineSplit[5]))
        }

        return new CodeMetrics(toolName, numberOfFiles, numberOfFunctions, physicalLines, linesOfCode);

    }
}