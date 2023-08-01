"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorTile = void 0;
const abstractComponent_1 = require("./abstractComponent");
const codeError_1 = require("../../types/codeError");
const stateManager_1 = require("../stateManager");
const commentObjects_1 = require("../../types/commentObjects");
const common = __importStar(require("./common"));
class ErrorTile extends abstractComponent_1.AbstractComponent {
    constructor(state, error) {
        super(state, "ErrorTile");
        this._isSelected = false;
        this._isErrorPathExpanded = false;
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
            if (this._state.selectedError == null) {
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
            if (this._state.selectedError == null || this.error.hash != this._state.selectedError.hash)
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
            if (wasSelected != this._isSelected) {
                this.render();
                // If we're newly selected, notify
                if (this._isSelected) {
                    this._state.setSelectedError(this._error);
                }
            }
        });
        // Called by an ErrorTile in the event a user clicks on a portion of the
        // error path. Set the StateManager's selected error path.
        this.eventSubscribe("onErrorPathClicked", (selectedPathIndex, errorId) => {
            // All of the error tiles will get this event, but we only want 
            // the error tile for this error ID to actually respond. 
            if (errorId != this._error.id)
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
            if (this.error.hash != errorHash) {
                this._setErrorPathShown(false);
                return;
            }
            // If there is no currently selected error, select this error
            if (this._state.selectedError == null) {
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
    get isSelected() { return this._isSelected; }
    get error() { return this._error; }
    get displayElement() { return this._displayElement; }
    _setErrorPathShown(showPath) {
        this._isErrorPathExpanded = showPath;
        // Collapse or Expand the box
        if (this._isErrorPathExpanded) {
            $(`#errorPath-${this.error.hash}`).collapse("show");
            $(`#error-toggle-btn-${this._error.hash}`).text("Hide Path");
        }
        else {
            $(`#errorPath-${this.error.hash}`).collapse("hide");
            $(`#error-toggle-btn-${this._error.hash}`).text("Show Path");
        }
    }
    render() {
        if (this._displayElement == null || this._error == undefined) {
            return;
        }
        // Do not load the Template. Its all below. 
        // If this is a static analysis finding, render that, otherwise its a 
        // user code comment
        let renderHTML;
        if (this._error instanceof codeError_1.CodeError) {
            renderHTML = this.renderCodeError();
        }
        else {
            renderHTML = this.renderCodeComment();
        }
        this._displayElement.empty();
        this._displayElement.append(renderHTML);
    }
    _formatErrorTypeForScreen(errorType) {
        let itemName = errorType.toLowerCase();
        itemName = itemName.replace("-", " ");
        itemName = itemName.replace("_", " ");
        let str = itemName.split(' ');
        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
        }
        itemName = str.join(' ');
        return itemName;
    }
    renderCodeError() {
        let renderError = this._error;
        let devDispositionSpanClass = common.getDevDispositionBadge(renderError.devDisposition);
        let leadDispositionSpanClass = common.getLeadDispositionBadge(renderError.leadDisposition);
        // Color the Left Border
        // Disposition mode -> Orange if No Developer Disposition
        // Review mode -> Orange if no Lead Dispostiion
        let showOrangeBorder;
        if (this._state.displayMode == stateManager_1.DisplayMode.Disposition) {
            showOrangeBorder = !renderError.hasDeveloperDisposition;
        }
        else {
            showOrangeBorder = !renderError.hasLeadDisposition;
        }
        let leftBorderStyle;
        if (showOrangeBorder) {
            leftBorderStyle = "border-left: 6px solid orange";
        }
        else {
            leftBorderStyle = "border-left: 6px solid grey";
        }
        // Selected?
        let selectedClass = this._isSelected ? "error-item-selected" : "";
        let errorTypeForScreen = renderError.formatErrorTypeForScreen();
        let errorTemplate = `
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
    getErrorTileBody(renderError) {
        if (renderError.errorPath.length > 1) {
            let errorPathTable = "";
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
            for (let pathStep of renderError.errorPath) {
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
            <div>${renderError.errorPath[0].message}</div>
            <button style="font-size: 10px" id="error-toggle-btn-${this._error.hash}"  class="btn btn-secondary btn-sm" onclick="view.routeEvent('onErrorPathToggle', '${this._error.hash}')" style="margin-top: 5px;">
                ${buttonText}
            </button>
            <div class="collapse ${this._isErrorPathExpanded ? "show" : ""}" id="${errorPathId}" style="background:unset;">
                <div class="card card-body" style="background:unset; padding: 0px;">
                    ${errorPathTable}
                </div>
            </div>
            `;
        }
        else /* No Path */ {
            return `<span style="user-select: text;">${renderError.errorMessage}</span>`;
        }
    }
    renderCodeComment() {
        let renderComment = this._error;
        let devDispositionSpanClass = common.getDevDispositionBadge(renderComment.devDisposition);
        let leadDispositionSpanClass = common.getLeadDispositionBadge(renderComment.leadDisposition);
        // Color the Left Border
        // Disposition mode -> Blue if No Developer Disposition
        // Review mode -> Blue if no Lead Dispostiion
        let showBlueBorder;
        if (this._state.displayMode == stateManager_1.DisplayMode.Disposition) {
            showBlueBorder = (renderComment.devDisposition == commentObjects_1.DeveloperDispositions.None);
        }
        else {
            showBlueBorder = (renderComment.leadDisposition == commentObjects_1.LeadDispositions.None);
        }
        let leftBorderStyle;
        if (showBlueBorder) {
            leftBorderStyle = "border-left: 6px solid blue";
        }
        else {
            leftBorderStyle = "border-left: 6px solid grey";
        }
        // Selected?
        let selectedClass = this._isSelected ? "error-item-selected" : "";
        let errorTemplate = `
           <div class="error-item ${selectedClass}" id='error-${renderComment.hash}'onclick="view.routeEvent('onErrorClicked', '${renderComment.hash}')" style="${leftBorderStyle}">
           <div><span class="error-item-title">Commenter: </span><span style="user-select: text">${renderComment.username}</span></div>
           <div><span class="error-item-title">ID: </span><span style="user-select: text">${renderComment.id}</span></div>
           <div><span class="error-item-title">File: </span>${renderComment.fileName} <span class="error-item-title">Line: </span>${renderComment.lineNumber}</div>
           <div><span class="error-item-title">Dev Disposition: </span> <span class="badge ${devDispositionSpanClass}">${commentObjects_1.DeveloperDispositions[renderComment.devDisposition]}</span></div>
           <div><span class="error-item-title">Lead Disposition: </span> <span class="badge ${leadDispositionSpanClass}">${commentObjects_1.LeadDispositions[renderComment.leadDisposition].replace(new RegExp("_", 'g'), " ")}</span></div>
           <div class="error-item-description"><span style="user-select: text">${renderComment.message}</span></div>
           </div>`;
        return errorTemplate;
    }
}
exports.ErrorTile = ErrorTile;
//# sourceMappingURL=errorTile.js.map