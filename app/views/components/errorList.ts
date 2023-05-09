import {AbstractParentComponent} from "./abstractComponent"
import { StateManager, DisplayMode } from "../stateManager";
import { ErrorTile } from "./errorTile";
import { Log } from "../../types/utils/log";
import { AbstractReviewItem } from "../../types/abstractReviewItem"
import { CodeComment } from "../../types/codeComment";
import { CodeError } from "../../types/codeError";
import { Menu } from "electron";
import { ErrorListFilterSorter } from "./errorListFilterSorter";
import { ErrorListPaginationManager } from "./errorListPaginationManager";

export class ErrorList extends AbstractParentComponent
{
    private _paginator : ErrorListPaginationManager;
    private _filterSorter : ErrorListFilterSorter;

    constructor(state : StateManager)
    {
        super(state, "ErrorList", "error-list-children");

        // Setup internal managers
        this._paginator = new ErrorListPaginationManager(state);
        this._filterSorter = new ErrorListFilterSorter(state, this._paginator);

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

    public render()
    {
        // Clear the Child Controls
        this.clearChildren();

        // Clear & Load Template
        this.loadTemplateToParent();
    }

    public selectNextError()
    {
        // Find the currently selected ErrorTile, then select the next tile in 
        // list
        let currentSelectedTile = null;
        let nextTile = null;
        for(let tile of this.childComponents) 
        {
            if(currentSelectedTile == null)
            {
                if((<ErrorTile>tile).isSelected) {
                    currentSelectedTile = tile;
                    continue;
                }
            }
            else
            {
                nextTile = tile;
                break;
            }
        }

        // Select this Error
        if(nextTile != null) {
            let errorTile = (<ErrorTile>nextTile);
            this._state.setSelectedError(errorTile.error);
        }
    }

    private _onSelectedErrorChanged(newItem : AbstractReviewItem)
    {
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
        if(tile != null)
            this._scrollToTile(tile);
        else
            Log.warning(`No tile found for item ${newItem.hash}`);
    }


    
    private _loadReviewItems()
    {
        // Clear the current children compomnents
        this.clearChildren();

        // Load the items which are currently filtered and on the currently 
        // displayed page
        let filteredList = this._paginator.displayItemList;

        if(filteredList == null)
            return;

        for(let reviewItem of filteredList) {
            this.addChildComponent(new ErrorTile(this._state, reviewItem));
        }

        // Scroll back to the top
        $("#error-list-children").scrollTop(0);
    }

    private _getTileForItem(reviewItem : AbstractReviewItem) : ErrorTile | null
    {
        for(let tile of this.childComponents) 
        {
            if((<ErrorTile>tile).error == reviewItem)
                return <ErrorTile>tile;
        }

        // Nothing Found
        return null;
    }

    private _scrollToTile(tile : ErrorTile)
    {
        if(this._displayElement == null || tile.displayElement == null) 
            return;

        let listElement = <any>$("#error-list-children");
        let tileElement = <any>tile.displayElement;

        // Get the Offset from the first tile
        let firstTileOffset = (<any>(<ErrorTile>this.childComponents[0]).displayElement).offset().top;

        // Is it already in view?
        // If so, nothing more to do
        var listViewTop = listElement.scrollTop();
        var listViewBottom = listViewTop + listElement.height();
    
        var elemTop = tileElement.offset().top - firstTileOffset;
        var elemBottom = elemTop + tileElement.height();

        if ((listViewTop <= elemTop) && (listViewBottom >= elemBottom))
        {
            Log.debug("ErrorList: Scroll canceled, element is in view");
            return;
        }
        
        // How much do we need to move down until the bottom of the tile will be
        // in view?
        let scrollDelta = elemBottom - listViewBottom;
        listElement.animate({scrollTop: listViewTop + scrollDelta}, 300);
    }
}