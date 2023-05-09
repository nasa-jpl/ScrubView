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
exports.AbstractReviewItem = void 0;
const comments = __importStar(require("./commentObjects"));
class AbstractReviewItem {
    constructor(id, fileLocation) {
        this._comments = new Array();
        this._id = id;
        this._fileLocation = fileLocation;
        this._parentCollection = null;
        // Set Hash to an Initial Value.
        // NOTE: These MUST be overridden in child classes, but since super()
        // has to be first in the child constructors, we'll do this. 
        this._hash = "";
    }
    get comments() { return this._comments; }
    get id() { return this._id; }
    get hash() { return this._hash; }
    get moduleName() { return this._fileLocation.moduleName; }
    get fileName() { return this._fileLocation.fileName; }
    get fileLocation() { return this._fileLocation; }
    get lineNumber() { return this._fileLocation.lineNumber; }
    // Accessors
    get devDisposition() {
        let latestComment = this._getLatestCommentOfType("DevDispositionComment");
        if (latestComment != null) {
            return latestComment.disposition;
        }
        else {
            return comments.DeveloperDispositions.None;
        }
    }
    get leadDisposition() {
        let latestComment = this._getLatestCommentOfType("LeadDispositionComment");
        if (latestComment != null) {
            return latestComment.disposition;
        }
        else {
            return comments.LeadDispositions.None;
        }
    }
    get leadDispositionComment() {
        return this._getLatestCommentOfType("LeadDispositionComment");
    }
    get devDispositionComment() {
        return this._getLatestCommentOfType("DevDispositionComment");
    }
    get hasDeveloperDisposition() {
        return this.devDisposition != comments.DeveloperDispositions.None;
    }
    get hasLeadDisposition() {
        return this.leadDisposition != comments.LeadDispositions.None;
    }
    addComment(newComment) {
        this._comments.push(newComment);
        // Notify the parent collection of the new comment so the user's comment
        // file can be written out. 
        if (this._parentCollection != null) {
            this._parentCollection.onCommentAdded(newComment.user);
        }
    }
    _getLatestCommentOfType(type) {
        let latestComment = null;
        let i;
        for (i = 0; i < this.comments.length; ++i) {
            if (this.comments[i].constructor.name == type) {
                if (latestComment == null) {
                    latestComment = this.comments[i];
                }
                else if (latestComment.timestamp < this.comments[i].timestamp) {
                    latestComment = this.comments[i];
                }
            }
        }
        return latestComment;
    }
    setParentCollection(parentCollection) {
        this._parentCollection = parentCollection;
    }
}
exports.AbstractReviewItem = AbstractReviewItem;
//# sourceMappingURL=abstractReviewItem.js.map