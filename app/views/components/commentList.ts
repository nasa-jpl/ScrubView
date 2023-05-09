import { AbstractParentComponent } from "./abstractComponent";
import { StateManager } from "../stateManager";
import { CommentTile } from "./commentTile";


export class CommentList extends AbstractParentComponent
{
    constructor(state : StateManager)
    {
        super(state, "CommentList", "comment-list-children");

        // Subscribe to onModuleChanged
        this.eventSubscribe('onModuleChanged', () => {
            this._clearList();
        });

        // Change the list when the error changes
        this.eventSubscribe("onErrorChanged", () => {
            this._clearList();
            this._loadComments();
        });

        this.eventSubscribe("onCommentAdded", () => {
            this._clearList();
            this._loadComments();
        });

        this.eventSubscribe("onErrorIdClicked", (errorId) => {

            if(this._state.selectedBuild == undefined)
                return;

            // Attempt to Find the Error
            let reviewItem = this._state.selectedBuild.errors.getReviewItemById(errorId);

            if(reviewItem != undefined)
                // Is this error in the same module?
                if(reviewItem.moduleName == this._state.selectedModule)
                    this._state.setSelectedError(reviewItem);
        });
    } 

    public render()
    {

        // Clear & Load Template
        this.loadTemplateToParent();

    }

    private _clearList()
    {
        this.clearChildren();
    }

    private _loadComments()
    {
        if(this._state.selectedError == null || this.listElement == null) {
            return;
        }

        if(this._state.selectedError.comments.length <= 0)
        {
            this.listElement.append('<li style="color: #666; border:none;user-select: none;">No Comments Yet</li>');
        }
        else 
        {
            // Sort the List
            let comments = this._state.selectedError.comments.sort((a,b)=> a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0);

            // Add Child Components for the comments
            for(let comment of comments)
            {
                this.addChildComponent(new CommentTile(this._state, comment));
            }
        }
    }
}