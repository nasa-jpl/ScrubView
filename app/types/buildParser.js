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
exports.parseBuild = exports.Build = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const reviewItemCollection_1 = require("./reviewItemCollection");
const sarif_1 = require("./parsers/sarif");
const scrub_1 = require("./parsers/scrub");
const metricsParser_1 = require("./parsers/metricsParser");
const reviewManager_1 = require("./reviewManager");
const errorModalDialog_1 = require("../views/components/errorModalDialog");
const log_1 = require("./utils/log");
const loadingModalDialog_1 = require("../views/components/loadingModalDialog");
const commentObjects_1 = require("./commentObjects");
const codeComment_1 = require("./codeComment");
class Build {
    constructor(name, buildCodePath, buildScrubPath, errors, metrics, modules) {
        this._name = name;
        this._buildCodePath = buildCodePath;
        this._buildScrubPath = buildScrubPath;
        this._errors = errors;
        this._metrics = metrics;
        this._modules = modules;
        this._reviewManager = new reviewManager_1.ReviewManager(this);
    }
    // Accessors
    get name() { return this._name; }
    get codePath() { return this._buildCodePath; }
    get scrubPath() { return this._buildScrubPath; }
    get errors() { return this._errors; }
    get metrics() { return this._metrics; }
    get modules() { return this._modules; }
    get reviewManager() { return this._reviewManager; }
}
exports.Build = Build;
/**
 * Marks the given build as active and parses the expected static analysis
 * finding files
 * @param buildName Name of the build
 * @param projectOptions Project options object from projectConfig.json
 * @returns A code error collection of the static analysis findings
 */
function parseBuild(buildName, state) {
    // Can't do much if we haven't set the project options yet
    if (state.configuration == null || state.configuration.projectConfiguration == null) {
        return null;
    }
    let buildSettings = state.configuration.getBuildSettings(buildName);
    if (buildSettings == null) {
        return null;
    }
    // Load the Modules for this Build
    let projectOptions = state.configuration.projectConfiguration;
    let buildSrcDir = buildSettings.buildFolder;
    let modules = [];
    // If the Build Folder isn't specified, we have a problem
    if (buildSrcDir == undefined) {
        log_1.Log.error(`Build folder is undefined for build ${buildName}`);
        return null;
    }
    try {
        log_1.Log.message("Searching for modules in: " + buildSrcDir);
        // Add all of the directories to the module list
        for (let item of fs.readdirSync(buildSrcDir)) {
            if (fs.lstatSync(path.join(buildSrcDir, item)).isDirectory() && item != '.scrub') {
                modules.push(item);
            }
        }
    }
    catch (e) {
        log_1.Log.error(`Error reading build src directory: ${buildSrcDir}. Error: ${e}`);
        loadingModalDialog_1.LoadingModalDialog.hide();
        errorModalDialog_1.ErrorModalDialog.show("Error Reading Build Directory", "There was an error reading the build directory. Unable to load the build. Please contact your scrub administrator.");
        return null;
    }
    modules.sort();
    // Get the Path to the Scrub Dir
    let scrubDirPath = projectOptions.scrubFolder;
    // Create a Code Error Collection
    let errorCollection = new reviewItemCollection_1.ReviewItemCollection(scrubDirPath);
    let toolCount = projectOptions.tools.length;
    let toolIndex = 0;
    // Create a metric collection
    let metricsCollection = new Array;
    // Read the tool error files and metrics files if they exist
    for (let toolEntry of projectOptions.tools) {
        // Create the tool output path
        let toolOutputFilePath = path.join(scrubDirPath, toolEntry.resultsFile);
        // Does a file for this tool exist?
        if (!fs.existsSync(toolOutputFilePath)) {
            log_1.Log.warning(`No output found for tool: ${toolEntry.name} at ${toolOutputFilePath}. Skipping this tool.`);
            continue;
        }
        else {
            // Resolve any symbolic links
            toolOutputFilePath = fs.realpathSync(toolOutputFilePath);
        }
        // Parse the Tool
        let parser;
        switch (toolEntry.parser) {
            case "sarif":
                parser = new sarif_1.SarifParser(toolEntry.name, toolEntry.prefix);
                break;
            case "scrub":
                parser = new scrub_1.ScrubParser(toolEntry.name, toolEntry.prefix);
                break;
            default:
                log_1.Log.error(`Unknown parser ${toolEntry.parser} for tool ${toolEntry.name}. Skipping this tool.`);
                loadingModalDialog_1.LoadingModalDialog.hide();
                errorModalDialog_1.ErrorModalDialog.show("Project Configuration Error", `Unknown parser ${toolEntry.parser} for tool ${toolEntry.name}. Contact your scrub administrator.`);
                return null;
        }
        // Does a metrics file exist?
        if (toolEntry.metricsFile.length > 0) {
            let metricParser = new metricsParser_1.MetricsParser();
            // Resolve any symbolic links
            let toolMetricsFilePath = fs.realpathSync(path.join(scrubDirPath, toolEntry.metricsFile));
            // Parse the metrics file
            metricsCollection.push(metricParser.parseFile(toolMetricsFilePath));
        }
        // Verify we have exclusions set up properly
        if (buildSettings.globalExcludeFiles == undefined || buildSettings.onlyIncludeFiles == undefined) {
            log_1.Log.error(`Error with project settings`);
            return null;
        }
        // Setup the Excludes
        let excludeFiles = toolEntry.excludeFiles.concat(buildSettings.globalExcludeFiles);
        // Update the progress dialog
        loadingModalDialog_1.LoadingModalDialog.updateMessage(`Parsing file: ${toolOutputFilePath}`);
        loadingModalDialog_1.LoadingModalDialog.updateProgress((toolIndex + 1) / toolCount);
        // Parse the File
        try {
            parser.parseFile(toolOutputFilePath, errorCollection, excludeFiles, toolEntry.excludeErrors, buildSettings.onlyIncludeFiles, buildSrcDir);
        }
        catch (e) {
            loadingModalDialog_1.LoadingModalDialog.hide();
            errorModalDialog_1.ErrorModalDialog.show("Build Parse Error", `<div><span style="font-weight:bold;">File:</span> ${toolOutputFilePath}</div>
                                                        <div><span style="font-weight:bold;">Tool:</span> ${toolEntry.name}</div>
                                                        <div><span style="font-weight:bold;">Parser:</span> ${toolEntry.parser}</div>
                                                        <div><span style="font-weight:bold;">Error:</span> ${e.message}</div>
                                                        <div>Contact your scrub administrator</div>`);
            return null;
        }
    }
    // Read all the user comments & disposition files
    let scrubFiles = fs.readdirSync(scrubDirPath);
    let userComments = new Array();
    for (let filename of scrubFiles) {
        if (filename.startsWith("comments_")) {
            let filePath = path.join(scrubDirPath, filename);
            let thisUsersComments = parseCommentFile(filePath, errorCollection, buildSrcDir);
            if (thisUsersComments != null) {
                userComments = userComments.concat(thisUsersComments);
            }
        }
    }
    // Match each user comment to its matching AbstractReviewItem
    let commentsInError = 0;
    for (let userComment of userComments) {
        let reviewItem = errorCollection.getReviewItem(userComment[0]);
        if (reviewItem == undefined) {
            log_1.Log.error(`Unable to find code error with hash ${userComment[0]}, unable to add comments`);
            commentsInError++;
            continue;
        }
        // Assign the comment to the review item
        reviewItem.addComment(userComment[1]);
    }
    // If we couldn't associate comments with review items, notify
    if (commentsInError > 0) {
        log_1.Log.warning(`Skipped ${commentsInError} comments from file ${path}`);
        errorModalDialog_1.ErrorModalDialog.show("File Error", `${commentsInError} user comments or dispositions could not be associated with errors. If further changes are made, these comments will be lost. It is recommended you close this application, and contact your scrub administrator now.`);
    }
    // Set the Collection to completed init
    errorCollection.setInitComplete();
    // Create the Build Object
    let buildScrubFolder = projectOptions.scrubFolder;
    let newBuildObject = new Build(buildName, buildSrcDir, buildScrubFolder, errorCollection, metricsCollection, modules);
    return newBuildObject;
}
exports.parseBuild = parseBuild;
function parseCommentFile(path, errorCollection, buildPath) {
    // Read the JSON File
    let fileData;
    try {
        fileData = JSON.parse(fs.readFileSync(path).toString());
    }
    catch (err) {
        log_1.Log.error(`Error reading comment file ${path}. Error: ${err.toString()}`);
        return null;
    }
    // Add the Comments to the error
    let userComments = new Array();
    for (let errorData of fileData.errors) {
        for (let commentData of errorData.comments) {
            let newComment = commentObjects_1.AbstractComment.fromJSON(fileData.fileVersion, commentData);
            if (newComment != null) {
                userComments.push([errorData.hash, newComment]);
            }
        }
    }
    // Parse teh Code Comments (If there are any)
    if (fileData.codeComments != undefined) {
        let commentIndex = 1; // Start with Comment 1 (not comment 0)
        for (let codeCommentJson of fileData.codeComments) {
            // Create the new Code Comment
            let newCodeComment = codeComment_1.CodeComment.fromJSON(codeCommentJson, commentIndex, buildPath);
            commentIndex += 1;
            // Add it to the running reviewItemCollection
            errorCollection.addCodeComment(newCodeComment);
        }
    }
    log_1.Log.message(`Parsed ${userComments.length} comments from file ${path}.`);
    return userComments;
}
//# sourceMappingURL=buildParser.js.map