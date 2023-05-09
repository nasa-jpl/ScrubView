"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorListPaginationManager = void 0;
const events_1 = require("events");
const log_1 = require("../../types/utils/log");
class ErrorListPaginationManager extends events_1.EventEmitter {
    constructor(state) {
        super();
        this._itemsPerPage = 20;
        this._itemList = null;
        this._displayList = null;
        this._currentPageIndex = 0;
        // onErrorPageClicked
        // Jump to the requested page
        state.on("onErrorPageClicked", (buttonIndex) => {
            this.jumpToPage(buttonIndex);
        });
    }
    get displayItemList() { return this._displayList; }
    /**
     * Loads the list of items to display. This is called by the ErrorListFilterSorter
     * and causes a refresh of the pagination state back to an initial state.
     * @param displayItems the Array of items to be displayed
     */
    loadDisplayItems(displayItems) {
        log_1.Log.debug(`Paginator received a list of length ${displayItems.length} from the FilterSorter`);
        // Set the List
        this._itemList = displayItems;
        // Do this here so the pagination control update sees it
        this._currentPageIndex = 0;
        // Update Pagination Controls
        this._updatePaginationControls();
        // Calculate State, and reset back to the first item 
        this.jumpToPage(0);
    }
    /**
     * Updates the user facing pagination controls to display the proper number
     * of buttons for a loaded item list.
     */
    _updatePaginationControls() {
        if (this._itemList == null)
            return;
        // If there are fewer items in the display list then a single page of 
        // pagination, dont display the controls. 
        if (this._itemList.length <= this._itemsPerPage) {
            log_1.Log.debug(`Item list is length ${this._itemList.length}. Hiding pagination controls`);
            $("#error-list-pagenation").hide();
        }
        else {
            // More items in the list than will fit on a single page, so show the
            // pagination buttons. 
            // Clear any existing buttons
            $("#error-list-pagenation-buttons").empty();
            // Create the buttons
            let buttonCount = this._itemList.length / this._itemsPerPage;
            for (let buttonIndex = 0; buttonIndex < buttonCount; ++buttonIndex) {
                let buttonClass = buttonIndex == this._currentPageIndex ? "btn-secondary" : "btn-outline-secondary";
                $("#error-list-pagenation-buttons").append(`<button class="btn ${buttonClass} btn-sm" onclick="view.routeEvent('onErrorPageClicked', ${buttonIndex})">${buttonIndex + 1}</button>`);
            }
            $("#error-list-pagenation").show();
        }
    }
    /**
     * Jumps to a desired page in the item list and emits the event to cause the
     * parent list to update
     * @param pageIndex Page index to jump to.
     */
    jumpToPage(pageIndex) {
        // No item list? No jumping to a page in that list. 
        if (this._itemList == null)
            return;
        // Calculate the last page number, which has to be at least 1
        let lastPageNumber = Math.max(Math.ceil(this._itemList.length / this._itemsPerPage), 1);
        if (pageIndex >= lastPageNumber || pageIndex < 0)
            throw Error(`Invalid page index: ${pageIndex}. Max pages is ${lastPageNumber}`);
        // Set the current Page
        this._currentPageIndex = pageIndex;
        // Update the Display List
        let firstDisplayedItemIndex = this._currentPageIndex * this._itemsPerPage;
        let lastDisplayedItemIndex = Math.min((this._currentPageIndex + 1) * this._itemsPerPage, this._itemList.length);
        this._displayList = this._itemList.slice(firstDisplayedItemIndex, lastDisplayedItemIndex);
        // Update the buttons to display the proper class now
        $("#error-list-pagenation-buttons").children().each((index, element) => {
            if (index != this._currentPageIndex) {
                $(element).addClass("btn-outline-secondary");
                $(element).removeClass("btn-secondary");
            }
            else {
                $(element).removeClass("btn-outline-secondary");
                $(element).addClass("btn-secondary");
            }
        });
        // Emit the updated event
        log_1.Log.debug("Paginator sending updated error list");
        this.emit("displayListUpdated");
    }
    getPageForIndex(itemIndex) {
        return Math.floor(itemIndex / this._itemsPerPage);
    }
}
exports.ErrorListPaginationManager = ErrorListPaginationManager;
//# sourceMappingURL=errorListPaginationManager.js.map