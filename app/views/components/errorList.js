"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorList = void 0;
const abstractComponent_1 = require("./abstractComponent");
const errorTile_1 = require("./errorTile");
const log_1 = require("../../types/utils/log");
const errorListFilterSorter_1 = require("./errorListFilterSorter");
const errorListPaginationManager_1 = require("./errorListPaginationManager");
class ErrorList extends abstractComponent_1.AbstractParentComponent {
    constructor(state) {
        super(state, "ErrorList", "error-list-children");
        // Setup internal managers
        this._paginator = new errorListPaginationManager_1.ErrorListPaginationManager(state);
        this._filterSorter = new errorListFilterSorter_1.ErrorListFilterSorter(state, this._paginator);
        // onCodeCommentAdded
        // Load the New Comment in a Tile
        this.eventSubscribe("onCodeCommentAdded", () => {
            //TODO this._updateListItems(false);
        });
        // Error Changed
        this.eventSubscribe("onErrorChanged", (newError) => {
            this._onSelectedErrorChanged(newError);
        });
        this._paginator.on("displayListUpdated", () => {
            this._loadReviewItems();
        });
    }
    render() {
        // Clear the Child Controls
        this.clearChildren();
        // Clear & Load Template
        this.loadTemplateToParent();
    }
    selectNextError() {
        // Find the currently selected ErrorTile, then select the next tile in 
        // list
        let currentSelectedTile = null;
        let nextTile = null;
        for (let tile of this.childComponents) {
            if (currentSelectedTile == null) {
                if (tile.isSelected) {
                    currentSelectedTile = tile;
                    continue;
                }
            }
            else {
                nextTile = tile;
                break;
            }
        }
        // Select this Error
        if (nextTile != null) {
            let errorTile = nextTile;
            this._state.setSelectedError(errorTile.error);
        }
    }
    _onSelectedErrorChanged(newItem) {
        //TODO: Fix this. 
        // let loadItemsRequired = false;   
        // // Will the new error be filtered out? If so, set the filter to ALL
        // if(!this._errorList.itemIsDisplayed(newItem)) {
        //     this._setDisplayFilter(DisplayFilter.All, false);
        //     loadItemsRequired = true;
        // }
        // // Will the new error be on the current page? If not, load it
        // let itemIndex = this._errorList.getItemIndex(newItem);
        // if(itemIndex == null)
        //     return;
        // let pageIndex = this._paginationState.getPageForIndex(itemIndex);
        // if(pageIndex != this._paginationState.currentPageNumber){
        //     this._paginationState.setCurrentPage(pageIndex);
        //     loadItemsRequired = true;
        // }
        // // If necessary, reload tiles
        // if(loadItemsRequired)
        //     this._loadReviewItems();
        // Scroll to the disired item
        let tile = this._getTileForItem(newItem);
        if (tile != null)
            this._scrollToTile(tile);
        else
            log_1.Log.warning(`No tile found for item ${newItem.hash}`);
    }
    _loadReviewItems() {
        // Clear the current children compomnents
        this.clearChildren();
        // Load the items which are currently filtered and on the currently 
        // displayed page
        let filteredList = this._paginator.displayItemList;
        if (filteredList == null)
            return;
        for (let reviewItem of filteredList) {
            this.addChildComponent(new errorTile_1.ErrorTile(this._state, reviewItem));
        }
        // Scroll back to the top
        $("#error-list-children").scrollTop(0);
    }
    _getTileForItem(reviewItem) {
        for (let tile of this.childComponents) {
            if (tile.error == reviewItem)
                return tile;
        }
        // Nothing Found
        return null;
    }
    _scrollToTile(tile) {
        if (this._displayElement == null || tile.displayElement == null)
            return;
        let listElement = $("#error-list-children");
        let tileElement = tile.displayElement;
        // Get the Offset from the first tile
        let firstTileOffset = this.childComponents[0].displayElement.offset().top;
        // Is it already in view?
        // If so, nothing more to do
        var listViewTop = listElement.scrollTop();
        var listViewBottom = listViewTop + listElement.height();
        var elemTop = tileElement.offset().top - firstTileOffset;
        var elemBottom = elemTop + tileElement.height();
        if ((listViewTop <= elemTop) && (listViewBottom >= elemBottom)) {
            log_1.Log.debug("ErrorList: Scroll canceled, element is in view");
            return;
        }
        // How much do we need to move down until the bottom of the tile will be
        // in view?
        let scrollDelta = elemBottom - listViewBottom;
        listElement.animate({ scrollTop: listViewTop + scrollDelta }, 300);
    }
}
exports.ErrorList = ErrorList;
//# sourceMappingURL=errorList.js.map