import * as fs from 'fs';
import * as path from 'path';
import * as ap from "./parsers/abstractParser";
import * as view from "../views/mainWindow"

import { ReviewItemCollection } from "./reviewItemCollection"
import { CodeError } from "./codeError"
import { SarifParser } from './parsers/sarif';
import { ScrubParser } from './parsers/scrub'
import { ReviewManager } from './reviewManager';
import { ErrorModalDialog } from '../views/components/errorModalDialog';
import { Log } from "./utils/log"
import { LoadingModalDialog } from '../views/components/loadingModalDialog';
import { StateManager } from '../views/stateManager';
import { TextComment, DevDispositionComment, LeadDispositionComment, AbstractComment } from './commentObjects';
import { CodeComment } from './codeComment';
import { AbstractReviewItem } from './abstractReviewItem';


export class Build
{
    protected _name : string;
    protected _buildCodePath : string;
    protected _buildScrubPath : string;
    protected _errors : ReviewItemCollection;
    protected _modules : Array<string>;
    protected _reviewManager : ReviewManager;

    // Accessors
    get name() : string { return this._name; }
    get codePath() : string {return this._buildCodePath; }
    get scrubPath() : string { return this._buildScrubPath; }
    get errors() : ReviewItemCollection {return this._errors; }
    get modules() : Array<string> { return this._modules; }
    get reviewManager() : ReviewManager { return this._reviewManager; }
    

    constructor(name : string, buildCodePath : string, buildScrubPath : string, errors : ReviewItemCollection, modules : Array<string>)
    {      
        this._name = name;
        this._buildCodePath = buildCodePath;
        this._buildScrubPath = buildScrubPath;
        this._errors = errors;
        this._modules = modules;
        this._reviewManager = new ReviewManager(this);
    }
}

/**
 * Marks the given build as active and parses the expected static analysis
 * finding files
 * @param buildName Name of the build
 * @param projectOptions Project options object from projectConfig.json
 * @returns A code error collection of the static analysis findings
 */
export function parseBuild(buildName: string, state : StateManager ) : Build | null
{
    // Can't do much if we haven't set the project options yet
    if(state.configuration == null || state.configuration.projectConfiguration == null) {
        return null;
    }

    let buildSettings = state.configuration.getBuildSettings(buildName);

    if(buildSettings == null) {
        return null;
    }
   
    // Load the Modules for this Build
    let projectOptions = state.configuration.projectConfiguration;
    let buildSrcDir  = buildSettings.buildFolder
    let modules = [];

    // If the Build Folder isn't specified, we have a problem
    if(buildSrcDir == undefined) {
        Log.error(`Build folder is undefined for build ${buildName}`);
        return null;
    }
    
    try {
        Log.message("Searching for modules in: " + buildSrcDir);
        // Add all of the directories to the module list
        for(let item of fs.readdirSync(buildSrcDir)) {
            if(fs.lstatSync(path.join(buildSrcDir, item)).isDirectory() && item != '.scrub'){
                modules.push(item);
            }
        }
    } 
    catch(e:any) {
        Log.error(`Error reading build src directory: ${buildSrcDir}. Error: ${e}`);
        LoadingModalDialog.hide();
        ErrorModalDialog.show("Error Reading Build Directory", "There was an error reading the build directory. Unable to load the build. Please contact your scrub administrator.");
        return null;
    }
    
    modules.sort()

    // Get the Path to the Scrub Dir
    let scrubDirPath = projectOptions.scrubFolder;

    // Create a Code Error Collection
    let errorCollection = new ReviewItemCollection(scrubDirPath);
    let toolCount = projectOptions.tools.length;
    let toolIndex = 0;

    // Read the tool error files
    for(let toolEntry of projectOptions.tools)
    {
        // Create the tool output path
        let toolOutputFilePath = path.join(scrubDirPath, toolEntry.resultsFile);

        // Does a file for this tool exist?
        if(!fs.existsSync(toolOutputFilePath)) {
            Log.warning(`No output found for tool: ${toolEntry.name} at ${toolOutputFilePath}. Skipping this tool.`);
            continue;
        } else {
            // Resolve any symbolic links
            toolOutputFilePath = fs.realpathSync(toolOutputFilePath);
        }

        // Parse the Tool
        let parser : ap.AbstractParser;
        switch(toolEntry.parser)
        {
            // case "coverity":
            //     parser = new CoverityParser(toolEntry.name, toolEntry.prefix);
            //     break;

            // case "codesonar":
            //     parser = new CodeSonarParser(toolEntry.name, toolEntry.prefix);
            //     break;

            case "sarif":
                parser = new SarifParser(toolEntry.name, toolEntry.prefix);
                break;

            case "scrub":
                parser = new ScrubParser(toolEntry.name, toolEntry.prefix);
                break;

            default:
                Log.error(`Unknown parser ${toolEntry.parser} for tool ${toolEntry.name}. Skipping this tool.`);
                LoadingModalDialog.hide();
                ErrorModalDialog.show("Project Configuration Error", `Unknown parser ${toolEntry.parser} for tool ${toolEntry.name}. Contact your scrub administrator.`);
                return null;
        }

        // Verify we have exclusions set up properly
        if(buildSettings.globalExcludeFiles == undefined || buildSettings.onlyIncludeFiles == undefined) {
            Log.error(`Error with project settings`);
            return null;
        }

        // Setup the Excludes
        let excludeFiles = toolEntry.excludeFiles.concat(buildSettings.globalExcludeFiles);

        // Update the progress dialog
        LoadingModalDialog.updateMessage(`Parsing file: ${toolOutputFilePath}`);
        LoadingModalDialog.updateProgress((toolIndex + 1) / toolCount);

        // Parse the File
        try {
            parser.parseFile(toolOutputFilePath, errorCollection, excludeFiles, toolEntry.excludeErrors, buildSettings.onlyIncludeFiles, buildSrcDir);
        } catch(e:any)
        {
            LoadingModalDialog.hide();
            ErrorModalDialog.show("Build Parse Error", `<div><span style="font-weight:bold;">File:</span> ${toolOutputFilePath}</div>
                                                        <div><span style="font-weight:bold;">Tool:</span> ${toolEntry.name}</div>
                                                        <div><span style="font-weight:bold;">Parser:</span> ${toolEntry.parser}</div>
                                                        <div><span style="font-weight:bold;">Error:</span> ${e.message}</div>
                                                        <div>Contact your scrub administrator</div>`);
            return null;
        }
    }

    // Read all the user comments & disposition files
    let scrubFiles = fs.readdirSync(scrubDirPath)
    let userComments = new Array<[string, AbstractComment]>();
    for(let filename of scrubFiles)
    {
        if(filename.startsWith("comments_"))
        {
            let filePath = path.join(scrubDirPath, filename);
            let thisUsersComments= parseCommentFile(filePath, errorCollection, buildSrcDir);

            if(thisUsersComments != null) {
                userComments = userComments.concat(thisUsersComments);
            }
        }
    }

    // Match each user comment to its matching AbstractReviewItem
    let commentsInError = 0;
    for(let userComment of userComments)
    {
        let reviewItem = <CodeError>errorCollection.getReviewItem(userComment[0]);

        if(reviewItem == undefined){
            Log.error(`Unable to find code error with hash ${userComment[0]}, unable to add comments`);
            commentsInError++;
            continue;
        }

        // Assign the comment to the review item
        reviewItem.addComment(userComment[1]);
    }

    // If we couldn't associate comments with review items, notify
    if(commentsInError > 0) { 
        Log.warning(`Skipped ${commentsInError} comments from file ${path}`);
        ErrorModalDialog.show("File Error", `${commentsInError} user comments or dispositions could not be associated with errors. If further changes are made, these comments will be lost. It is recommended you close this application, and contact your scrub administrator now.`);
    }

    // Set the Collection to completed init
    errorCollection.setInitComplete();

    // Create the Build Object
    // let buildScrubFolder = path.join(projectOptions.scrubFolder, buildName);
    let buildScrubFolder = projectOptions.scrubFolder;
    let newBuildObject = new Build(buildName, buildSrcDir, buildScrubFolder, errorCollection, modules);
    return newBuildObject;
}

function parseCommentFile(path : string, errorCollection : ReviewItemCollection, buildPath : string) : Array<[string, AbstractComment]> | null
{
    // Read the JSON File
    let fileData;
    try {
        fileData = JSON.parse(fs.readFileSync(path).toString());
    }
    catch(err:any){
        Log.error(`Error reading comment file ${path}. Error: ${err.toString()}`);
        return null;
    }

    // Add the Comments to the error
    let userComments = new Array<[string, AbstractComment]>();

    for(let errorData of fileData.errors)
    {
        for(let commentData of errorData.comments)
        {
            let newComment = AbstractComment.fromJSON(fileData.fileVersion, commentData);

            if(newComment != null) {
                userComments.push([errorData.hash, newComment]);
            }
        }
    }

    // Parse teh Code Comments (If there are any)
    if(fileData.codeComments != undefined)
    {
        let commentIndex = 1; // Start with Comment 1 (not comment 0)
        for(let codeCommentJson of fileData.codeComments)
        {
            // Create the new Code Comment
            let newCodeComment = CodeComment.fromJSON(codeCommentJson, commentIndex, buildPath);
            commentIndex += 1;

            // Add it to the running reviewItemCollection
            errorCollection.addCodeComment(newCodeComment);
        }
    }

    Log.message(`Parsed ${userComments.length} comments from file ${path}.`);
    return userComments;
}
