import {AbstractComponent, AbstractParentComponent} from "./abstractComponent"
import {StateManager} from "../stateManager";
import {CodeError} from "../../types/codeError"
import {DisplayMode} from "../stateManager"
import {DeveloperDispositions, LeadDispositions} from "../../types/commentObjects"
import * as common from "./common"
import { AbstractReviewItem } from "../../types/abstractReviewItem";
import { CodeComment } from "../../types/codeComment";
import { Log } from "../../types/utils/log";

export class ErrorTile extends AbstractComponent
{
    private _error : AbstractReviewItem;
    private _isSelected : boolean = false;
    private _isErrorPathExpanded : boolean = false;

    get isSelected() : boolean { return this._isSelected; }
    get error() : AbstractReviewItem { return this._error; }
    get displayElement() : JQuery | null { return this._displayElement; }

    constructor(state : StateManager, error : AbstractReviewItem)
    {
        super(state, "ErrorTile");
        this._error = error;
        this._isSelected = false;
        
        // Display mode controls the orange bar on the right of the error
        this.eventSubscribe("onDisplayModeChanged", () => {
            this.render();
        });

        // When comments are added, re-render to pick up any changes in 
        // disposition state
        this.eventSubscribe("onCommentAdded", () => {
            this.render();
        });

        // Called by the State Manager in the event the selected error has 
        // changed
        this.eventSubscribe("onErrorChanged", () => {
            if(this._state.selectedError == null) {
                this._isSelected = false;
                return;
            }

            this._isSelected = (this._state.selectedError.hash == this._error.hash);
            this.render();
        });

        // Called by the StateManager when the selected index of the error path
        // changes
        this.eventSubscribe("onSelectedPathIndexChanged", () => {

            // Filter out events from other ErrorTiles
            if(this._state.selectedError == null || this.error.hash != this._state.selectedError.hash)
                return;

            this.render();
        });

        // Called by an ErrorTile in the event that a user clicks on the upper
        // portion of an ErrorTile, with the intent to select the error for
        // editing. 
        this.eventSubscribe("onErrorClicked", (errorHash) => {
            let wasSelected = this._isSelected;
            this._isSelected = (this._error.hash == errorHash);

            // If the selected status has changed, render
            if(wasSelected != this._isSelected) {
                this.render();
            
                // If we're newly selected, notify
                if(this._isSelected) {
                    this._state.setSelectedError(this._error);
                }
            }
        });


        // Called by an ErrorTile in the event a user clicks on a portion of the
        // error path. Set the StateManager's selected error path.
        this.eventSubscribe("onErrorPathClicked", (selectedPathIndex, errorId) => {

            // All of the error tiles will get this event, but we only want 
            // the error tile for this error ID to actually respond. 
            if(errorId != this._error.id)
                return;

            // Reinforce the current error.
            // Useful if a user clicks on a error path that isn't currently selected
            this._state.setSelectedError(this._error);

            // Update the selected path index in the shared state
            this._state.setSelectedPathIndex(selectedPathIndex);
        });

        // Toggle the display of the error path. 
        this.eventSubscribe("onErrorPathToggle", (errorHash) => {

            // Since all the error tiles get this event, if this tile isnt the 
            // one that was clicked, then close it
            if(this.error.hash != errorHash)
            {
                this._setErrorPathShown(false);
                return;
            }

            // If there is no currently selected error, select this error
            if(this._state.selectedError == null)
            {
                this._isSelected = true;
                this._state.setSelectedError(this._error);
            }

            // Toggle the Error Path Shown State
            this._setErrorPathShown(this._isErrorPathExpanded ? false : true);
        });

        // Create the display element name. This name will be used by the parent
        // when the component is added to the parent. 
        this._displayElementName = `error-${error.hash}`;
    }

    private _setErrorPathShown(showPath : boolean)
    {
        this._isErrorPathExpanded = showPath;

        // Collapse or Expand the box
        if(this._isErrorPathExpanded)
        {
            (<any>$(`#errorPath-${this.error.hash}`)).collapse("show");
            $(`#error-toggle-btn-${this._error.hash}`).text("Hide Path");
        }
         else 
         {
            (<any>$(`#errorPath-${this.error.hash}`)).collapse("hide");
            $(`#error-toggle-btn-${this._error.hash}`).text("Show Path");
         }
    }

    public render()
    {
        if(this._displayElement == null || this._error == undefined) {
            return;
        }

        // Do not load the Template. Its all below. 

        // If this is a static analysis finding, render that, otherwise its a 
        // user code comment
        let renderHTML;
        if(this._error instanceof CodeError)
        {
            renderHTML = this.renderCodeError();
        } 
        else 
        {
            renderHTML = this.renderCodeComment();
        }
       
       this._displayElement.empty();
       this._displayElement.append(renderHTML);
    }

    private _formatErrorTypeForScreen(errorType : string)
    {
        let itemName = errorType.toLowerCase();
        itemName = itemName.replace("-", " ");
        itemName = itemName.replace("_", " ");

        let str  = itemName.split(' ');
        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
        }
        itemName = str.join(' ');
        return itemName;
    }

    private renderCodeError() : string 
    {
        let renderError = <CodeError>this._error;

        let devDispositionSpanClass = common.getDevDispositionBadge(renderError.devDisposition);
        let leadDispositionSpanClass = common.getLeadDispositionBadge(renderError.leadDisposition);

        // Color the Left Border
       // Disposition mode -> Orange if No Developer Disposition
       // Review mode -> Orange if no Lead Dispostiion
       let showOrangeBorder;
       if(this._state.displayMode == DisplayMode.Disposition) {
           showOrangeBorder = !renderError.hasDeveloperDisposition;
       } else {
           showOrangeBorder = !renderError.hasLeadDisposition;
       }

       let leftBorderStyle;
       if(showOrangeBorder) {
           leftBorderStyle = "border-left: 6px solid orange";
       }
       else {
           leftBorderStyle = "border-left: 6px solid grey";
       }

       // Selected?
       let selectedClass = this._isSelected ? "error-item-selected" : "";
       let errorTypeForScreen = renderError.formatErrorTypeForScreen();

    let errorTemplate : string = `
    <div class="error-item ${selectedClass}" id='error-${renderError.hash}' ondblclick="view.routeEvent('onErrorClicked', '${renderError.hash}')" style="${leftBorderStyle}">
     <div><span class="error-item-title" style="font-weight:bold;">Error: </span><span style="font-weight:900">${errorTypeForScreen}</span></div>
     <div><span class="error-item-title">ID: </span><span style="user-select: text">${renderError.id}</span></div>
     <div><span class="error-item-title">File: </span>${renderError.fileLocation.filePath}</div>
     <div><span class="error-item-title">Line: </span>${renderError.lineNumber}</div>
     <div><span class="error-item-title">Tool: </span>${renderError.tool}</div>
     <div class="error-item-description">${this.getErrorTileBody(renderError)}</div>
    </div>`;

       return errorTemplate;
    }

    private getErrorTileBody(renderError : CodeError) : string 
    {
        if(renderError.errorPath.length > 1)
        {
            let errorPathTable = ""
            let pathIndex = 0;

            // The Error Path is currently output as a table. Generate that here. 
            errorPathTable = `
                <table class="errorPathTable">
                    <tr>
                        <th>Step</th>
                        <th>Details</th>
                    </tr>
            `;

            // Each Path Step is a Table Row
            for(let pathStep of renderError.errorPath) 
            {
                let divStyle = (pathIndex == this._state.selectedPathIndex && this._state.selectedError != null && this.error.hash == this._state.selectedError.hash) ? "background:var(--color-background-blue0);" : "";

                errorPathTable += `
                    <tr class="error-item-path-div" style="${divStyle}" onclick="view.routeEvent('onErrorPathClicked', '${pathIndex}', '${this._error.id}')">
                        <td>${pathIndex + 1}</td>
                        <td>
                            <div class="error-item-title">${pathStep.fileLocation.fileName}:${pathStep.fileLocation.lineNumber}</div>
                            <div>${pathStep.message}</div>
                        </td>
                    </tr>`;

                ++pathIndex;
            }
            errorPathTable += `</table>`;

            // Prep
            let buttonText = this._isErrorPathExpanded ? "Hide Path" : "Show Path";
            let errorPathId = `errorPath-${renderError.hash}`;

            // Output the Body
            return `
            <div>${renderError.errorPath[renderError.errorPath.length - 1].message}</div>
            <button id="error-toggle-btn-${this._error.hash}"  class="btn btn-secondary btn-sm" onclick="view.routeEvent('onErrorPathToggle', '${this._error.hash}')" style="margin-top: 5px;">
                ${buttonText}
            </button>
            <div class="collapse ${this._isErrorPathExpanded ? "show" : "" }" id="${errorPathId}" style="background:unset;">
                <div class="card card-body" style="background:unset; padding: 0px;">
                    ${errorPathTable}
                </div>
            </div>
            `;
        }
        else /* No Path */
        {
            return `<span style="user-select: text;">${renderError.errorMessage}</span>`;
        }
    }

    private renderCodeComment() : string
    {
        let renderComment = <CodeComment>this._error;

        let devDispositionSpanClass = common.getDevDispositionBadge(renderComment.devDisposition);
        let leadDispositionSpanClass = common.getLeadDispositionBadge(renderComment.leadDisposition);

        // Color the Left Border
       // Disposition mode -> Blue if No Developer Disposition
       // Review mode -> Blue if no Lead Dispostiion
       let showBlueBorder;
       if(this._state.displayMode == DisplayMode.Disposition) {
            showBlueBorder = (renderComment.devDisposition == DeveloperDispositions.None);
       }
       else {
            showBlueBorder = (renderComment.leadDisposition == LeadDispositions.None);
       }

       let leftBorderStyle;
       if(showBlueBorder) {
           leftBorderStyle = "border-left: 6px solid blue";
       }
       else {
           leftBorderStyle = "border-left: 6px solid grey";
       }

       // Selected?
       let selectedClass = this._isSelected ? "error-item-selected" : "";

       let errorTemplate : string = `
           <div class="error-item ${selectedClass}" id='error-${renderComment.hash}'onclick="view.routeEvent('onErrorClicked', '${renderComment.hash}')" style="${leftBorderStyle}">
           <div><span class="error-item-title">Commenter: </span><span style="user-select: text">${renderComment.username}</span></div>
           <div><span class="error-item-title">ID: </span><span style="user-select: text">${renderComment.id}</span></div>
           <div><span class="error-item-title">File: </span>${renderComment.fileName} <span class="error-item-title">Line: </span>${renderComment.lineNumber}</div>
           <div><span class="error-item-title">Dev Disposition: </span> <span class="badge ${devDispositionSpanClass}">${DeveloperDispositions[renderComment.devDisposition]}</span></div>
           <div><span class="error-item-title">Lead Disposition: </span> <span class="badge ${leadDispositionSpanClass}">${LeadDispositions[renderComment.leadDisposition].replace(new RegExp("_", 'g'), " ")}</span></div>
           <div class="error-item-description"><span style="user-select: text">${renderComment.message}</span></div>
           </div>`;

       return errorTemplate;
    }
}