import { AbstractComponent } from "./abstractComponent";
import { StateManager } from "../stateManager";
import { User } from "../../types/userCollection";
import { CodeComment } from "../../types/codeComment";
import { FileLocation } from "../../types/utils/fileLocation";


export class CodeCommentModal extends AbstractComponent
{
    private static singleton : CodeCommentModal;
    private _currentFilename : string | null;
    private _currentLine : number | null;

    constructor(state : StateManager)
    {
        super(state, "CodeCommentModal");
        CodeCommentModal.singleton = this;
        this._currentFilename = null;
        this._currentLine = null;

        this.eventSubscribe("onCodeCommentCreated", () => {
            this.onCodeCommentCreated();
        });
    }

    public render()
    {
        // Do Nothing, everything happens in show()
    }

    public static show(filename: string, line: number)
    {
        // If the singleton hasn't been created, done. 
        if(CodeCommentModal.singleton == null) {
            return;
        }

        // No selected module -> abort
        if(CodeCommentModal.singleton._state.selectedModule == null) {
            return;
        }

         // Load the Template
         CodeCommentModal.singleton.loadTemplateToParent();

         // If the Filename is really a file path, truncate it
         if(filename.indexOf("/") >= 0)
         {
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
         let modal : any = $("#modal-code-comment");
         let options = {show:true, keyboard:false, backdrop:"static"}
         modal.modal(options);
    }

    private onCodeCommentCreated()
    {
        if(this._state.configuration == null || 
           this._currentFilename == null || 
           this._currentLine == null ||
           this._state.selectedModule == null ||
           this._state.selectedBuild == null) {
            return;
        }

        // COnstruct the File Location for this comment
        let fileLocation = FileLocation.fromModuleRelativeFile(this._currentFilename, this._currentLine, this._state.selectedBuild.codePath);

        // Construct the new Comment
        let username = this._state.configuration.currentUser;
        let commentId = this._state.selectedBuild.errors.getNextCommentIdForUser(username);
        let message = <string>$("#code-comment-modal-message").val();
        let newCodeComment = new CodeComment(commentId, username, message, fileLocation);

        // Add the new code comment to the build. 
        this._state.selectedBuild.errors.addCodeComment(newCodeComment);

        // Emit the event to notify listeners
        this._state.emit("onCodeCommentAdded");
    }
}