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
exports.compareBuilds = exports.printSummary = exports.dispositionAll = exports.addComment = exports.routeEvent = exports.init = void 0;
let $ = require('jquery');
const buildParser = __importStar(require("../types/buildParser"));
const comments = __importStar(require("../types/commentObjects"));
const common = __importStar(require("./components/common"));
const configuration_1 = require("../types/utils/configuration");
const commandLineArgs_1 = require("../types/utils/commandLineArgs");
const stateManager_1 = require("./stateManager");
// Component Imports
const stateManager_2 = require("./stateManager");
const fileBrowser_1 = require("./components/fileBrowser");
const folderBrowser_1 = require("./components/folderBrowser");
const moduleList_1 = require("./components/moduleList");
const log_1 = require("../types/utils/log");
const errorList_1 = require("./components/errorList");
const commentList_1 = require("./components/commentList");
const commentBuilder_1 = require("./components/commentBuilder");
const modeSelector_1 = require("./components/modeSelector");
const errorModalDialog_1 = require("./components/errorModalDialog");
const loadingModalDialog_1 = require("./components/loadingModalDialog");
const choiceModalDialog_1 = require("./components/choiceModalDialog");
const userCollection_1 = require("../types/userCollection");
const registrationDialog_1 = require("./components/registrationDialog");
const logMessageViewer_1 = require("./components/logMessageViewer");
const codeCommentModal_1 = require("./components/codeCommentModal");
const codeError_1 = require("../types/codeError");
// State
let state = new stateManager_2.StateManager();
let components = new Array();
let errorList = null;
// Transient State
let selectedBuildName = null;
//------------------------------------------------------------------------------
// Page Initialization
function init(argsJSON) {
    log_1.Log.debug("Starting Init");
    // State
    state = new stateManager_2.StateManager();
    components = new Array();
    // Reconstitute the command line arguments
    let args = commandLineArgs_1.CommandLineArgs.fromJSON(JSON.parse(argsJSON));
    // Create the configuration object and assign it to the state object
    let configuration = new configuration_1.Configuration(args);
    state.setConfiguration(configuration);
    if (state.configuration == null)
        return;
    // Init the baseline Components
    components.push(new moduleList_1.ModuleListComponent(state));
    components.push(new fileBrowser_1.FileBrowserComponent(state));
    components.push(new folderBrowser_1.FolderBrowserComponent(state));
    components.push(new commentList_1.CommentList(state));
    components.push(new errorModalDialog_1.ErrorModalDialog(state));
    components.push(new loadingModalDialog_1.LoadingModalDialog(state));
    components.push(new choiceModalDialog_1.ChoiceModalDialog(state));
    components.push(new logMessageViewer_1.LogMessageViewer(state));
    components.push(new codeCommentModal_1.CodeCommentModal(state));
    // Init components relevant to disposition
    if (args.disposition) {
        components.push(new modeSelector_1.ModeSelector(state));
        components.push(new registrationDialog_1.RegistrationDialog(state));
        components.push(new commentBuilder_1.CommentBuilder(state));
    }
    // We need a reference to the error list so we can call a few functions
    errorList = new errorList_1.ErrorList(state);
    components.push(errorList);
    // Set the Project Name
    //$("#menu-project-name").text(state.configuration.projectConfiguration.name);
    $("#menu-version").text(state.configuration.programVersion);
    // Find the Builds
    // components.push(new BuildListComponent(state));
    // state.setBuildList(configuration.projectConfiguration.builds);
    // Parse the Users File
    let userCollection = new userCollection_1.UserCollection(state.configuration);
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
    if (newBuild == null || newBuild.errors == null) {
        return;
    }
    state.setSelectedBuild(newBuild);
    // Is the current registered? If not, show the registration dialog
    if (!userCollection.userIsRegistered(state.configuration.currentUser)) {
        registrationDialog_1.RegistrationDialog.show();
    }
}
exports.init = init;
function routeEvent(eventName, arg1, arg2) {
    log_1.Log.debug(`Sending event: ${eventName} with arg1: ${arg1} and arg2: ${arg2}`);
    state.emit(eventName, arg1, arg2);
}
exports.routeEvent = routeEvent;
//------------------------------------------------------------------------------
// Build Dropdown Changed
function onBuildClicked(buildName) {
    // Show the Loading Modal
    selectedBuildName = buildName;
    loadingModalDialog_1.LoadingModalDialog.show("Loading build: " + buildName, loadBuild, true);
}
function loadBuild() {
    if (selectedBuildName != null && state.configuration != null) {
        // Parse the Build Files Build
        let newBuild = buildParser.parseBuild(selectedBuildName, state);
        if (newBuild == null || newBuild.errors == null) {
            return;
        }
        state.setSelectedBuild(newBuild);
    }
    else {
        log_1.Log.error("Unable to load build");
    }
    // Clear the transient state
    selectedBuildName = null;
    // Remove the loading modal
    loadingModalDialog_1.LoadingModalDialog.hide();
}
//------------------------------------------------------------------------------
// Called by the IPC handlers from the main process
function addComment(commentString) {
    if (state.selectedError == null) {
        return;
    }
    if (state.displayMode == stateManager_1.DisplayMode.Disposition) {
        // Otherwise, this is a new dev disposition (which may also have a 
        // text comment)
        let disposition;
        switch (commentString) {
            case "Agree":
                disposition = comments.DeveloperDispositions.Agree;
                break;
            case "Disagree":
                disposition = comments.DeveloperDispositions.Disagree;
                break;
            case "Discuss":
                disposition = comments.DeveloperDispositions.Discuss;
                break;
            default: return; // Invalid - Don't Add the Disposition
        }
        let newComment = new comments.DevDispositionComment(disposition);
        state.selectedError.addComment(newComment);
        state.emit("onCommentAdded");
        state.emit("onDispositionAdded");
    }
    else {
        // Otherwise, this is a new dev disposition (which may also have a 
        // text comment)
        let disposition;
        switch (commentString) {
            case "No Action":
                disposition = comments.LeadDispositions.No_Action;
                break;
            case "Code Fix Requested":
                disposition = comments.LeadDispositions.Code_Fix_Requested;
                break;
            default: return; // Invalid - Don't Add the Disposition
        }
        let newComment = new comments.LeadDispositionComment(disposition);
        state.selectedError.addComment(newComment);
        state.emit("onCommentAdded");
        state.emit("onDispositionAdded");
    }
    // Move to the next error
    if (errorList != null) {
        errorList.selectNextError();
    }
}
exports.addComment = addComment;
function dispositionAll(module, errorType, file, line, dispositionString, comment, overwriteExisting) {
    if (state == null || state.selectedBuild == null)
        return;
    log_1.Log.warning(`Dispositioning all issues in module ${module} ${file}:${line} with disposition: ${dispositionString}`);
    // Get all errors for the module
    let errorList = state.selectedBuild.errors.getModuleReviewItemList(module);
    for (let error of errorList) {
        let errorMatches = true;
        // Error Type matches or is "*"
        // Note this is the error type as displayed on the screen
        if (errorType != "*" && error instanceof codeError_1.CodeError)
            errorMatches = errorMatches && (error.formatErrorTypeForScreen().toUpperCase() == errorType.toUpperCase());
        // File name matches? Or Filename is "*"
        if (file != "*")
            errorMatches = errorMatches && (error.fileName.toUpperCase() == file.toUpperCase());
        // Line number matches or line number is -1
        if (line != -1)
            errorMatches = errorMatches && (error.lineNumber == line);
        // Does this error match the file & line? If not, move on
        if (!errorMatches)
            continue;
        // Match, add the disposition
        let dispositionComment;
        let hasExistingDisposition;
        if (state.displayMode == stateManager_1.DisplayMode.Disposition) {
            let disposition = comments.DeveloperDispositions[dispositionString];
            if (disposition == undefined) {
                log_1.Log.error(`Disposition ${dispositionString} was not found. Unable to disposition.`);
                return;
            }
            dispositionComment = new comments.DevDispositionComment(disposition, comment);
            hasExistingDisposition = error.hasDeveloperDisposition;
        }
        else {
            let disposition = comments.LeadDispositions[dispositionString];
            if (disposition == undefined) {
                log_1.Log.error(`Disposition ${dispositionString} was not found. Unable to disposition.`);
                return;
            }
            dispositionComment = new comments.LeadDispositionComment(disposition, comment);
            hasExistingDisposition = error.hasLeadDisposition;
        }
        // Does this error have an existing disposition?
        if (hasExistingDisposition && !overwriteExisting) {
            log_1.Log.message(`Skipping ${error.hash} which has an existing disposition.`);
            continue;
        }
        // Add the Disposition
        error.addComment(dispositionComment);
        log_1.Log.message(`Dispositioned ${error.hash}`);
    }
}
exports.dispositionAll = dispositionAll;
function printSummary() {
    if (state.selectedBuild == null) {
        log_1.Log.warning("No Selected Build");
        return;
    }
    let modules = state.selectedBuild.modules;
    // Print the State of each module
    log_1.Log.message("Module,Total Items,Dev Dispositions,Lead Dispositions");
    for (let module of modules) {
        let moduleItemList = state.selectedBuild.errors.getModuleReviewItemList(module);
        let totalReviewItems = moduleItemList.length;
        let hasDeveloperDiposition = 0;
        let hasLeadDisposition = 0;
        for (let reviewItem of moduleItemList) {
            if (reviewItem.hasDeveloperDisposition) {
                hasDeveloperDiposition += 1;
            }
            if (reviewItem.hasLeadDisposition) {
                hasLeadDisposition += 1;
            }
        }
        // Console 
        log_1.Log.message(`${module},${totalReviewItems},${hasDeveloperDiposition},${hasLeadDisposition}`);
    }
}
exports.printSummary = printSummary;
function compareBuilds(previousBuildName, currentBuildName) {
    log_1.Log.debug(`Starting to Compare Build ${previousBuildName} to ${currentBuildName}`);
    if (state == null) {
        return;
    }
    // Attempt to parse the builds 
    let previousBuild = buildParser.parseBuild(previousBuildName, state);
    if (previousBuild == null) {
        log_1.Log.error("Unable to parse previous build. Unable to continue with comparison");
        return;
    }
    let currentBuild = buildParser.parseBuild(currentBuildName, state);
    if (currentBuild == null) {
        log_1.Log.error("Unable to parse current build. Unable to continue with comparison");
        return;
    }
    // For Each Error Found in the current build, is there a cooresponding error 
    // in the previous build?
    for (let moduleName of currentBuild.modules) {
        log_1.Log.debug(`Comparing module ${moduleName}`);
        // List the errors for this module in the current & previous builds
        let currentBuildModuleErrorList = currentBuild.errors.getModuleReviewItemList(moduleName);
        let previousBuildModuleErrorList = previousBuild.errors.getModuleReviewItemList(moduleName);
        for (let currentError of currentBuildModuleErrorList) {
            // Skip anything that isn't a static analysis error
            if (!(currentError instanceof codeError_1.CodeError))
                continue;
            for (let previousError of previousBuildModuleErrorList) {
                // Skip anything that isn't a static analysis error
                if (!(previousError instanceof codeError_1.CodeError))
                    continue;
                // Does this error match any in the previous build?
                let matches = true;
                matches = matches && (currentError.fileName == previousError.fileName);
                matches = matches && (currentError.lineNumber == previousError.lineNumber);
                matches = matches && (currentError.tool == previousError.tool);
                matches = matches && (currentError.errorType == previousError.errorType);
                matches = matches && (currentError.errorMessage == previousError.errorMessage);
                // If it matches, take action
                if (matches) {
                    log_1.Log.debug(`Found a match with error ${currentError.errorType} located at ${currentError.fileName}:${currentError.lineNumber}`);
                    let commentText = `This error was also found in build \`${previousBuildName}\`.`;
                    // Add any developer disposition
                    let devComment = previousError.devDispositionComment;
                    if (devComment != null) {
                        commentText += `\n\nIt was dispositioned by developer **${devComment.user}** as ${common.dispositionToBadge(devComment)}`;
                        if (devComment.message != "")
                            commentText += ` with message: ${devComment.message}`;
                        else
                            commentText += " with no message.";
                    }
                    else {
                        commentText += `\n\nThere was no developer disposition.`;
                    }
                    // Add any lead disposition
                    let leadComment = previousError.leadDispositionComment;
                    if (leadComment != null) {
                        commentText += `\n\nIt was dispositioned by lead **${leadComment.user}** as ${common.dispositionToBadge(leadComment)}`;
                        if (leadComment.message != "")
                            commentText += ` with message: ${leadComment.message}`;
                        else
                            commentText += " with no message";
                    }
                    else {
                        commentText += `\n\nThere was no lead disposition.`;
                    }
                    // Add the note
                    commentText += "\n\n*This Comment Added Automatically by ScrubView*.";
                    // Add the Comment
                    currentError.addComment(new comments.TextComment(commentText, "scrubview"));
                    // Skip the rest of the loop
                    break;
                }
            }
        }
    }
}
exports.compareBuilds = compareBuilds;
//# sourceMappingURL=mainWindow.js.map