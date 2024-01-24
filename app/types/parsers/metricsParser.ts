import * as fs from 'fs';
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
        
        // Get the metric indices
        let numberOfFunctionsIndex = -1;
        let physicalLinesIndex = -1;
        let linesOfCodeIndex = -1;
        let numberOfCommentsIndex = -1;
        let commentDensityIndex = -1;
        let cyclomaticComplexityIndex = -1;
        for(let i = 0; i < lines[0].split(',').length; i++)
        {
            let metricName = lines[0].split(',')[i];

            if(metricName.toLowerCase() == 'number of functions')
            {
                numberOfFunctionsIndex = i;
            }
            else if(metricName.toLowerCase() == 'total lines')
            {
                physicalLinesIndex = i;
            }
            else if(metricName.toLowerCase() == 'lines of code')
            {
                linesOfCodeIndex = i;
            }
            else if(metricName.toLowerCase() == 'number of comments')
            {
                numberOfCommentsIndex = i;
            }
            else if(metricName.toLowerCase() == 'comment density')
            {
                commentDensityIndex = i;
            }
            else if(metricName.toLowerCase() == 'cyclomatic complexity')
            {
                cyclomaticComplexityIndex = i;
            }
        }

        // Parse the project metrics
        let pathSplit = filePath.split('/');
        let toolName = pathSplit[pathSplit.length - 1].replace('_metrics.csv', '');

        // Parse the file metrics, if they exist
        let fileMetrics = new Array;
        let projectNumberOfFiles = 0;
        let projectNumberofFunctions = 0;
        let projectPhysicalLines = 0;
        let projectLinesOfCode = 0;
        let projectNumberOfComments = 0;
        let projectCommentDensity = 0;
        let projectCyclomaticComplexity = 0;

        for(let i = 2; i < lines.length; i++){
            let rawFileData = lines[i];
            let lineSplit = rawFileData.split(',');
            let fileNumberOfFunctions = Number(lineSplit[numberOfFunctionsIndex]);
            let filePhyscialLines = Number(lineSplit[physicalLinesIndex]);
            let fileLinesOfCode = Number(lineSplit[linesOfCodeIndex]);
            let fileNumberOfComments = Number(lineSplit[numberOfCommentsIndex]);
            let fileCommentDensity = Number(lineSplit[commentDensityIndex]);
            let fileCyclomaticComplexity = Number(lineSplit[cyclomaticComplexityIndex]);

            fileMetrics.push(new FileMetrics(lineSplit[0], lineSplit[1], fileNumberOfFunctions, filePhyscialLines, fileLinesOfCode, fileNumberOfComments, fileCommentDensity, fileCyclomaticComplexity))
        }

        return new CodeMetrics(toolName, projectNumberOfFiles, projectNumberofFunctions, projectPhysicalLines, projectLinesOfCode, projectNumberOfComments, projectCommentDensity, projectCyclomaticComplexity, fileMetrics);

    }
}