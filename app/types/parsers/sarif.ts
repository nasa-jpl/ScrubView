import * as fs from 'fs';
import { AbstractParser } from './abstractParser';
import { CodeError, ErrorPathStep } from "../codeError"
import { Log } from "../utils/log"
import { FileLocation } from '../utils/fileLocation';

/**
 * Sarif Parser
 */
export class SarifParser extends AbstractParser
{
    /**
     * Parses a file of the SARIF file format into an array of CodeError objects
     * @param filePath Path to the file to parse
     * @returns An array of CodeError objects parsed from the file
     */
    protected _parseFile(filePath : string, buildPath : string) : Array<CodeError>
    {
        let errorList = new Array<CodeError>();

        // Parse the JSON
        let fileContents;
        let sarifResults;

        try {
            Log.message(`Parsing SARIF File from: ${filePath}`)
            fileContents = fs.readFileSync(filePath).toString();
            sarifResults = JSON.parse(fileContents);
        }
        catch(e) {
            Log.error(`Error parsing SARIF file from ${filePath}. Error ${e}.`);
            return errorList;
        }

        // Files Array
        let fileArray = sarifResults.runs[0].files;

        // For each of the results in the sarif file, create a CodeError object
        for(let resultObject of sarifResults.runs[0].results)
        {
            let errorFileLocation;
            if(fileArray == undefined) {
                // errorFileLocation = FileLocation.fromAnalyzerPath(resultObject.locations[0].physicalLocation.artifactLocation.uri, resultObject.locations[0].physicalLocation.region.startLine, buildPath)
                errorFileLocation = new FileLocation(resultObject.locations[0].physicalLocation.artifactLocation.uri, resultObject.locations[0].physicalLocation.region.startLine, buildPath);
            } else {
                errorFileLocation = this._getFileInfoFromObject(resultObject.locations[0], fileArray, buildPath);
            }
            

            // Parse the Code Flows
            let errorSteps = new Array<ErrorPathStep>();

            if(resultObject.codeFlows != undefined) 
            {
                for(let codeFlow of resultObject.codeFlows) 
                {
                    for(let threadFlow of codeFlow.threadFlows)
                    {
                        for(let location of threadFlow.locations)
                        {
                            // Get the location
                            // let threadLocation = this._getFileInfoFromObject(step.location, fileArray, buildPath);
                            let threadLocation = FileLocation.fromAnalyzerPath(location.location.physicalLocation.artifactLocation.uri, location.location.physicalLocation.region.startLine, buildPath);

                            // Get the Message Text
                            // let messageText = `${step.kind} - ${step.location.message.text}`;
                            let messageText = location.location.message.text;

                            // Create the object 
                            let errorStep = new ErrorPathStep(threadLocation, messageText);

                            // Add to the Array
                            errorSteps.push(errorStep);
                        }
                    }
                }
            }

            // // Get the warning description
            // let scrubFormatDesc = '';
            // if(this._name == 'coverity')
            // {
            //     scrubFormatDesc = resultObject.message.text.split("\n")[1];
            // } else {
            //     scrubFormatDesc = resultObject.message.text;
            // }

            let scrubFormatDesc = resultObject.message.text;
            // Create the New Error
            let newError = new CodeError(this._getNextErrorId(), 
                                              this._name,
                                              errorFileLocation,
                                              resultObject.ruleId,
                                              scrubFormatDesc.replace(/\n/gi, "<br>"),
                                              undefined, // Hash
                                              errorSteps);
            errorList.push(newError);
        }

        // Done
        return errorList;
    }

    private _getFileInfoFromObject(object : any, filesObject : any, buildPath : string) : FileLocation
    {
        let fileUri = filesObject[object.physicalLocation.fileLocation.fileIndex].fileLocation.uri;
        let lineNumber =  object.physicalLocation.region.startLine
        return FileLocation.fromAnalyzerPath(fileUri, lineNumber, buildPath);
    }
}