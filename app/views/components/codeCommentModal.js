"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeCommentModal = void 0;
const abstractComponent_1 = require("./abstractComponent");
const codeComment_1 = require("../../types/codeComment");
const fileLocation_1 = require("../../types/utils/fileLocation");
class CodeCommentModal extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "CodeCommentModal");
        CodeCommentModal.singleton = this;
        this._currentFilename = null;
        this._currentLine = null;
        this.eventSubscribe("onCodeCommentCreated", () => {
            this.onCodeCommentCreated();
        });
    }
    render() {
        // Do Nothing, everything happens in show()
    }
    static show(filename, line) {
        // If the singleton hasn't been created, done. 
        if (CodeCommentModal.singleton == null) {
            return;
        }
        // No selected module -> abort
        if (CodeCommentModal.singleton._state.selectedModule == null) {
            return;
        }
        // Load the Template
        CodeCommentModal.singleton.loadTemplateToParent();
        // If the Filename is really a file path, truncate it
        if (filename.indexOf("/") >= 0) {
            let parts = filename.split("/");
            filename = parts[parts.length - 1];
        }
        // Set Temporary varaibles 
        CodeCommentModal.singleton._currentFilename = filename;
        CodeCommentModal.singleton._currentLine = line;
        // Add the File & Line
        $("#code-comment-modal-module").text(CodeCommentModal.singleton._state.selectedModule);
        $("#code-comment-modal-filename").text(filename);
        $("#code-comment-modal-line").text(line.toString());
        // Clear any text from a previous comment
        $("#code-comment-modal-message").val("");
        // Show the Modal
        let modal = $("#modal-code-comment");
        let options = { show: true, keyboard: false, backdrop: "static" };
        modal.modal(options);
    }
    onCodeCommentCreated() {
        if (this._state.configuration == null ||
            this._currentFilename == null ||
            this._currentLine == null ||
            this._state.selectedModule == null ||
            this._state.selectedBuild == null) {
            return;
        }
        // COnstruct the File Location for this comment
        let fileLocation = fileLocation_1.FileLocation.fromModuleRelativeFile(this._currentFilename, this._currentLine, this._state.selectedBuild.codePath);
        // Construct the new Comment
        let username = this._state.configuration.currentUser;
        let commentId = this._state.selectedBuild.errors.getNextCommentIdForUser(username);
        let message = $("#code-comment-modal-message").val();
        let newCodeComment = new codeComment_1.CodeComment(commentId, username, message, fileLocation);
        // Add the new code comment to the build. 
        this._state.selectedBuild.errors.addCodeComment(newCodeComment);
        // Emit the event to notify listeners
        this._state.emit("onCodeCommentAdded");
    }
}
exports.CodeCommentModal = CodeCommentModal;
//# sourceMappingURL=codeCommentModal.js.map