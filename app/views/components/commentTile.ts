import { AbstractComponent } from "./abstractComponent";
import { StateManager } from "../stateManager";
import * as comments from "../../types/commentObjects";
import * as common from "./common"

export class CommentTile extends AbstractComponent
{
    private comment : comments.AbstractComment;
    
    
    constructor(state : StateManager, comment : comments.AbstractComment)
    {
        super(state, "CommentTile");
        this.comment = comment;

        // Create the display element name. This name will be used by the parent
        // when the component is added to the parent. 
        this._displayElementName = `comment-${comment.user}-${comment.timestamp.getMilliseconds()}`;
    }

    public render()
    {
        if(this._displayElement == null || this.comment == undefined || this._state.users == null) {
            return;
        }

        // Get the User Name
        let userEntry = this._state.users.getUser(this.comment.user);
        let displayName;
        if(userEntry == null) {
            displayName = this.comment.user;
        } else {
            displayName = userEntry.displayName;
        }

        // Convert the timestamp to a string
        let timestampString
        try{
            timestampString = this.comment.timestamp.toLocaleString();
        }
        catch {
            timestampString = "";
        }

        // Add the Basic
        let output =  `<li>
                       <span class="comment-time">${timestampString} </span>
                       <span class="comment-user">${displayName}</span> `;

        // If this is a disposition comment, we need to add that here
        if(this.comment instanceof comments.DevDispositionComment)
        {
            // Add the Developer Disposition Badge
            let dispoText = comments.DeveloperDispositions[this.comment.disposition].replace(new RegExp("_", 'g'), " ");
            let spanClass = common.getDevDispositionBadge(this.comment.disposition);
            output += `<span class='badge ${spanClass}'>${dispoText}</span><br/>`;
        }
        else if(this.comment instanceof comments.LeadDispositionComment)
        {
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