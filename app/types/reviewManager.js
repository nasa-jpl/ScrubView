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
exports.ReviewManager = exports.ReviewCompleteStatus = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const codeError_1 = require("./codeError");
const commentObjects_1 = require("./commentObjects");
const log_1 = require("./utils/log");
var ReviewCompleteStatus;
(function (ReviewCompleteStatus) {
    ReviewCompleteStatus[ReviewCompleteStatus["NotInitialized"] = 0] = "NotInitialized";
    ReviewCompleteStatus[ReviewCompleteStatus["AllErrorsNotDispositioned"] = 1] = "AllErrorsNotDispositioned";
    ReviewCompleteStatus[ReviewCompleteStatus["Ok"] = 2] = "Ok";
})(ReviewCompleteStatus = exports.ReviewCompleteStatus || (exports.ReviewCompleteStatus = {}));
class ReviewManager {
    constructor(build) {
        this._filename = "reviewed.json";
        this._outputPath = null;
        this._reviewedErrors = new Array();
        this._reviewedModules = new Array();
        this._build = build;
        // Read the combined.json file (if it exists)
        this._outputPath = build.scrubPath;
        let combinedFilePath = path.join(build.scrubPath, this._filename);
        if (fs.existsSync(combinedFilePath)) {
            try {
                let fileData = JSON.parse(fs.readFileSync(combinedFilePath).toString());
                this._reviewedModules = fileData.reviewedModules;
                this._reviewedErrors = fileData.reviewedErrors;
                log_1.Log.message(`Read review file from ${combinedFilePath}`);
            }
            catch (err) {
                log_1.Log.error(`Error reading combined file ${combinedFilePath}. Error: ${err.toString()}`);
                return;
            }
        }
        else {
            // Log.warning(`Combined JSON file was not found at: ${combinedFilePath}`);
            this._reviewedErrors = new Array();
            this._reviewedModules = new Array();
        }
    }
    checkReviewedStatus(moduleName) {
        return this._reviewedModules.includes(moduleName);
    }
    reviewComplete(moduleName, errorList, userCollection, overrideErrors) {
        // Make sure we init'd first
        if (this._reviewedErrors == null || this._reviewedModules == null) {
            log_1.Log.error(`Unable to complete review, ReviewManager init call incomplete.`);
            return ReviewCompleteStatus.NotInitialized;
        }
        // Are there errors in this module which dont have a lead resolution?
        let unresolvedCount = 0;
        for (let error of errorList) {
            if (error.leadDisposition == commentObjects_1.LeadDispositions.None) {
                ++unresolvedCount;
            }
        }
        if (unresolvedCount > 0) {
            // Was this overriden? IF so, ignore
            return ReviewCompleteStatus.AllErrorsNotDispositioned;
        }
        // If we haven't reviewed this module before, add it to the list
        if (!this._reviewedModules.includes(moduleName)) {
            this._reviewedModules.push(moduleName);
        }
        // Have we reviewed any of these errors before? If so, delete the previous result
        for (let error of errorList) {
            // Find the existing index
            let foundIndex = null;
            for (let existingError of this._reviewedErrors) {
                if (existingError.hash == error.hash) {
                    foundIndex = this._reviewedErrors.indexOf(existingError);
                    break;
                }
            }
            // If we found this error, remove it from the collection
            if (foundIndex != null) {
                this._reviewedErrors.splice(foundIndex, 1);
            }
        }
        // Add in these errors & module to the combined list
        this._reviewedErrors = this._reviewedErrors.concat(errorList);
        // Write out an updated error collection with these newly reviewed errors
        this._writeCombinedFile();
        // Send out the Email
        this._sendNotificationEmail(moduleName, errorList, userCollection);
        // Done
        return ReviewCompleteStatus.Ok;
    }
    _writeCombinedFile() {
        if (this._outputPath == null) {
            log_1.Log.error(`Unable to write ${this._filename}. Scrub Directory is missing.`);
            return;
        }
        let fileData = { reviewedModules: this._reviewedModules, reviewedErrors: this._reviewedErrors };
        let filePath = path.join(this._outputPath, this._filename);
        try {
            fs.writeFileSync(filePath, JSON.stringify(fileData, undefined, 4));
        }
        catch (e) {
            log_1.Log.error(`Error writing reviewed file to ${filePath}. Error: ${e}`);
        }
        // Reinforce the file permissions so that all can read & write
        try {
            const fd = fs.openSync(filePath, "r");
            fs.fchmodSync(fd, 0o666);
            fs.closeSync(fd);
        }
        catch (e) {
            // This is at Debug level because only the file owner will be able to 
            // set the permissions, so most folks will hit this
            log_1.Log.debug(`Error setting reviewed file permissions ${filePath}. Error: ${e}`);
        }
    }
    _sendNotificationEmail(moduleName, errorList, userCollection) {
        // Collect Receipients
        let reviewParticipantEmails = new Array();
        let reviewParticipantNames = new Array();
        for (let error of errorList) {
            for (let comment of error.comments) {
                // If the user is "scrubview" dont try to send an email...
                if (comment.user == "scrubview")
                    continue;
                // Construct the email
                // If this users has registered (and they shoudl have!) use the
                // email they registered with. If they didnt register, just use
                // the kludge email of <username>@jpl.nasa.gov
                let user = userCollection.getUser(comment.user);
                let emailAddress;
                let usersName;
                if (user == null) {
                    emailAddress = `${comment.user}@jpl.nasa.gov`;
                    usersName = comment.user;
                }
                else {
                    emailAddress = user.emailAddress;
                    usersName = user.displayName;
                }
                if (!reviewParticipantEmails.includes(emailAddress)) {
                    reviewParticipantEmails.push(emailAddress);
                    reviewParticipantNames.push(usersName);
                }
            }
        }
        // Get a Timestamp STring
        let timestampString;
        try {
            timestampString = new Date().toLocaleString();
        }
        catch (_a) {
            timestampString = "";
        }
        // Construct the email body
        let emailBody = `<html><head></head><body>`;
        emailBody += `<p>Review of the <span style='font-weight: bold;'>${moduleName}</span> module was completed on <span style='font-weight: bold;'>${timestampString}</span> using build <span style='font-weight: bold;'>${this._build.name}</span></p>\n`;
        // Reivew Participants
        emailBody += "<p>The following users participated in this review:</p>";
        emailBody += "<ul>\n";
        for (let participant of reviewParticipantNames) {
            emailBody += `<li>${participant}</li>`;
        }
        emailBody += "</ul>\n";
        // Errors
        emailBody += `<p>The ${errorList.length} static analysis findings for this module have been dispositioned as follows:</p>`;
        emailBody += this.outputErrorList(errorList);
        // Finish UP
        emailBody += "</body>";
        // Send the Email
        const sendmail = require('sendmail')();
        // Send the Email
        log_1.Log.message(`Sending emails to: ${reviewParticipantEmails.join()}`);
        sendmail({
            from: 'scrub@jpl.nasa.gov',
            to: reviewParticipantEmails.join(),
            bcc: "ian.a.trettel@jpl.nasa.gov",
            subject: `[Scrub] Review Report for ${moduleName} Module`,
            html: emailBody,
        });
    }
    outputErrorList(errorList) {
        let tableStyle = "border: 1px solid; text-align: center; border-collapse: collapse; font-size: 12px;";
        let thStyle = "padding: 10px 5px 10px 5px; border-bottom: 1px solid; background: #D3D3D3;";
        let tdStyle = "padding: 10px 5px 10px 5px; border-bottom: 1px solid;";
        // Output Table Header
        let tableHTML = `<table style='${tableStyle}'>
            <tr>
                <th style='${thStyle}'>#</th>
                <th style='${thStyle}'>Error ID</th>
                <th style='${thStyle}'>Error</th>
                <th style='${thStyle}'>File</th>
                <th style='${thStyle}'>Line</th>
                <th style='${thStyle}'>Lead Disposition</th>
                <th style='${thStyle}'>Comments</th>
            </tr>
        `;
        // Sort the Error List, we want the CODE FIX REQUEST items to appear 
        // first in the table
        errorList.sort((a, b) => a.leadDisposition - b.leadDisposition);
        // Output the list, filtering by the desired disposition
        let errorIndex = 1;
        for (let error of errorList) {
            tableHTML += this.formatError(errorIndex, error, tdStyle);
            ++errorIndex;
        }
        // End the Table
        tableHTML += "</table>";
        return tableHTML;
    }
    formatError(index, error, tdStyle) {
        // Format the Disposition Text to replace '_' with ' '
        let re = /_/gi;
        let dispositionText = commentObjects_1.LeadDispositions[error.leadDisposition].toUpperCase().replace(re, " ");
        // Setup the Disposition TD Style
        let dispositionStyle = tdStyle;
        if (error.leadDisposition == commentObjects_1.LeadDispositions.No_Action) {
            dispositionStyle += "font-weight: bold; background: rgba(186, 255, 201, 1.0); color: black;";
        }
        else {
            dispositionStyle += "font-weight: bold; background: rgba(255, 255, 186, 1.0); color: black;";
        }
        // Collect the Comments
        let commentText = "";
        for (let comment of error.comments) {
            if (comment.message != "") {
                commentText += `<p style="font-weight: bold; margin: 0; padding-bottom: 2px;">${comment.user}:</p><p>${comment.toHTML()}</p>`;
            }
        }
        if (error instanceof codeError_1.CodeError) {
            return `<tr>
                <td style='${tdStyle}'>${index}</td>
                <td style='${tdStyle}'>${error.id}</td>
                <td style='${tdStyle}'>${error.formatErrorTypeForScreen()}</td>
                <td style='${tdStyle}'>${error.fileName}</td>
                <td style='${tdStyle}'>${error.lineNumber}</td>
                <td style='${dispositionStyle}'>${dispositionText}</td>
                <td style='${tdStyle}'>${commentText}</td>
            </tr>`;
        }
        else /* Code Comment */ {
            return `<tr>
            <td style='${tdStyle}'>${index}</td>
            <td style='${tdStyle}'>${error.id}</td>
            <td style='${tdStyle}'>${error.username}: ${error.message}</td>
            <td style='${tdStyle}'>${error.fileName}</td>
            <td style='${tdStyle}'>${error.lineNumber}</td>
            <td style='${dispositionStyle}'>${dispositionText}</td>
            <td style='${tdStyle}'>${commentText}</td>
        </tr>`;
        }
    }
}
exports.ReviewManager = ReviewManager;
//# sourceMappingURL=reviewManager.js.map