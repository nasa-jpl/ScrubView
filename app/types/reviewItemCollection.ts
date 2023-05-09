import {CodeError} from "./codeError"
import {Log} from "./utils/log"
import * as fs from "fs";
import * as path from "path";
import { AbstractReviewItem } from "./abstractReviewItem";
import { CodeComment } from "./codeComment";

export class ReviewItemCollection
{
    // Private Members
    private _valid : boolean;
    private _reviewItems : Map<string, AbstractReviewItem>;
    private _idToHash : Map<string, string>;
    private _moduleToHash : Map<string, Array<string>>;
    private _scrubDirPath : string;
    private _initComplete : Boolean; 

    // Accessors
    get valid(): boolean { return this._valid; }
    get length(): number { return this._reviewItems.size; }

    constructor(scrubDirPath : string)
    {
        this._valid = false;
        this._reviewItems = new Map<string, AbstractReviewItem>();
        this._idToHash = new Map<string, string>();
        this._moduleToHash = new Map<string, Array<string>>();
        this._scrubDirPath = scrubDirPath;
        this._initComplete = false;
    }

    public addCodeError(newError : CodeError)
    {
        this._addReviewItem(newError);
    }

    public addCodeComment(newCodeComment : CodeComment)
    {
        this._addReviewItem(newCodeComment);

        // Write this comment out to the user's file
        if(this._initComplete) {
            this._writeUserCommentFile(newCodeComment.username);
        }
    }

    private _addReviewItem(newReviewItem : AbstractReviewItem)
    {
        // Set the parent collection to be this object (for comment added callbacks)
        newReviewItem.setParentCollection(this);

        // Update the internal lists
        this._reviewItems.set(newReviewItem.hash, newReviewItem);
        this._idToHash.set(newReviewItem.id, newReviewItem.hash);
    }

    public getReviewItemById(id : string) : AbstractReviewItem | undefined
    {
        let itemHash = this._idToHash.get(id);
        if(itemHash == undefined)
            return undefined; 

        return this._reviewItems.get(itemHash);
    }

    public getReviewItem(hash : string) : AbstractReviewItem | undefined
    {
        return this._reviewItems.get(hash);
    }

    public getModuleReviewItemList(moduleName : string) : Array<AbstractReviewItem>
    {
        let returnList = new Array<AbstractReviewItem>();

        for(const error of this._reviewItems.values()) {
            if(error.moduleName == moduleName) {
                returnList.push(error);
            }
        }

        return returnList;
    }

    public getFolderReviewItemList(folderPath : string) : Array<AbstractReviewItem>
    {
        let returnList = new Array<AbstractReviewItem>();

        for(const error of this._reviewItems.values()) {
            if(path.join(error.fileLocation.sourceRoot ,error.fileLocation.filePath).startsWith(folderPath)) {
                returnList.push(error);
            }
        }

        return returnList;
    }

    public getFileReviewItemList(filePath : string) : Array<AbstractReviewItem>
    {
        let returnList = new Array<AbstractReviewItem>();

        for(const error of this._reviewItems.values()) {
            if(filePath.endsWith(error.fileLocation.filePath)) {
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
    public setInitComplete() {
        this._initComplete = true;
    }

    /**
     * Event called by CodeError objects to notify the collection that a change
     * has been made.
     * @param username Username which made the change
     */
    public onCommentAdded(username : string)
    {
        if(this._initComplete) {
            this._writeUserCommentFile(username);
        }
    }

    public getNextCommentIdForUser(username : string) : string 
    {
        //TODO: Concerns - concurrence. Two users requesting at the same time...
        return "";
    }

    /**
     * Writes out a users comment file. 
     * @param username Username to write the file for.
     */
    private _writeUserCommentFile(username : string)
    {
        let jsonContents = { fileVersion: "2.0", user : username, errors : Array<any>(), codeComments : Array<any>() };

        // For each review item, check to see if this user has made comments. 
        for(let reviewItem of this._reviewItems.values())
        {
            let reviewItemEntry = { id : reviewItem.id, hash : reviewItem.hash, comments : Array<any>() };
            
            for(let comment of reviewItem.comments)
            {
                if(comment.user == username)
                {
                    reviewItemEntry.comments.push(comment.toJSON());
                }
            }

            // If this user had comments for this review item, add those comments
            // to the output array
            if(reviewItemEntry.comments.length > 0) {
                jsonContents.errors.push(reviewItemEntry);
            }
            
            // If this reviewItem is a CodeComment, we need to write that out to
            // the file as well. 
            if(reviewItem instanceof CodeComment) 
            {
                jsonContents.codeComments.push((<CodeComment>reviewItem).toJSON());
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

            Log.message(`Wrote user comments file to ${filePath}.`);
        }
        catch(e) {
            Log.error(`Error writing user comments file to ${filePath}. Error: ${e}`); //TODO: This needs to be way more visible. LIke a popup or something. 
        }
    }
}