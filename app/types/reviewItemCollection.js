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
exports.ReviewItemCollection = void 0;
const log_1 = require("./utils/log");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const codeComment_1 = require("./codeComment");
class ReviewItemCollection {
    constructor(scrubDirPath) {
        this._valid = false;
        this._reviewItems = new Map();
        this._idToHash = new Map();
        this._moduleToHash = new Map();
        this._scrubDirPath = scrubDirPath;
        this._initComplete = false;
    }
    // Accessors
    get valid() { return this._valid; }
    get length() { return this._reviewItems.size; }
    addCodeError(newError) {
        this._addReviewItem(newError);
    }
    addCodeComment(newCodeComment) {
        this._addReviewItem(newCodeComment);
        // Write this comment out to the user's file
        if (this._initComplete) {
            this._writeUserCommentFile(newCodeComment.username);
        }
    }
    _addReviewItem(newReviewItem) {
        // Set the parent collection to be this object (for comment added callbacks)
        newReviewItem.setParentCollection(this);
        // Update the internal lists
        this._reviewItems.set(newReviewItem.hash, newReviewItem);
        this._idToHash.set(newReviewItem.id, newReviewItem.hash);
    }
    getReviewItemById(id) {
        let itemHash = this._idToHash.get(id);
        if (itemHash == undefined)
            return undefined;
        return this._reviewItems.get(itemHash);
    }
    getReviewItem(hash) {
        return this._reviewItems.get(hash);
    }
    getModuleReviewItemList(moduleName) {
        let returnList = new Array();
        for (const error of this._reviewItems.values()) {
            if (error.moduleName == moduleName) {
                returnList.push(error);
            }
        }
        return returnList;
    }
    getFolderReviewItemList(folderPath) {
        let returnList = new Array();
        for (const error of this._reviewItems.values()) {
            if (path.join(error.fileLocation.sourceRoot, error.fileLocation.filePath).startsWith(folderPath)) {
                returnList.push(error);
            }
        }
        return returnList;
    }
    getFileReviewItemList(filePath) {
        let returnList = new Array();
        for (const error of this._reviewItems.values()) {
            if (filePath.endsWith(error.fileLocation.filePath)) {
                returnList.push(error);
            }
        }
        return returnList;
    }
    /**
     * Notifies the collection that initial loading of errors & comments is
     * complete. Further changes to the collection should be written to
     * files as appropriate.
     */
    setInitComplete() {
        this._initComplete = true;
    }
    /**
     * Event called by CodeError objects to notify the collection that a change
     * has been made.
     * @param username Username which made the change
     */
    onCommentAdded(username) {
        if (this._initComplete) {
            this._writeUserCommentFile(username);
        }
    }
    getNextCommentIdForUser(username) {
        //TODO: Concerns - concurrence. Two users requesting at the same time...
        return "";
    }
    /**
     * Writes out a users comment file.
     * @param username Username to write the file for.
     */
    _writeUserCommentFile(username) {
        let jsonContents = { fileVersion: "2.0", user: username, errors: Array(), codeComments: Array() };
        // For each review item, check to see if this user has made comments. 
        for (let reviewItem of this._reviewItems.values()) {
            let reviewItemEntry = { id: reviewItem.id, hash: reviewItem.hash, comments: Array() };
            for (let comment of reviewItem.comments) {
                if (comment.user == username) {
                    reviewItemEntry.comments.push(comment.toJSON());
                }
            }
            // If this user had comments for this review item, add those comments
            // to the output array
            if (reviewItemEntry.comments.length > 0) {
                jsonContents.errors.push(reviewItemEntry);
            }
            // If this reviewItem is a CodeComment, we need to write that out to
            // the file as well. 
            if (reviewItem instanceof codeComment_1.CodeComment) {
                jsonContents.codeComments.push(reviewItem.toJSON());
            }
        }
        // Write the file
        let filename = `comments_${username}.json`;
        let filePath = path.join(this._scrubDirPath, filename);
        try {
            fs.writeFileSync(filePath, JSON.stringify(jsonContents, undefined, 4));
            // Modify File Permissions so that everyone can read, but only the
            // owner can write
            const fd = fs.openSync(filePath, "r");
            fs.fchmodSync(fd, 0o644);
            fs.closeSync(fd);
            log_1.Log.message(`Wrote user comments file to ${filePath}.`);
        }
        catch (e) {
            log_1.Log.error(`Error writing user comments file to ${filePath}. Error: ${e}`); //TODO: This needs to be way more visible. LIke a popup or something. 
        }
    }
}
exports.ReviewItemCollection = ReviewItemCollection;
//# sourceMappingURL=reviewItemCollection.js.map