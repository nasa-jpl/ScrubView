import { Log } from "./utils/log";

export enum DeveloperDispositions
{
    None,
    Agree,
    Disagree,
    Discuss
}

export enum LeadDispositions 
{
    None,
    Code_Fix_Requested,
    No_Action
}

export abstract class AbstractComment
{
    public readonly user : string;
    public readonly timestamp : Date;
    public readonly message : string;
    public readonly useMarkdown : boolean;

    constructor(message? : string, timestamp? : string, user? : string, useMarkdown? : boolean)
    {
        // Set the Message
        if(message == undefined) {
            message = "";
        }
        this.message = message;

        // Set the Timestamp
        if(timestamp == undefined) {
            this.timestamp = new Date();
        }
        else {
            this.timestamp = new Date(timestamp);
        }
        
        // Set the user
        if(user == undefined){
            user = require("os").userInfo().username;

            if(user == undefined) {
                user = "unknown";
            }
        }
        this.user = user;

        // Set the use Markdown flag
        if(useMarkdown == undefined) {
            this.useMarkdown = false;
        } else {
            this.useMarkdown = useMarkdown;
        }


    }

    public abstract toJSON() : {};

    public static fromJSON(version : string, data: any) : null | AbstractComment
    {
        let message = data.message
        let user = data.user
        let timestamp = data.timestamp 
        let useMarkdown = false;
        
        if(version == "2.0")
        {
            useMarkdown = data.markdown;
        }

        // Create the Comment Objects
        if(data.type == "TextComment")
        {
            return new TextComment(message,  user, useMarkdown, timestamp);
        }
        else if(data.type == "DeveloperDisposition")
        {
            return new DevDispositionComment(data.disposition, message, user, useMarkdown, timestamp);
        }
        else if(data.type == "LeadDisposition")
        {
            return new LeadDispositionComment(data.disposition, message, user, useMarkdown, timestamp);
        }

        // If we get here, its an error
        Log.error(`Unreachable State. Build Parser. Unknown Comment Type: ${data.type}`);
        return null;
    }

    public toHTML()
    {
        let html; 

        if(this.useMarkdown)
        {
            // Format message w/ markdown
            let showdown = require('showdown');
            let converter = new showdown.Converter();
            html= converter.makeHtml(this.message);
        }
        else 
        {
            html = `<p>${this.message}</p>`;
        }

        // Test for any error identifiers, which we will format
        let test = /((?:(?:COV)|(?:CS))[0-9]{6})/;
        html = html.replace(test, `<a class='badge badge-secondary' href='#' onclick='view.routeEvent("onErrorIdClicked", \"$1\")'>$1</a>`);

        // Test for any file:line numbers
        // let fileLineTest = /(([a-z]+_\w+.[ch]):(\d+))/;
        // html = html.replace(fileLineTest, `<a href="#" onclick='view.routeEvent("onCodeAnchorClicked", \"$2\", \"$3\")>$1</a>`);

        // Done
        return html;
    }
}

export class TextComment extends AbstractComment
{
    constructor(message? : string, user? : string, useMarkdown? : boolean, timestamp? : string)
    {
        super(message, timestamp, user, useMarkdown);
    }

    public toJSON()
    {
        return {type:"TextComment", user:this.user, timestamp:this.timestamp, message:this.message, markdown:this.useMarkdown}
    }
}

export class DevDispositionComment extends AbstractComment
{
    public readonly disposition : DeveloperDispositions;

    constructor(disposition : DeveloperDispositions, message?:string, user?:string, useMarkdown? : boolean, timestamp? : string)
    {
        super(message, timestamp, user, useMarkdown);
        this.disposition = disposition;
    }

    public toJSON()
    {
        return {type:"DeveloperDisposition", user:this.user, timestamp:this.timestamp, disposition:this.disposition, message:this.message, markdown:this.useMarkdown}
    }
}

export class LeadDispositionComment extends AbstractComment
{
    public readonly disposition : LeadDispositions;

    constructor(disposition : LeadDispositions, message? : string, user?:string, useMarkdown? : boolean, timestamp? : string)
    {
        super(message, timestamp, user, useMarkdown);
        this.disposition = disposition;
    }

    public toJSON()
    {
        return {type:"LeadDisposition", user:this.user, timestamp:this.timestamp, disposition:this.disposition, message:this.message, markdown:this.useMarkdown}
    }
}


