import * as fs from "fs"
import * as path from "path"
import { AbstractComponent } from "./abstractComponent"
import { CodeError, ErrorPathStep } from "../../types/codeError"
import { StateManager } from "../stateManager";
import { Log } from "../../types/utils/log";
import { AbstractReviewItem } from "../../types/abstractReviewItem";
import { LogMessageViewer } from "./logMessageViewer";
import { CodeCommentModal } from "./codeCommentModal";
import { FileLocation } from "../../types/utils/fileLocation";

let $ = require('jquery');

export class FileBrowserComponent extends AbstractComponent
{
    protected _displayedFilePath : string | null = null;

    constructor(state : StateManager)
    {
        super(state, "FileBrowser");

        // When the module changes, we want to clear the display
        this.eventSubscribe("onModuleChanged", ()=> {
            this._clear();
        });

        // When the mode changes, remove the popovers just in case there's now
        // a modal dialog (as in when a review is completed)
        this.eventSubscribe("onDisplayModeChanged", () => {
            this._popoverHideAll();
        });

        // When a file is clicked fromt he folder browser, load the file
        this.eventSubscribe("onFileClicked", (filePath)=>{

            if(this._state.selectedBuild == null) {
                return;
            }

            let fileLocation = new FileLocation(path.relative(this._state.selectedBuild.codePath, filePath), 0, this._state.selectedBuild.codePath);
            this._loadFile(fileLocation);
        });

        // When an Error Path is Clicked, show the path
        this.eventSubscribe("onErrorPathClicked", (pathIndex) => {
            this._state.setSelectedPathIndex(pathIndex);
        });

        // When the selected index of the Error Path has changed
        this.eventSubscribe("onSelectedPathIndexChanged", (pathIndex) => {
            this._onSelectedPathIndexChanged(pathIndex);
        });

        // When an error is clicked, load the error
        this.eventSubscribe("onErrorChanged", (errorHash) => {

            // Set the Current Filename from the Error
            if(this._state.selectedError == null || this._state.selectedError.fileLocation == null)
                return;

            // Only re-load the file if its new
            // This is a performance enhancement to cut down on reads to the 
            // disk as much as possible (they be slow). 
            if(this._displayedFilePath != this._state.selectedError.fileLocation.filePath) {
                this._loadFile(this._state.selectedError.fileLocation);
            } else {
                // Not a new file, just clear the highlighting
                this._clearHighlights();
            }

            // Highlight the file for this error
            this._highlightFile(this._state.selectedError);
        });
    }

    private _clear()
    {
        // Remove any popovers which are currently active
        this._popoverHideAll();

        // Clear the Contents of the Display
        $("code-browser-contents").empty();

        // Clear State
        this._displayedFilePath = null;
    }

    private _clearHighlights()
    {
        // Hide any Active Popovers
        this._popoverHideAll();

        // Remove any Highlights
        let lineElements = $("#code-browser-contents").find("ol").find("li");
        lineElements.removeClass("code-error-line");
        lineElements.removeClass("code-path-line");
        lineElements.removeClass("code-comment-line");
    }

    private _loadFile(fileLocation : FileLocation)
    {


        // Clear
        this._clear();

        // Set State
        this._displayedFilePath = fileLocation.filePath;

        // Read the File
        let fileContents;
        try {
            // fileContents = fs.readFileSync(fileLocation.filePath).toString();
            fileContents = fs.readFileSync(path.join(fileLocation.sourceRoot, fileLocation.filePath)).toString();
            Log.message("Loaded file from path: " + fileLocation.filePath);
        }
        catch(e) {
            Log.error(`Error reading file from ${fileLocation.filePath}. Error: ${e}`);
            //TODO: Populate the file viewer with somethign to indicate the error...
            return;
        }

        // Fix any windows CRLF line endings
        let LineEndingCorrector = require('line-ending-corrector').LineEndingCorrector;
        let result = LineEndingCorrector.correctSync(fileContents, {eolc: "LF"} );
        fileContents = result[1];
        // if(result[0]) {
        //     fileContents = result[1];
        // }
        
        // Set the Browser Filename
        $("#code-filename").text(` | ${fileLocation.fileName}`);
    
        let extension = path.extname(fileLocation.fileName).substring(1);
    
        // Escape HTML
        fileContents = this._escapeHtml(fileContents);

        // Deal with any Leading Linebreaks (Just \n will get stripped out, 
        // adding the space will stop that from happening)
        fileContents = fileContents.replace(/^\n/gm, " \n");
    
        // Syntax Highlighting & Line Numbering 
        let prettify = require('../../libs/code-prettify');
        let prettyContents = prettify.prettyPrintOne(fileContents, extension, 1);
        $("#code-browser-contents").empty();
        $("#code-browser-contents").append(prettyContents);
        
        // Add the Click Events
        $("#code-browser-contents > ol > li").each((index : number, element : any) => {

            // Double Click -> Add a Comment
            // element.addEventListener("dblclick", () => {  
            //     this._popoverHideAll();
            //     CodeCommentModal.show(fileLocation.filePath, index + 1);
            // });

            // Single Click -> Dismiss any Popovers
            element.addEventListener("click", () => {
                this._popoverHideAll();
            });
        });

        // Scroll to the first line
        $("#code-browser-contents").scrollTop(0);
    }


    private _highlightFile(errorObject : AbstractReviewItem)
    {
        // If no file is currently displayed, error
        if(this._displayedFilePath == null) {
            Log.error("Attempting to highlight an error when no file is displayed");
            return;
        }

        // If this is a CodeError (not a CodeComment)
        if(errorObject instanceof CodeError)
        {
            // If there's an Error Path, Highlight it
            if(errorObject.errorPath.length > 1)
            {
                for(let pathIndex = 0; pathIndex < errorObject.errorPath.length; pathIndex += 1)
                {
                    let pathStep = errorObject.errorPath[pathIndex];

                    // If this step in the path is for the currently displayed file
                    // and the step isn't on the same line number as the eventual error
                    // then we show the yellow highlight
                    if((pathStep.fileLocation.filePath == this._displayedFilePath) && (pathStep.fileLocation.lineNumber != errorObject.lineNumber)) 
                    {
                        this._highlightLine(pathStep.fileLocation.lineNumber, "code-path-line", false);
                    }
                }
            }

            // The Red Error Highlight Line
            this._highlightLine(errorObject.lineNumber, "code-error-line", true);
        }
        else
        {
            // The Blue Highlight Line
            this._highlightLine(errorObject.lineNumber, "code-comment-line", true);
        }
    }

    /**
     * Highlights a selected line number with the desired class
     * @param lineNumber Line number to highlight
     * @param lineClass Class to apply to the line
     * @param scrollToLine Scroll the viewport to the line after highlighting
     * @returns  Nothing
     */
    private _highlightLine(lineNumber : number, lineClass : string, scrollToLine : boolean)
    {
        if(lineNumber <= 0)
            return;
        
        this._getElementForLine(lineNumber).addClass(lineClass);
        if(scrollToLine)
            this._scrollToLine(lineNumber);
    }


    /**
     * Scrolls to line
     * @param lineNumber line number to scroll to
     */
    private _scrollToLine(lineNumber : number)
    {
        let desiredLine = $("#code-browser-contents").find("ol").find("li").eq(lineNumber -1);
        $("#code-browser-contents").scrollTop($("#code-browser-contents").scrollTop() + desiredLine.position().top - $("#code-browser-contents").height() / 2);
    }

    public render()
    {
        // Clear the parent
        this.loadTemplateToParent();
    }

    private _escapeHtml(unsafe : string)
    {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

     private _onSelectedPathIndexChanged(pathIndex : number)
     {
         // I'm not sure why this is needed, but without this pathIndex seems
         // get treated a string rather than a number. 
        pathIndex = Number(pathIndex);
        
        // Just doublecheck there is still a selected Error
        if(this._state.selectedError == null) {
            return;
        }

        // Cast and setup convienence variables
        let selectedError = <CodeError>this._state.selectedError;
        let selectedPathStep = selectedError.errorPath[pathIndex];

        // If the file for the path index != currently display file, load it and
        // highlight it
        if(this._displayedFilePath != selectedPathStep.fileLocation.filePath)
        {
            this._loadFile(selectedPathStep.fileLocation);
            this._highlightFile(this._state.selectedError);
        }

        Log.debug(`Showing Path Index: ${pathIndex}`);

        // Hide Previous Popovers then show the desired popover
        this._popoverHideAll();
        this._popoverShow(pathIndex, selectedPathStep);
     }

     private _popoverShow(pathIndex : number, pathStep : ErrorPathStep)
     {
        let element = this._getElementForLine(pathStep.fileLocation.lineNumber);
        element.popover("dispose");

        // Build the Popover Message Content
        let popoverContent = `
            ${pathStep.message}
            <div style="margin-top: 10px; text-align:center;">
                <a class="btn btn-sm btn-secondary" href="#" id="popoverPrevious">&#8592; Previous </a> 
                <a class="btn btn-sm btn-secondary" href="#" id="popoverNext"'>Next &#8594;</a>
            </div>
        `

        element.popover({trigger: "focus",
                         placement: "top",
                         offset: 0,
                         html: true,
                         title: ()=>{ return `Step ${pathIndex + 1}`},
                         content: ()=>{ return popoverContent; },
                        });

        // Call this after the popover is inserted into the DOM
        element.on("inserted.bs.popover", () => {
            $("#popoverPrevious").click( () => { this._state.setSelectedPathIndex(pathIndex - 1) });
            $("#popoverNext").click(     () => { this._state.setSelectedPathIndex(pathIndex + 1) });
        });

        // Show It
        element.popover("show");

        // Scroll to the Line
        this._scrollToLine(pathStep.fileLocation.lineNumber);
     }

     private _popoverHideAll()
     {
        $("#code-browser-contents").find("ol").find("li").popover("dispose");
     }

     private _getElementForLine(lineNumber : number)
     {
        return $("#code-browser-contents").find("ol").find("li").eq(lineNumber - 1);
     }

    
}