import { Md5 } from "ts-md5";
import { AbstractReviewItem } from "./abstractReviewItem";
import { FileLocation } from "./utils/fileLocation";
import { Build } from "./buildParser";

/**
 * CodeComment Object
 * The CodeComment Object encapsulates a user generate comment on an arbitrary 
 * line of code. It is stored in the same file as the rest of the user comments
 * but isn't attached to a CodeError object, rather it is assocaited with a 
 * module and line of code. 
 */
export class CodeComment extends AbstractReviewItem
{
    protected _username : string;
    protected _timestamp : Date;
    protected _message : string;

    get username() { return this._username; }
    get timestamp() { return this._timestamp; }
    get message() { return this._message; }

    constructor(commentId : string, username : string, message : string, fileLocation : FileLocation, timestamp? : string, hash? : string)
    {
        super(commentId, fileLocation);
        this._username = username;
        this._message = message;

        // If specified, set the timestamp
        if(timestamp != undefined){
            this._timestamp = new Date(timestamp);
        } else {
            this._timestamp = new Date();
        }

        // If specified, set the hash, otherwise calcualte
        if(hash != undefined) {
            this._hash = hash;
        } else {
            this._hash = <string>Md5.hashAsciiStr(`${this._username}${this._timestamp.toString()}${this._message}`);
        }
    }


    public toJSON()
    {
        // NOTE: purposely excluding dev & lead dispositions here. They will be
        //       captured from the user comments which are restored into this 
        //       during init. 
        return {
            id:this.id,
            hash:this.hash,
            moduleName : this.moduleName,
            file : this.fileName,
            line : this.lineNumber,
            username : this.username,
            message : this.message,
            timestamp : this.timestamp.toString()
        }
    }

    public static fromJSON(jsonObject : any, index  : number, buildPath : string) : CodeComment
    {
        // If a comment doesnt yet have an ID associated with it (since this was
        // added late). Add one, otherwise just use the existing ID. 
        let commentId;
        if(jsonObject.id != undefined) {
             // Because JPL usernames are of the format <first initial><last name> we can
             // just grab the first two characters of the username and then capatilze.
            commentId = (<string>jsonObject.username).substr(0, 2).toUpperCase() + index.toString().padStart(6, "0");
        } else {
            commentId = jsonObject.id;
        }

        // Get the File Location
        let fileLocation = FileLocation.fromModuleRelativeFile(jsonObject.file, jsonObject.line, buildPath);
        
        // Return the new Comment Object
        return new CodeComment(commentId, jsonObject.username, jsonObject.message, fileLocation, jsonObject.timestamp, jsonObject.hash);
    }
}