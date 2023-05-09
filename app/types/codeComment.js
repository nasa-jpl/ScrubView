"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeComment = void 0;
const ts_md5_1 = require("ts-md5");
const abstractReviewItem_1 = require("./abstractReviewItem");
const fileLocation_1 = require("./utils/fileLocation");
/**
 * CodeComment Object
 * The CodeComment Object encapsulates a user generate comment on an arbitrary
 * line of code. It is stored in the same file as the rest of the user comments
 * but isn't attached to a CodeError object, rather it is assocaited with a
 * module and line of code.
 */
class CodeComment extends abstractReviewItem_1.AbstractReviewItem {
    constructor(commentId, username, message, fileLocation, timestamp, hash) {
        super(commentId, fileLocation);
        this._username = username;
        this._message = message;
        // If specified, set the timestamp
        if (timestamp != undefined) {
            this._timestamp = new Date(timestamp);
        }
        else {
            this._timestamp = new Date();
        }
        // If specified, set the hash, otherwise calcualte
        if (hash != undefined) {
            this._hash = hash;
        }
        else {
            this._hash = ts_md5_1.Md5.hashAsciiStr(`${this._username}${this._timestamp.toString()}${this._message}`);
        }
    }
    get username() { return this._username; }
    get timestamp() { return this._timestamp; }
    get message() { return this._message; }
    toJSON() {
        // NOTE: purposely excluding dev & lead dispositions here. They will be
        //       captured from the user comments which are restored into this 
        //       during init. 
        return {
            id: this.id,
            hash: this.hash,
            moduleName: this.moduleName,
            file: this.fileName,
            line: this.lineNumber,
            username: this.username,
            message: this.message,
            timestamp: this.timestamp.toString()
        };
    }
    static fromJSON(jsonObject, index, buildPath) {
        // If a comment doesnt yet have an ID associated with it (since this was
        // added late). Add one, otherwise just use the existing ID. 
        let commentId;
        if (jsonObject.id != undefined) {
            // Because JPL usernames are of the format <first initial><last name> we can
            // just grab the first two characters of the username and then capatilze.
            commentId = jsonObject.username.substr(0, 2).toUpperCase() + index.toString().padStart(6, "0");
        }
        else {
            commentId = jsonObject.id;
        }
        // Get the File Location
        let fileLocation = fileLocation_1.FileLocation.fromModuleRelativeFile(jsonObject.file, jsonObject.line, buildPath);
        // Return the new Comment Object
        return new CodeComment(commentId, jsonObject.username, jsonObject.message, fileLocation, jsonObject.timestamp, jsonObject.hash);
    }
}
exports.CodeComment = CodeComment;
//# sourceMappingURL=codeComment.js.map