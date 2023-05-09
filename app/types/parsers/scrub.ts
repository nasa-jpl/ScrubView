import * as fs from 'fs';
import { AbstractParser } from './abstractParser';
import { CodeError, ErrorPathStep } from "../codeError"
import { Log } from "../utils/log"
import { FileLocation } from '../utils/fileLocation';

// Define the parser states: 
enum ParseStates 
{
    WarningLocation,
    WarningMessage
}

export class ScrubParser extends AbstractParser
{
    protected  _parseFile(filePath : string, buildPath : string) : Array<CodeError>
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
        
        // Initialize variables
        let pathSplit = filePath.split('/');
        let toolName = pathSplit[pathSplit.length - 1].replace('.scrub', '');
        let parseState = <ParseStates>ParseStates.WarningLocation;
        let errorType : null|string = null;
        let errorPaths : null | Array<ErrorPathStep> = null;
        let fileLocation : null | FileLocation = null;
        let warningMessage : null | Array<string> = [];
        let errorList = new Array<CodeError>();
        let locationRegex = /^[a-z]+[0-9]+ <.*>.*:.*:.*:/;
        let descriptionRegex = /        */;

        // Iterate through every line of the input file
        for(let lineNum = 0; lineNum < lines.length; ++lineNum)
        {
            // Get the line of interest
            let line = lines[lineNum];
            
            switch(parseState)
            {
                /////////////////////////////////////////
                // Gather the location data
                /////////////////////////////////////////
                case ParseStates.WarningLocation:
                    // Clear the previous warning
                    warningMessage = [];

                    // Go to the next line if the regex doesn't match
                    if(locationRegex.exec(line) == null) {
                        continue;
                    }

                    // Get the severity
                    errorType = line.split(/[<>]+/)[1];

                    // Get the warning location
                    // fileLocation = FileLocation.fromAnalyzerPath(line.split(":")[1], +line.split(":")[2], buildPath);
                    fileLocation = new FileLocation(line.split(":")[1], +line.split(":")[2], buildPath);
                    errorPaths = new Array<ErrorPathStep>();

                    // Update the parsing state
                    parseState = ParseStates.WarningMessage;
                    break;

                /////////////////////////////////////////
                // Gather the message
                /////////////////////////////////////////
                case ParseStates.WarningMessage:

                    // Make sure the 
                    if(errorPaths == null) {
                        throw new Error("Parser is in an impossible state: PathLine with no errorPaths object defined");
                    }

                    // Check to see if the end of the error message has been found
                    if (line == "") {
                        // Test if we have everything we need
                        if (errorType == null || fileLocation == null || warningMessage == null){
                            throw new Error("Bad parse.")
                        }
                        
                        // Add the warning data
                        errorPaths.push(new ErrorPathStep(fileLocation, warningMessage.join('<br>')));

                        // Create the new Error
                        let newError = this._createError(this._getNextErrorId(), toolName, errorType, errorPaths);
                        errorList.push(newError);

                        // Update the parser state
                        parseState = ParseStates.WarningLocation
                        
                        break;
                    }
                    else if(descriptionRegex.exec(line) != null)
                    {
                        // Test if we have everything we need
                        if(warningMessage == null) {
                            Log.error("Bad Parse.");
                            parseState = ParseStates.WarningLocation;
                            continue;
                        }

                        // Append line to the warning message
                        warningMessage.push(line.trim())

                        break;
                    }
            }
        }

        return errorList;
    }

    private _createError(id:string, tool:string, errorType:string, errorPath : Array<ErrorPathStep>, hash? :string ) : CodeError 
    {
        // Get the warning location
        let fileLocation = errorPath[0].fileLocation;

        return new CodeError(id, 
                             tool, 
                             fileLocation,
                             errorType, 
                             errorPath[errorPath.length-1].message, 
                             hash,
                             errorPath);
            
    }
}