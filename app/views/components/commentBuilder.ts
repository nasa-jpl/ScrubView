import { AbstractComponent } from "./abstractComponent";
import { StateManager, DisplayMode } from "../stateManager"
import * as comments from "../../types/commentObjects"


export class CommentBuilder extends AbstractComponent
{
    private devDispositionButton : JQuery;
    private leadDispositionButton : JQuery;
    private commentTextBox : JQuery;

    constructor(state : StateManager)
    {
        super(state, "CommentBuilder");

        // Get the References
        this.devDispositionButton =  $("#btn-disposition-developer");
        this.leadDispositionButton =  $("#btn-disposition-lead");
        this.commentTextBox = $("#comment-text");

        // Developer Disposition Changed
        this.eventSubscribe("onDeveloperDispositionChanged", (newDisposition) => {
            this._developerDispositionChanged(newDisposition);
        });

        // Lead Disposition Changed
        this.eventSubscribe("onLeadDispositionChanged", (newDisposition) => {
            this._leadDispositionChanged(newDisposition);
        });

        // Comment Canceled
        this.eventSubscribe("onCommentCanceled", () => {
            this._clearInputs();
        });

        // Comment Added
        this.eventSubscribe("onCommentCreated", () => {
            this.buildComment();
        });

        // Error Changed
        this.eventSubscribe("onErrorChanged", () => {
            this._updateEnabled();
            this._clearInputs();
        })

        // Display Mode Changed
        this.eventSubscribe("onDisplayModeChanged", () => {
            this._updateEnabled();
            this._clearInputs();
        })
    }

    private _updateEnabled()
    {
        // Show Only One of the Disposition Drop downs based on mode
        if(this._state.displayMode == DisplayMode.Disposition){
            $("#row-dev-disposition").removeClass("hidden");
            $("#row-lead-disposition").addClass("hidden");
        } else {
           $("#row-dev-disposition").addClass("hidden");
           $("#row-lead-disposition").removeClass("hidden");
        }

        // If there's no selected build or module, no input is allowed
        if(this._state.selectedBuild == null || this._state.selectedModule == null) {
            this.setEnabled(false);
            return;
        }

        // Input is enabled when:
        // 1. There is a selected error
        // 2. The selected module does not have a previously completed review
        let errorSelected = this._state.selectedError != null;
        
        // To preserve flexibility here, we're not checking if there's a previous
        // review. 
        this.setEnabled(errorSelected);
    }

    public render()
    {
         // Clear & Load Template
         this.loadTemplateToParent();

         // Update Enabled
         this._updateEnabled();
         

        //  // Show Only One of the Disposition Drop downs based on mode
        //  if(this._state.displayMode == DisplayMode.Disposition){
        //      $("#row-dev-disposition").removeClass("hidden");
        //      $("#row-lead-disposition").addClass("hidden");
        //  } else {
        //     $("#row-dev-disposition").addClass("hidden");
        //     $("#row-lead-disposition").removeClass("hidden");
        //  }

        //  // If there's no selected build or module, no input is allowed
        //  if(this._state.selectedBuild == null || this._state.selectedModule == null) {
        //      this.setEnabled(false);
        //      return;
        //  }

        //  // Input is enabled when:
        //  // 1. There is a selected error
        //  // 2. The selected module does not have a previously completed review
        //  let errorSelected = this._state.selectedError != null;
        //  let hasPreviousReview = this._state.selectedBuild.reviewManager.checkReviewedStatus(this._state.selectedModule);

        //  this.setEnabled(errorSelected && !hasPreviousReview);
         
    }

    private setEnabled(inputEnabled : boolean)
    {
        if(inputEnabled) 
        {
           $("#btn-disposition-developer").removeClass("disabled");
           $("#btn-disposition-lead").removeClass("disabled");
        }
        else
        {
           $("#btn-disposition-developer").addClass("disabled");
           $("#btn-disposition-lead").addClass("disabled");
        }

        $("#comment-text").prop("disabled", !inputEnabled);
        $("#btn-comment-text-add").prop("disabled", !inputEnabled);
        $("#btn-comment-text-cancel").prop("disabled", !inputEnabled);
        $("#comment-use-markdown").prop("disabled", !inputEnabled);
    }

    private buildComment()
    {
        // If no error is selected, do nothing 
        if(this._state.selectedError == null || this._state.configuration == null) {
            return;
        }

        // Grab the comment field text
        let commentAdded = false;
        let dispositionAdded = false;
        let commentText = <string>this.commentTextBox.val();

        // Use markdown?
        let useMarkdown = $("#comment-use-markdown").is(":checked");

        // In Disposition Mode we can only add text comments or dev disposition
        // comments. In Review mode, we can add text comments and lead disposition
        // comments.
        if(this._state.displayMode == DisplayMode.Disposition)
        {
            // If the disposition dropdown is 'None' this is a text comment
            if(this.devDispositionButton.text() == "None")
            {
                // Dont Add Empty Comments
                if(commentText != "" && commentText != undefined )
                {
                    let newComment = new comments.TextComment(commentText, this._state.configuration.currentUser, useMarkdown);
                    this._state.selectedError.addComment(newComment);
                    commentAdded = true;
                }
            }
            else
            {
                // Otherwise, this is a new dev disposition (which may also have a 
                // text comment)
                let disposition;
                switch($("#btn-disposition-developer").text())
                {
                    case "Agree": disposition = comments.DeveloperDispositions.Agree; break;
                    case "Disagree": disposition = comments.DeveloperDispositions.Disagree; break;
                    case "Discuss": disposition = comments.DeveloperDispositions.Discuss; break;
                    default: disposition = comments.DeveloperDispositions.None; break;
                }

                let newComment = new comments.DevDispositionComment(disposition, commentText, this._state.configuration.currentUser, useMarkdown);
                this._state.selectedError.addComment(newComment);
                commentAdded = true;
                dispositionAdded = true;
            }
        }
        else // Review Mode
        {
            // If the disposition dropdown is 'None' this is a text comment
            if($("#btn-disposition-lead").text() == "None")
            {
                // Dont Add Empty Comments
                if(commentText != "" ){
                    let newComment = new comments.TextComment(commentText, this._state.configuration.currentUser, useMarkdown);
                    this._state.selectedError.addComment(newComment);
                    commentAdded = true;
                }
            }
            else
            {
                // Otherwise, this is a new lead disposition (which may also have a 
                // text comment)
                let disposition;
                switch($("#btn-disposition-lead").text())
                {
                    case "No Action": disposition = comments.LeadDispositions.No_Action; break;
                    case "Code Fix Requested": disposition = comments.LeadDispositions.Code_Fix_Requested; break;
                    default: disposition = comments.LeadDispositions.None; break;
                }

                let newComment = new comments.LeadDispositionComment(disposition, commentText, this._state.configuration.currentUser, useMarkdown);
                this._state.selectedError.addComment(newComment);
                commentAdded = true;
                dispositionAdded = true;
            }
        }

        // Clear the Form
        this._clearInputs();
       
        // Emit the Event
        if(commentAdded) {
            this._state.emit("onCommentAdded");
        }

        if(dispositionAdded) {
            this._state.emit("onDispositionAdded");
        }
    }

    private _clearInputs()
    {
        this.commentTextBox.val("");
        this._developerDispositionChanged(comments.DeveloperDispositions.None);
        this._leadDispositionChanged(comments.LeadDispositions.None);
    }

    private _developerDispositionChanged(newDisposition : comments.DeveloperDispositions)
    {
        // Remove Previous Classes
        this.devDispositionButton.removeClass("none");
        this.devDispositionButton.removeClass("agree");
        this.devDispositionButton.removeClass("disagree");
        this.devDispositionButton.removeClass("discuss");

        switch(newDisposition)
        {
            case comments.DeveloperDispositions.None:
                this.devDispositionButton.addClass("none");
                this.devDispositionButton.text("None");
                break;

            case comments.DeveloperDispositions.Agree:
                this.devDispositionButton.addClass("agree");
                this.devDispositionButton.text("Agree");
                break;

            case comments.DeveloperDispositions.Disagree:
                this.devDispositionButton.addClass("disagree");
                this.devDispositionButton.text("Disagree");
                break;

            case comments.DeveloperDispositions.Discuss:
                this.devDispositionButton.addClass("discuss");
                this.devDispositionButton.text("Discuss");
                break;
        }
    }

    private _leadDispositionChanged(newDisposition : comments.LeadDispositions)
    {
        // Remove Previous Classes
        this.leadDispositionButton.removeClass("none");
        this.leadDispositionButton.removeClass("noaction");
        this.leadDispositionButton.removeClass("fixcode");

        // Add new
        switch(newDisposition)
        {
            case comments.LeadDispositions.None:
                this.leadDispositionButton.addClass("none");
                this.leadDispositionButton.text("None");
                break;

            case comments.LeadDispositions.No_Action:
                this.leadDispositionButton.addClass("noaction");
                this.leadDispositionButton.text("No Action");
                break;

            case comments.LeadDispositions.Code_Fix_Requested:
                this.leadDispositionButton.addClass("fixcode");
                this.leadDispositionButton.text("Code Fix Requested");
                break;
        
        }
    }
}