"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadDispositionComment = exports.DevDispositionComment = exports.TextComment = exports.AbstractComment = exports.LeadDispositions = exports.DeveloperDispositions = void 0;
const log_1 = require("./utils/log");
var DeveloperDispositions;
(function (DeveloperDispositions) {
    DeveloperDispositions[DeveloperDispositions["None"] = 0] = "None";
    DeveloperDispositions[DeveloperDispositions["Agree"] = 1] = "Agree";
    DeveloperDispositions[DeveloperDispositions["Disagree"] = 2] = "Disagree";
    DeveloperDispositions[DeveloperDispositions["Discuss"] = 3] = "Discuss";
})(DeveloperDispositions = exports.DeveloperDispositions || (exports.DeveloperDispositions = {}));
var LeadDispositions;
(function (LeadDispositions) {
    LeadDispositions[LeadDispositions["None"] = 0] = "None";
    LeadDispositions[LeadDispositions["Code_Fix_Requested"] = 1] = "Code_Fix_Requested";
    LeadDispositions[LeadDispositions["No_Action"] = 2] = "No_Action";
})(LeadDispositions = exports.LeadDispositions || (exports.LeadDispositions = {}));
class AbstractComment {
    constructor(message, timestamp, user, useMarkdown) {
        // Set the Message
        if (message == undefined) {
            message = "";
        }
        this.message = message;
        // Set the Timestamp
        if (timestamp == undefined) {
            this.timestamp = new Date();
        }
        else {
            this.timestamp = new Date(timestamp);
        }
        // Set the user
        if (user == undefined) {
            user = require("os").userInfo().username;
            if (user == undefined) {
                user = "unknown";
            }
        }
        this.user = user;
        // Set the use Markdown flag
        if (useMarkdown == undefined) {
            this.useMarkdown = false;
        }
        else {
            this.useMarkdown = useMarkdown;
        }
    }
    static fromJSON(version, data) {
        let message = data.message;
        let user = data.user;
        let timestamp = data.timestamp;
        let useMarkdown = false;
        if (version == "2.0") {
            useMarkdown = data.markdown;
        }
        // Create the Comment Objects
        if (data.type == "TextComment") {
            return new TextComment(message, user, useMarkdown, timestamp);
        }
        else if (data.type == "DeveloperDisposition") {
            return new DevDispositionComment(data.disposition, message, user, useMarkdown, timestamp);
        }
        else if (data.type == "LeadDisposition") {
            return new LeadDispositionComment(data.disposition, message, user, useMarkdown, timestamp);
        }
        // If we get here, its an error
        log_1.Log.error(`Unreachable State. Build Parser. Unknown Comment Type: ${data.type}`);
        return null;
    }
    toHTML() {
        let html;
        if (this.useMarkdown) {
            // Format message w/ markdown
            let showdown = require('showdown');
            let converter = new showdown.Converter();
            html = converter.makeHtml(this.message);
        }
        else {
            html = `<p>${this.message}</p>`;
        }
        // Test for any error identifiers, which we will format
        let test = /((?:(?:COV)|(?:CS))[0-9]{6})/;
        html = html.replace(test, `<a class='badge badge-secondary' href='#' onclick='view.routeEvent("onErrorIdClicked", \"$1\")'>$1</a>`);
        // Test for any file:line numbers
        // let fileLineTest = /(([a-z]+_\w+.[ch]):(\d+))/;
        // html = html.replace(fileLineTest, `<a href="#" onclick='view.routeEvent("onCodeAnchorClicked", \"$2\", \"$3\")>$1</a>`);
        // Done
        return html;
    }
}
exports.AbstractComment = AbstractComment;
class TextComment extends AbstractComment {
    constructor(message, user, useMarkdown, timestamp) {
        super(message, timestamp, user, useMarkdown);
    }
    toJSON() {
        return { type: "TextComment", user: this.user, timestamp: this.timestamp, message: this.message, markdown: this.useMarkdown };
    }
}
exports.TextComment = TextComment;
class DevDispositionComment extends AbstractComment {
    constructor(disposition, message, user, useMarkdown, timestamp) {
        super(message, timestamp, user, useMarkdown);
        this.disposition = disposition;
    }
    toJSON() {
        return { type: "DeveloperDisposition", user: this.user, timestamp: this.timestamp, disposition: this.disposition, message: this.message, markdown: this.useMarkdown };
    }
}
exports.DevDispositionComment = DevDispositionComment;
class LeadDispositionComment extends AbstractComment {
    constructor(disposition, message, user, useMarkdown, timestamp) {
        super(message, timestamp, user, useMarkdown);
        this.disposition = disposition;
    }
    toJSON() {
        return { type: "LeadDisposition", user: this.user, timestamp: this.timestamp, disposition: this.disposition, message: this.message, markdown: this.useMarkdown };
    }
}
exports.LeadDispositionComment = LeadDispositionComment;
//# sourceMappingURL=commentObjects.js.map