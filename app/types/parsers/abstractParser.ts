import * as fs from 'fs';
import { CodeError } from "../codeError"
import { ReviewItemCollection } from "../reviewItemCollection"
import { Log } from "../utils/log"

export abstract class AbstractParser
{
    protected readonly _name : string;
    protected readonly _errorPrefix : string;
    private _nextErrorId : number;

    constructor(name : string, errorPrefix : string)
    {
        this._name = name;
        this._errorPrefix = errorPrefix;
        this._nextErrorId = 0;
    }

    protected abstract _parseFile(fileName : string, buildPath : string) : Array<CodeError>

    public parseFile(filePath : string, errorCollection : ReviewItemCollection, excludeFiles : Array<string>, excludeErrors : Array<string>, onlyIncludeFiles : Array<string>, buildPath : string)
    {
        // Call the child class parser
        let buildErrors = this._parseFile(filePath, buildPath);

        // Log
        Log.message(`${this._name} parsed ${buildErrors.length} errors`)
        let filteredCount = 0;
        let addedCount = 0;

        for(let errorObj of buildErrors)
        {
            // Filter the Errors
            let errorFiltered = false;

            // Tool Exclude Files
            for(let toolExcludeFile of excludeFiles)
            {
                let regex = new RegExp(toolExcludeFile);
                errorFiltered = errorFiltered || (regex.exec(errorObj.fileName) != null);
            }

            // Tool Exclude Errors
            for(let toolExcludeError of excludeErrors)
            {
                let regex = new RegExp(toolExcludeError);
                errorFiltered = errorFiltered || (regex.exec(errorObj.errorType) != null);
            }

            // If we're only including errors from certain files, test that now
            if(onlyIncludeFiles.length > 0)
            {
                let includeError = false;
                for(let testFile of onlyIncludeFiles)
                {
                    if(errorObj.fileName.includes(testFile))
                    {
                        includeError = true;
                        break;
                    }
                }
                
                errorFiltered = errorFiltered || !includeError;
            }
           
            // If not Filtered, Add the Error
            if(!errorFiltered) {
                errorCollection.addCodeError(errorObj);
                addedCount++;
            } else {
                filteredCount++;
            }

        }
        Log.message(`${this._name} added ${addedCount} errors and filtered ${filteredCount} errors`)
    }

    protected _getNextErrorId()
    {
        let rVal = this._errorPrefix + this._nextErrorId.toString().padStart(6, "0");
        this._nextErrorId += 1;
        return rVal;
    }
}