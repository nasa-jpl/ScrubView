import * as comments from "./commentObjects"
import { ReviewItemCollection } from "./reviewItemCollection";
import { FileLocation } from "./utils/fileLocation";

export abstract class AbstractReviewItem
{
    protected _id : string;
    protected _hash : string;
    protected _fileLocation : FileLocation;
    protected _comments : Array<comments.AbstractComment>;
    protected _parentCollection : ReviewItemCollection | null;

    get comments() { return this._comments; }
    get id() { return this._id; }
    get hash() { return this._hash; }
    get moduleName(): string { return this._fileLocation.moduleName; }
    get fileName(): string { return this._fileLocation.fileName; }
    get fileLocation() : FileLocation { return this._fileLocation; }
    get lineNumber() : number { return this._fileLocation.lineNumber; }

    constructor(id : string, fileLocation : FileLocation)
    {
        this._comments = new Array<comments.AbstractComment>();
        this._id = id;
        this._fileLocation = fileLocation;
        this._parentCollection = null;

        // Set Hash to an Initial Value.
        // NOTE: These MUST be overridden in child classes, but since super()
        // has to be first in the child constructors, we'll do this. 
        this._hash = "";
    }

    // Accessors
    get devDisposition() : comments.DeveloperDispositions 
    {
        let latestComment = this._getLatestCommentOfType("DevDispositionComment");

        if(latestComment != null)
        {
            return (<comments.DevDispositionComment>latestComment).disposition;
        }
        else
        {
            return comments.DeveloperDispositions.None;
        }
    }

    get leadDisposition() : comments.LeadDispositions 
    {
        let latestComment = this._getLatestCommentOfType("LeadDispositionComment");

        if(latestComment != null)
        {
            return (<comments.LeadDispositionComment>latestComment).disposition;
        }
        else
        {
            return comments.LeadDispositions.None;
        }
    }

    get leadDispositionComment() : null|comments.LeadDispositionComment
    {
        return <comments.LeadDispositionComment|null>this._getLatestCommentOfType("LeadDispositionComment");
    }

    get devDispositionComment() : null|comments.DevDispositionComment
    {
        return <comments.DevDispositionComment|null>this._getLatestCommentOfType("DevDispositionComment");
    }

    get hasDeveloperDisposition() : boolean 
    {
        return this.devDisposition != comments.DeveloperDispositions.None
    }

    get hasLeadDisposition() : boolean 
    {
        return this.leadDisposition != comments.LeadDispositions.None;
    }

    public addComment(newComment : comments.AbstractComment)
    {
        this._comments.push(newComment);

        // Notify the parent collection of the new comment so the user's comment
        // file can be written out. 
        if(this._parentCollection != null){
            this._parentCollection.onCommentAdded(newComment.user);
        }
    }

    private _getLatestCommentOfType(type : string)
    {
        let latestComment : comments.AbstractComment|null = null;
        let i;

        for(i = 0; i < this.comments.length; ++i)
        {
            if(this.comments[i].constructor.name == type)
            {
                if(latestComment == null)
                {
                    latestComment = this.comments[i];
                }
                else if(latestComment.timestamp < this.comments[i].timestamp)
                {
                    latestComment = this.comments[i];
                }
            }
        }

        return latestComment;
    }

    public setParentCollection(parentCollection : ReviewItemCollection)
    {
        this._parentCollection = parentCollection;
    }
}