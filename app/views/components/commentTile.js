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
exports.CommentTile = void 0;
const abstractComponent_1 = require("./abstractComponent");
const comments = __importStar(require("../../types/commentObjects"));
const common = __importStar(require("./common"));
class CommentTile extends abstractComponent_1.AbstractComponent {
    constructor(state, comment) {
        super(state, "CommentTile");
        this.comment = comment;
        // Create the display element name. This name will be used by the parent
        // when the component is added to the parent. 
        this._displayElementName = `comment-${comment.user}-${comment.timestamp.getMilliseconds()}`;
    }
    render() {
        if (this._displayElement == null || this.comment == undefined || this._state.users == null) {
            return;
        }
        // Get the User Name
        let userEntry = this._state.users.getUser(this.comment.user);
        let displayName;
        if (userEntry == null) {
            displayName = this.comment.user;
        }
        else {
            displayName = userEntry.displayName;
        }
        // Convert the timestamp to a string
        let timestampString;
        try {
            timestampString = this.comment.timestamp.toLocaleString();
        }
        catch (_a) {
            timestampString = "";
        }
        // Add the Basic
        let output = `<li>
                       <span class="comment-time">${timestampString} </span>
                       <span class="comment-user">${displayName}</span> `;
        // If this is a disposition comment, we need to add that here
        if (this.comment instanceof comments.DevDispositionComment) {
            // Add the Developer Disposition Badge
            let dispoText = comments.DeveloperDispositions[this.comment.disposition].replace(new RegExp("_", 'g'), " ");
            let spanClass = common.getDevDispositionBadge(this.comment.disposition);
            output += `<span class='badge ${spanClass}'>${dispoText}</span><br/>`;
        }
        else if (this.comment instanceof comments.LeadDispositionComment) {
            // Add the Lead Disposition Badge
            let dispoText = comments.LeadDispositions[this.comment.disposition].replace(new RegExp("_", 'g'), " ");
            let spanClass = common.getLeadDispositionBadge(this.comment.disposition);
            output += `<span class='badge ${spanClass}'>${dispoText}</span><br/>`;
        }
        // Format the Comment
        output += this.comment.toHTML();
        // Finish
        output += "</li>";
        // Add to the parent
        this._displayElement.empty();
        this._displayElement.append(output);
    }
}
exports.CommentTile = CommentTile;
//# sourceMappingURL=commentTile.js.map