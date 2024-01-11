let $ = require('jquery');

import * as path from 'path';
import * as fs from 'fs';
import * as buildParser from "../types/buildParser"
import * as comments from "../types/commentObjects"
import * as common from "./components/common"
import { Configuration}  from '../types/utils/configuration';
import { CommandLineArgs } from '../types/utils/commandLineArgs';
import { DisplayMode } from "./stateManager";

// Component Imports
import { StateManager } from './stateManager';
import { FileBrowserComponent } from "./components/fileBrowser"
import { FolderBrowserComponent } from "./components/folderBrowser"
import { BuildListComponent } from './components/buildList';
import { ModuleListComponent } from "./components/moduleList";
import { AbstractComponent } from './components/abstractComponent';
import { Log } from '../types/utils/log';
import { ErrorList } from './components/errorList';
import { CommentList } from './components/commentList';
import { CommentBuilder } from './components/commentBuilder';
import { ModeSelector } from './components/modeSelector';
import { ErrorModalDialog } from './components/errorModalDialog';
import { LoadingModalDialog } from './components/loadingModalDialog';
import { ChoiceModalDialog } from './components/choiceModalDialog';
import { UserCollection } from '../types/userCollection';
import { RegistrationDialog } from './components/registrationDialog';
import { LogMessageViewer } from './components/logMessageViewer';
import { CodeCommentModal } from './components/codeCommentModal';
import { CodeError } from '../types/codeError';
import { CodeMetrics } from '../types/codeMetrics';
import { CodeComment } from '../types/codeComment';
// import { MetricsListComponent } from './components/metricsList';
import { BrowserWindow, ipcRenderer } from 'electron';
import { glob, globSync } from 'glob'

// State
let state = new StateManager();
let components = new Array<AbstractComponent>();
let errorList : null | ErrorList = null;

// Transient State
let selectedBuildName : null | string = null;

//------------------------------------------------------------------------------
// Page Initialization
export function init(argsJSON : string) 
{ 
    Log.debug("Starting Init")

    // State
    state = new StateManager();
    components = new Array<AbstractComponent>();

    // Reconstitute the command line arguments
    let args = CommandLineArgs.fromJSON(JSON.parse(argsJSON));

    // Create the configuration object and assign it to the state object
    let configuration = new Configuration(args);
    state.setConfiguration(configuration);

    if(state.configuration == null) 
        return;

    // Init the baseline Components
    // components.push(new ModuleListComponent(state));
    components.push(new FileBrowserComponent(state));
    components.push(new FolderBrowserComponent(state));
    components.push(new CommentList(state));
    components.push(new ErrorModalDialog(state));
    components.push(new LoadingModalDialog(state));
    components.push(new ChoiceModalDialog(state));
    components.push(new LogMessageViewer(state));
    components.push(new CodeCommentModal(state));
    // components.push(new MetricsListComponent(state));

    // Init components relevant to disposition
    if(args.disposition) {
        components.push(new ModeSelector(state));
        components.push(new RegistrationDialog(state));
        components.push(new CommentBuilder(state));
    }

    // We need a reference to the error list so we can call a few functions
    errorList = new ErrorList(state);
    components.push(errorList);

    // Set the Project Name
    //$("#menu-project-name").text(state.configuration.projectConfiguration.name);
    $("#menu-version").text(state.configuration.programVersion);
    $('#project-directory').text(`${state.configuration.projectConfiguration.buildFolder}`);
    // $("#current-dir").text(state.configuration.projectConfiguration.buildFolder);

    // Find the Builds
    // components.push(new BuildListComponent(state));
    // state.setBuildList(configuration.projectConfiguration.builds);

    // Parse the Users File
    let userCollection = new UserCollection(state.configuration);
    userCollection.fromFile();
    state.setUserCollection(userCollection);

    // Connect to Events
    state.on("onBuildClicked", (arg) => {
        onBuildClicked(arg);
    });

    // Initialize the browser with a build
    let selectedBuildName = configuration.projectConfiguration.name;
    let newBuild = buildParser.parseBuild(selectedBuildName, state);

    // Initialize the browser with a module
    let selectedModule = configuration.projectConfiguration.name;

    if(newBuild == null || newBuild.errors == null) {
        return;
    }
    state.setSelectedBuild(newBuild);

    // Load the metrics data
    if (newBuild.metrics.length > 0) {
        state.setMetricsTable(newBuild.metrics);
        ipcRenderer.send("metricsDataStatus", true);
    }
    else
    {
        ipcRenderer.send("metricsDataStatus", false);
    }

    // Is the current registered? If not, show the registration dialog
    if(!userCollection.userIsRegistered(state.configuration.currentUser))
    {
        RegistrationDialog.show();
    }
}

export function routeEvent(eventName : string, arg1 : any | null, arg2 : any | null)
{
    Log.debug(`Sending event: ${eventName} with arg1: ${arg1} and arg2: ${arg2}`);
    state.emit(eventName, arg1, arg2);
}

//------------------------------------------------------------------------------
// Build Dropdown Changed
function onBuildClicked(buildName : string)
{
    // Show the Loading Modal
    selectedBuildName = buildName;
    LoadingModalDialog.show("Loading build: " + buildName, loadBuild, true);
}

function loadBuild()
{
    if(selectedBuildName != null && state.configuration != null)
    {
        // Parse the Build Files Build
        let newBuild = buildParser.parseBuild(selectedBuildName, state);

        if(newBuild == null || newBuild.errors == null) {
            return;
        }
        state.setSelectedBuild(newBuild);
    }
    else 
    {
        Log.error("Unable to load build");
    }

    // Clear the transient state
    selectedBuildName = null;

    // Remove the loading modal
    LoadingModalDialog.hide();
}

export function updateMetrics()
{
    if(state.metricsList == null )
    {

    }


    return "";
}

// //------------------------------------------------------------------------------
// // Called by the IPC handlers from the main process
// export function addComment(commentString : string)
// {
//     if(state.selectedError == null) {
//         return;
//     }

//     if(state.displayMode == DisplayMode.Disposition)
//     {
//         // Otherwise, this is a new dev disposition (which may also have a 
//         // text comment)
//         let disposition;
//         switch(commentString)
//         {
//             case "Agree": disposition = comments.DeveloperDispositions.Agree; break;
//             case "Disagree": disposition = comments.DeveloperDispositions.Disagree; break;
//             case "Discuss": disposition = comments.DeveloperDispositions.Discuss; break;
//             default: return; // Invalid - Don't Add the Disposition
//         }

//         let newComment = new comments.DevDispositionComment(disposition);
//         state.selectedError.addComment(newComment);
//         state.emit("onCommentAdded");
//         state.emit("onDispositionAdded");
//     }
//     else
//     {
//             // Otherwise, this is a new dev disposition (which may also have a 
//             // text comment)
//             let disposition;
//             switch(commentString)
//             {
//                 case "No Action": disposition = comments.LeadDispositions.No_Action; break;
//                 case "Code Fix Requested": disposition = comments.LeadDispositions.Code_Fix_Requested; break;
//                 default: return; // Invalid - Don't Add the Disposition
//             }

//             let newComment = new comments.LeadDispositionComment(disposition);
//             state.selectedError.addComment(newComment);
//             state.emit("onCommentAdded");
//             state.emit("onDispositionAdded");
//     }

//     // Move to the next error
//     if(errorList != null) {
//         errorList.selectNextError();
//     }
// }

// export function dispositionAll(module:string, errorType:string, file:string, line:number, dispositionString:string, comment : string, overwriteExisting:boolean)
// {
//     if(state == null || state.selectedBuild == null)
//         return;

//     Log.warning(`Dispositioning all issues in module ${module} ${file}:${line} with disposition: ${dispositionString}`);

//     // Get all errors for the module
//     let errorList = state.selectedBuild.errors.getModuleReviewItemList(module);

//     for(let error of errorList)
//     {

//         let errorMatches = true;

//         // Error Type matches or is "*"
//         // Note this is the error type as displayed on the screen
//         if(errorType != "*" && error instanceof CodeError)
//             errorMatches = errorMatches && (error.formatErrorTypeForScreen().toUpperCase() == errorType.toUpperCase())

//         // File name matches? Or Filename is "*"
//         if(file != "*")
//             errorMatches = errorMatches && (error.fileName.toUpperCase() == file.toUpperCase());

//         // Line number matches or line number is -1
//         if(line != -1)
//             errorMatches = errorMatches && (error.lineNumber == line);

//         // Does this error match the file & line? If not, move on
//         if(!errorMatches)
//             continue;

//         // Match, add the disposition
//         let dispositionComment;
//         let hasExistingDisposition;
//         if(state.displayMode == DisplayMode.Disposition)
//         {
//             let disposition = comments.DeveloperDispositions[dispositionString as keyof typeof comments.DeveloperDispositions];

//             if(disposition == undefined){
//                 Log.error(`Disposition ${dispositionString} was not found. Unable to disposition.`);
//                 return;
//             }

//             dispositionComment = new comments.DevDispositionComment(disposition, comment);
//             hasExistingDisposition = error.hasDeveloperDisposition;
//         }
//         else 
//         {
//             let disposition = comments.LeadDispositions[dispositionString as keyof typeof comments.LeadDispositions];
//             if(disposition == undefined){
//                 Log.error(`Disposition ${dispositionString} was not found. Unable to disposition.`);
//                 return;
//             }

//             dispositionComment = new comments.LeadDispositionComment(disposition, comment);
//             hasExistingDisposition = error.hasLeadDisposition;
//         }

//         // Does this error have an existing disposition?
//         if(hasExistingDisposition && !overwriteExisting) {
//             Log.message(`Skipping ${error.hash} which has an existing disposition.`);
//             continue;
//         }
        
//         // Add the Disposition
//         error.addComment(dispositionComment);
//         Log.message(`Dispositioned ${error.hash}`)
//     }
// }

export function printSummary()
{

    if(state.selectedBuild == null) 
    {
        Log.warning("No Selected Build");
        return;
    }

    let modules = state.selectedBuild.modules;

    // Print the State of each module
    Log.message("Module,Total Items,Dev Dispositions,Lead Dispositions")
    for(let module of modules) 
    {
        let moduleItemList = state.selectedBuild.errors.getModuleReviewItemList(module);
        let totalReviewItems = moduleItemList.length;

        let hasDeveloperDiposition = 0;
        let hasLeadDisposition = 0;

        for(let reviewItem of moduleItemList)
        {
            if(reviewItem.hasDeveloperDisposition){
                hasDeveloperDiposition += 1;
            }

            if(reviewItem.hasLeadDisposition) {
                hasLeadDisposition += 1;
            }
        }

        // Console 
        Log.message(`${module},${totalReviewItems},${hasDeveloperDiposition},${hasLeadDisposition}`)
    }
}


export function loadMetrics()
{
    // let metricsFileList = globSync(state.currentBrowserPath + '/**/*');
    let metricsFileList = [];
    let metricsText = "";

    if(state.metricsList == null || state.selectedBuild == null)
    {
        return;
    }

    // Filter Ignored Files
    for(let filePath of globSync(state.currentBrowserPath + '/**/*'))
    {
        metricsFileList.push(path.relative(state.selectedBuild.codePath, filePath));
    }

    for(let toolMetrics of state.metricsList)
    {
        let scopeFileMetrics = new Array;
        let toolNumberofFiles = 0;
        let toolLinesOfCode = 0.0;
        let toolNumberOfFunctions = 0.0;
        let toolPhysicalLines = 0.0;
        let toolCyclomaticComplexity = 0.0;

        for(let relativePath of metricsFileList)
        {
            if(toolMetrics.fileMetrics.filter(x => x.file == relativePath).length)
            {
                let metricValue = toolMetrics.fileMetrics.find(x => x.file == relativePath);
                scopeFileMetrics.push(metricValue);

                if(metricValue == null)
                {
                    break;
                }

                toolNumberofFiles = toolNumberofFiles + 1;
                toolLinesOfCode = toolLinesOfCode + metricValue.linesOfCode;
                toolNumberOfFunctions = toolNumberOfFunctions + metricValue.numberOfFunctions;
                toolPhysicalLines = toolPhysicalLines + metricValue.physicalLines;
                toolCyclomaticComplexity = toolCyclomaticComplexity + metricValue.cyclomaticComplexity;
            }
        }

        let toolTitle = toolMetrics.tool.charAt(0).toUpperCase() + toolMetrics.tool.slice(1);
        let toolText = `${toolTitle} Metrics\nFiles: ${toolNumberofFiles}\nFunctions: ${toolNumberOfFunctions}\nPhysical Lines: ${toolPhysicalLines}\nCode Lines: ${toolLinesOfCode}\nCyclomatic Complexity: ${toolCyclomaticComplexity}\n\n`;
        metricsText = metricsText + toolText;
    }

    // Make the data available
    ipcRenderer.send("metricsDataReady", metricsText);

}

export function compareBuilds(previousBuildName : string, currentBuildName : string)
{
    Log.debug(`Starting to Compare Build ${previousBuildName} to ${currentBuildName}`);

    if(state == null) {
        return;
    }
    
    // Attempt to parse the builds 
    let previousBuild = buildParser.parseBuild(previousBuildName, state);

    if(previousBuild == null) {
        Log.error("Unable to parse previous build. Unable to continue with comparison");
        return;
    }

    let currentBuild = buildParser.parseBuild(currentBuildName, state);

    if(currentBuild == null) {
        Log.error("Unable to parse current build. Unable to continue with comparison");
        return;
    }

    // For Each Error Found in the current build, is there a cooresponding error 
    // in the previous build?
    for(let moduleName of currentBuild.modules)
    {
        Log.debug(`Comparing module ${moduleName}`);

        // List the errors for this module in the current & previous builds
        let currentBuildModuleErrorList = currentBuild.errors.getModuleReviewItemList(moduleName)
        let previousBuildModuleErrorList = previousBuild.errors.getModuleReviewItemList(moduleName)

        for(let currentError of currentBuildModuleErrorList) 
        {
            // Skip anything that isn't a static analysis error
            if(!(currentError instanceof CodeError))
                continue;
            
            for(let previousError of previousBuildModuleErrorList)
            {
                // Skip anything that isn't a static analysis error
                if(!(previousError instanceof CodeError))
                    continue;

                // Does this error match any in the previous build?
                let matches = true;
                matches = matches && (currentError.fileName == previousError.fileName);
                matches = matches && (currentError.lineNumber == previousError.lineNumber);
                matches = matches && (currentError.tool == previousError.tool);
                matches = matches && (currentError.errorType == previousError.errorType);
                matches = matches && (currentError.errorMessage == previousError.errorMessage);

                // If it matches, take action
                if(matches)
                {
                    Log.debug(`Found a match with error ${currentError.errorType} located at ${currentError.fileName}:${currentError.lineNumber}`);
                    let commentText = `This error was also found in build \`${previousBuildName}\`.`

                    // Add any developer disposition
                    let devComment = previousError.devDispositionComment;
                    if(devComment != null)  {

                        commentText += `\n\nIt was dispositioned by developer **${devComment.user}** as ${common.dispositionToBadge(devComment)}`;

                        if(devComment.message != "")
                            commentText += ` with message: ${devComment.message}`;
                        else 
                            commentText += " with no message.";

                    } else {
                        commentText += `\n\nThere was no developer disposition.`;
                    }

                    // Add any lead disposition
                    let leadComment = previousError.leadDispositionComment;
                    if(leadComment != null) {
                        commentText += `\n\nIt was dispositioned by lead **${leadComment.user}** as ${common.dispositionToBadge(leadComment)}`;

                        if(leadComment.message != "")
                            commentText += ` with message: ${leadComment.message}`;
                        else 
                            commentText += " with no message";

                    } else {
                        commentText += `\n\nThere was no lead disposition.`;
                    }

                    // Add the note
                    commentText += "\n\n*This Comment Added Automatically by ScrubView*."

                    // Add the Comment
                    currentError.addComment(new comments.TextComment(commentText, "scrubview"));

                    // Skip the rest of the loop
                    break;
                }
            }
        }
    }

}