import * as fs from 'fs';
// import { Log } from "../utils/log"
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

        // Parse the file metrics, if they exist
        let fileMetrics = new Array;
        let projectNumberOfFiles = 0;
        let projectNumberofFunctions = 0;
        let projectPhysicalLines = 0;
        let projectLinesOfCode = 0;
        let projectCyclomaticComplexity = 0;

        for(let i = 2; i < lines.length; i++){
            let rawFileData = lines[i];
            let lineSplit = rawFileData.split(',');
            let fileNumberOfFunctions = Number(lineSplit[3]);
            let filePhyscialLines = Number(lineSplit[4]);
            let fileLinesOfCode = Number(lineSplit[5]);
            let fileCyclomaticComplexity = Number(lineSplit[7]);

            fileMetrics.push(new FileMetrics(lineSplit[0], lineSplit[1], fileNumberOfFunctions, filePhyscialLines, fileLinesOfCode, fileCyclomaticComplexity))
        }

        return new CodeMetrics(toolName, projectNumberOfFiles, projectNumberofFunctions, projectPhysicalLines, projectLinesOfCode, projectCyclomaticComplexity, fileMetrics);

    }
}