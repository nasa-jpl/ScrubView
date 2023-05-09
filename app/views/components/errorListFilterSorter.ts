
import { AbstractReviewItem } from "../../types/abstractReviewItem";
import { StateManager, DisplayMode } from "../stateManager";
import { DeveloperDispositions, LeadDispositions } from "../../types/commentObjects";
import { CodeError } from "../../types/codeError";
import { CodeComment } from "../../types/codeComment";
import { ErrorListPaginationManager } from "./errorListPaginationManager";
import { Log } from "../../types/utils/log";

enum SortTypes
{
    None, 
    ByFile,
    ByError
}

enum MatchAction
{
    Hide,
    Show,
    NoMatch
}

export class ErrorListFilterSorter
{
    private _sortType : SortTypes
    private _matchGroups : Array<MatchGroup>
    private _moduleList : Array<AbstractReviewItem> | null;
    private _filteredList : Array<AbstractReviewItem> | null;
    private _state : StateManager;
    private _changingFilterStates = false;
    private _delayedUpdatePending = false;
    private _paginator : ErrorListPaginationManager;

    private _fileMatchGroup : MatchGroup;
    private _errorMatchGroup : MatchGroup;
    private _toolMatchGroup : MatchGroup;
    private _fileLocationMatchGroup : MatchGroup;
    private _hasConnectedFilterEvents : boolean;

    constructor(state : StateManager, paginator : ErrorListPaginationManager)
    {
        this._sortType = SortTypes.None;
        this._matchGroups = new Array<MatchGroup>();
        this._moduleList = null;
        this._filteredList = null;
        this._state = state;
        this._paginator = paginator;
        this._hasConnectedFilterEvents = false;
        this._delayedUpdatePending = false;

        // Completeness Filters
        let completenessGroup = new MatchGroup();
        completenessGroup.addMatcher(new MatchToGo("match-to-go"));
        completenessGroup.addMatcher(new MatchComplete("match-complete"));
        // this._matchGroups.push(completenessGroup);

        // Type Filters
        let typeGroup = new MatchGroup();
        typeGroup.addMatcher(new MatchErrors("match-errors"));
        typeGroup.addMatcher(new MatchComments("match-comments"));
        // this._matchGroups.push(typeGroup);

        // Disposition Filters
        let dispositionGroup = new MatchGroup();
        dispositionGroup.addMatcher(new MatchDevDisposition(DeveloperDispositions.Agree, "match-agree"));
        dispositionGroup.addMatcher(new MatchDevDisposition(DeveloperDispositions.Disagree, "match-disagree"));
        dispositionGroup.addMatcher(new MatchDevDisposition(DeveloperDispositions.Discuss, "match-discuss"));
        dispositionGroup.addMatcher(new MatchLeadDisposition(LeadDispositions.No_Action, "match-no-action"));
        dispositionGroup.addMatcher(new MatchLeadDisposition(LeadDispositions.Code_Fix_Requested, "match-code-fix"));
        // this._matchGroups.push(dispositionGroup);

        // File & Error Match Group
        // These are populated onModuleChanged
        this._fileMatchGroup = new MatchGroup();
        this._errorMatchGroup = new MatchGroup();
        this._toolMatchGroup = new MatchGroup();
        this._fileLocationMatchGroup = new MatchGroup();
        // this._matchGroups.push(this._fileMatchGroup);
        // this._matchGroups.push(this._errorMatchGroup);
        // this._matchGroups.push(this._fileLocationMatchGroup);
        this._matchGroups.push(this._toolMatchGroup);

        // Filters changed, update the filteredList
        this._state.on("onErrorFilterChanged", (clickedBox) => {
            this._onErrorFilterChanged(clickedBox);
        });

        // Module Changed, Set the new Error List
        this._state.on('onModuleChanged', () => {
            this._onModuleChanged();
        });

        // Module Changed, Set the new Error List
        this._state.on('onFolderClicked', () => {
            this._onFolderChanged();
        });

        // File selected, set the new error list
        this._state.on('onFileClicked', (filePath) => {
            this._onFileChanged(filePath);
        });

        // If a disposition has been added, we set up a delayed refilter for next
        // time the selected error changes
        this._state.on("onDispositionAdded", () => {
            //TODO: I thought this was an easy feature to implement, turns out
            // it causes a lot of issues. Revisit this at another time. 
            // this._delayedUpdatePending = true;
        });

        this._state.on("onErrorChanged", () => {
            if(this._delayedUpdatePending)
            {
                this._delayedUpdatePending = false;
                this._updateFilteredList();
            }
        });

        // When there's a new code comment added, we need to regrab the module's
        // list of items, then filter it. 
        this._state.on("onCodeCommentAdded", () => {
            this._updateModuleItemList();
            this._updateFilteredList();
        });

        this._state.on('filter.allNone', (args:any) => {
            switch(args.group)
            {
                case "file":  this._fileMatchGroup.setAllNone(args.type); break;
                case "file-location": this._fileLocationMatchGroup.setAllNone(args.type); break;
                case "errors" : this._errorMatchGroup.setAllNone(args.type); break;
                default:
                    Log.warning(`Unknown filter group: ${args.group}`);
                    return;
            }

            this._updateFilteredList();
        });

        this._state.on('sort.changed', (sortType:any) => {
            switch(sortType)
            {
                case "none" : this._sortType = SortTypes.None;
                case "error": this._sortType = SortTypes.ByError; break;
                case "file": this._sortType = SortTypes.ByFile; break;
                default:
                    Log.warning(`Invalid sort type: ${sortType}.`);
                    return;
            }

            this._updateFilteredList();
        });

    }

    private _onModuleChanged()
    {
        if(this._state.selectedBuild == null || this._state.selectedModule == null)
            return;

        // Get the new Module List
        this._updateModuleItemList();

        // Clear Filters
        this._setAllMatchActions(MatchAction.Show);

        // Update the Filter / Sort Menu with new files & error types
        this._updateFilterSortMenu();

        // Update
        this._updateFilteredList();
    }

    private _onFolderChanged()
    {
        if(this._state.selectedBuild == null || this._state.selectedModule == null)
            return;

        // Get the new Module List
        this._updateModuleItemList();

        // Clear Filters
        this._setAllMatchActions(MatchAction.Show);

        // Update the Filter / Sort Menu with new files & error types
        this._updateFilterSortMenu();

        // Update
        this._updateFilteredList();
    }

    private _onFileChanged(filePath : string)
    {
        if(this._state.selectedBuild == null || this._state.selectedModule == null)
            return;

        // Get the new Module List
        this._updateFileItemList(filePath);

        // Clear Filters
        this._setAllMatchActions(MatchAction.Show);

        // Update the Filter / Sort Menu with new files & error types
        this._updateFilterSortMenu();

        // Update
        this._updateFilteredList();
    }

    private _updateModuleItemList()
    {
        if(this._state.selectedBuild == null || this._state.selectedModule == null || this._state.currentBrowserPath == null)
            return;

        // this._moduleList = this._state.selectedBuild.errors.getModuleReviewItemList(this._state.selectedModule);
        this._moduleList = this._state.selectedBuild.errors.getFolderReviewItemList(this._state.currentBrowserPath);
    }

    private _updateFileItemList(filePath : string)
    {
        if(this._state.selectedBuild == null || this._state.selectedModule == null || this._state.currentBrowserPath == null)
            return;

        // this._moduleList = this._state.selectedBuild.errors.getModuleReviewItemList(this._state.selectedModule);
        this._moduleList = this._state.selectedBuild.errors.getFileReviewItemList(filePath);
    }

    private _setAllMatchActions(action : MatchAction)
    {
        // Disable Filter Changed Events
        this._changingFilterStates = true;

        // Change 
        for(let group of this._matchGroups)
            for(let matcher of group.matchers)
                matcher.setMatchAction(action);

        // Re-enable Match Action Changed events
        this._changingFilterStates = false;
    }

    private _onErrorFilterChanged(elementId : string)
    {
        // If we're currently changing the filter states programatically, we 
        // want to ignore these events
        if(this._changingFilterStates)
            return;
        
        // If 'filter-select-all' was clicked, either enable or disable all the 
        // filteres. 
        // Counterintuitively, if a box is checked, its associated filter is
        // disabled. 
        if(elementId == "select-all" || elementId == "select-none")
        {
            let matchAction = (elementId == "select-all") ? MatchAction.Show : MatchAction.Hide;
            this._setAllMatchActions(matchAction);
        }
        else 
        {
            let found = false; 

            // Enable or Disable the selected filter
            for(let matchGroup of this._matchGroups)
                for(let matcher of matchGroup.matchers)
                    if(matcher.elementId == elementId)
                    {
                        Log.debug(`Toggling matcher ${matcher.elementId}`)
                        matcher.toggleMatchAction()
                        found = true;
                    }

            if(!found)
                Log.debug(`Did not find matcher for element: ${elementId}`)
        }

        // Update the Display List & Emit the Event notifying of the new display
        // list 
        this._updateFilteredList();
    }

    public setModuleErrorList(moduleList : Array<AbstractReviewItem>)
    {
        this._moduleList = moduleList;
        this._updateFilteredList();
        this._updateFilterSortMenu();
    }

    public setSort(sortType : SortTypes)
    {
        this._sortType = sortType;
        this._updateFilteredList();
    }

    private _updateFilteredList()
    {
        // No error list? We're done. 
        if(this._moduleList == null) {
            return;
        }
        
        // Filter First
        this._filteredList = new Array<AbstractReviewItem>();
        for(let item of this._moduleList)
        {
            let result = MatchAction.Show;

            // Each Match group needs to return "show", otherwise the item is 
            // hidden. Within the match groups, if any of the match criteria says
            // show, the item is shown. 
            for(let matchGroup of this._matchGroups)
            {
                if(matchGroup.checkItem(item, this._state) == MatchAction.Hide)
                {
                    result = MatchAction.Hide;
                    break;
                }
            }

            // If the result is still show, add the item to the list. 
            if(result == MatchAction.Show)
            {
                this._filteredList.push(item);
            }
        }

        // Sort the list
        if(this._sortType != SortTypes.None)
        {
            this._filteredList.sort( (a : AbstractReviewItem, b:AbstractReviewItem) => {

                let naturalCompare = require("natural-compare-lite");

                // Sort by File
                if(this._sortType == SortTypes.ByFile) {
                    let rVal = naturalCompare(a.fileName.toLowerCase(), b.fileName.toLowerCase());

                    if(rVal != 0)
                        return rVal; // Different files
                    else 
                    {
                        // Files are the same, sort by line number
                        return a.lineNumber - b.lineNumber;
                    }

                } else {
                    // Sort by Error Type
                    let aType = (a instanceof CodeError) ? a.errorType : "Comment";
                    let bType = (b instanceof CodeError) ? b.errorType : "Comment";
                    return naturalCompare(aType, bType);
                }

            });
        }

        // Update Display
        $("#filter-count-displayed").text(this._filteredList.length);
        $("#filter-count-total").text(this._moduleList.length);

        // Notify that the new filtered & sorted list is ready
        Log.debug(`  Module List is length: ${this._moduleList.length}. 
        Filtered list is length: ${this._filteredList.length}. 
        Sending new display list to the paginator`);
        this._paginator.loadDisplayItems(this._filteredList);
    }


    private _updateFilterSortMenu()
    {
        if(this._moduleList == null)
            return;
        
        let moduleFileList = new Array<string>();
        let moduleErrorList = new Array<string>();
        let moduleFileLocationList = new Array<string>();
        let toolList = new Array<string>();

        // Traverse the module's error list to get the new files & errors
        for(let reviewItem of this._moduleList)
        {
            // Get the tool name
            let toolName = reviewItem.id.replace(/\d+/g, '');

            // New Tool?
            if(!toolList.includes(toolName))
                toolList.push(toolName);

            // New File?
            if(!moduleFileList.includes(reviewItem.fileName))
                moduleFileList.push(reviewItem.fileName);

            // New Error?
            if(reviewItem instanceof CodeError)
            {
                let errorType = (<CodeError>reviewItem).formatErrorTypeForScreen();
                if(!moduleErrorList.includes(errorType))
                    moduleErrorList.push(errorType);
            }

            // New Location?
            let locationString = `${reviewItem.fileName}:${reviewItem.lineNumber}`;
            if(!moduleFileLocationList.includes(locationString))
                moduleFileLocationList.push(locationString);
        }

        // Update the Files Menu
        $("#match-group-file-list").empty();
        this._fileMatchGroup.clear();

        for(let file of moduleFileList)
        {
            // Add the Menu Item
            let menuElementId = this._addMenuItem("match-group-file-list", file, "file");
            this._fileMatchGroup.addMatcher(new MatchFile(menuElementId, file));
        }

        // Update the File Location Menu
        $("#match-group-file-locations-list").empty();
        this._fileLocationMatchGroup.clear();

        for(let fileLocation of moduleFileLocationList)
        {
            let menuElementId = this._addMenuItem("match-group-file-locations-list", fileLocation, "file-location");
            let fileName = fileLocation.split(":")[0];
            let lineNumber = fileLocation.split(":")[1]
            this._fileLocationMatchGroup.addMatcher(new MatchFileLocation(menuElementId, fileName, Number(lineNumber)));
        }

        // Update the Tools Menu
        $("#match-tools-list").empty();
        this._toolMatchGroup.clear();

        for(let tool of toolList)
        {
            // Add the Menu Item
            let menuElementId = this._addMenuItem("match-tools-list", tool, "findings");
            this._toolMatchGroup.addMatcher(new MatchTool(menuElementId, tool));
        }

        // Update the Errors Menu
        $("#match-group-errors-list").empty();
        this._errorMatchGroup.clear();

        for(let error of moduleErrorList)
        {
            // Add the Menu Item
            let menuElementId = this._addMenuItem("match-group-errors-list", error, "error");
            this._errorMatchGroup.addMatcher(new MatchError(menuElementId, error));
        }

        // Elements to Connect Events To
        // NOTE: We dont want to connect events twice to the "base" filter options
        // that dont change module to module. Doing so will call the handler multiple times
        // let elementsToConnect = "#match-group-errors-list a, #match-group-file-list a, #match-group-file-locations-list a";
        let elementsToConnect = "#match-tools-list a";

        if(!this._hasConnectedFilterEvents)
        {
            elementsToConnect += ", #filter-menu a"
            this._hasConnectedFilterEvents = true;
        }

        // Connect Events
        $(elementsToConnect).on("click", (e) => { 
            e.stopPropagation();
            e.preventDefault();
            this._onErrorFilterChanged(e.currentTarget.id);
        });
    }

    private _addMenuItem(menuParentElement : string, item : string, elementPrefix : string)
    {
        let parentElement = $("#" + menuParentElement);

        // Create a valid element Id
        let elementId = item;
        elementId = this._replaceCharsInString(["_", " ", ":", "[.]"], "-", item);
        elementId = elementId.toLowerCase();
        elementId = `match-${elementPrefix}-${elementId}`;
         
         // Add the Menu Element
         parentElement.append(`<a href="#" id="${elementId}" class="active">${item}</a>`);

        return elementId;
    }

    private _replaceCharsInString(charList : Array<string>, replacementChar : string, originalString : string) : string 
    {
        for(let char of charList)
        {
            let re = new RegExp(char,"g");
            originalString = originalString.replace(re, replacementChar);
        }

        return originalString;
    }
    
}

abstract class AbstractMatcher
{
    private _elementId : string;
    private _currentMatchAction : MatchAction;

    get elementId() : string { return this._elementId; }
    get matchResult(): MatchAction { return this._currentMatchAction; }

    constructor(elementId : string)
    {
        this._elementId = elementId;
        this._currentMatchAction = MatchAction.Show;
    }

    /**
     * Evaluates an item for display. 
     * @param reviewItem The AbstractReviewItem object to test
     * @returns true if item should be displayed, false otherwise
     */
    public evaluateItem(item:AbstractReviewItem, state:StateManager) : MatchAction
    {
        // Does this item match?
        let itemMatches = this._checkMatch(item, state);

        // If the item doesnt match the criteria, we dont render a verdict
        if(!itemMatches)
            return MatchAction.NoMatch;
        else
            // Otherwise, we return hide or show depending on the state of the 
            // associated checkbox in the Filter menu
            return this._currentMatchAction;
    }

    public setMatchAction(newAction : MatchAction)
    {
        this._currentMatchAction = newAction;
        
        // Update the Menu
        $("#"+this.elementId).removeClass("active");
        $("#"+this.elementId).removeClass("inactive");

        if(this._currentMatchAction == MatchAction.Show)
            $("#"+this.elementId).addClass("active");
        else 
            $("#"+this.elementId).addClass("inactive");

        // Debug
        Log.debug(`Setting ${this._elementId} to ${this._currentMatchAction}`);
    }

    public toggleMatchAction()
    {
        // If the display box is checked, we want to include results which match
        // this filter. If the box is unchecked, we want to remove them. 
        this.setMatchAction(this._currentMatchAction == MatchAction.Show ? MatchAction.Hide : MatchAction.Show);
    }

    protected abstract _checkMatch(reviewItem : AbstractReviewItem, state : StateManager) : boolean;
}

/**
 * Filter To Go and Filter Complete
 * Work to go is defined by the current mode. In Disposition mode
 * anything without a dev disposition is to go. In Review mode anything
 * without a lead disposition is to go. FilterComplete is the opposite of this.
 */

class MatchToGo extends AbstractMatcher
{
    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        // Work to go is defined by the current mode. In Disposition mode
        // anything without a dev disposition is to go. In Review mode 
        // anything without a lead disposition is to go. 
        if(state.displayMode == DisplayMode.Disposition){
            return !reviewItem.hasDeveloperDisposition;
        } else {
            return !reviewItem.hasLeadDisposition;
        }
    }
}

class MatchComplete extends MatchToGo
{
    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        return !super._checkMatch(reviewItem, state);
    }
}


class MatchDevDisposition extends AbstractMatcher
{
    private _disposition : DeveloperDispositions;
    constructor(disposition : DeveloperDispositions, elementId : string)
    {
        super(elementId);
        this._disposition = disposition;
    }

    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        return (reviewItem.devDisposition == this._disposition);
    }
}

class MatchLeadDisposition extends AbstractMatcher
{
    private _disposition : LeadDispositions;
    constructor(disposition : LeadDispositions, elementId : string)
    {
        super(elementId);
        this._disposition = disposition;
    }

    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        return (reviewItem.leadDisposition == this._disposition);
    }
}

class MatchErrors extends AbstractMatcher
{
    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        return (reviewItem instanceof CodeError)
    }
}

class MatchComments extends AbstractMatcher
{
    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        return (reviewItem instanceof CodeComment)
    }
}

class MatchFile extends AbstractMatcher
{
    private _fileName : string; 

    constructor(elementId : string, fileName : string)
    {
        super(elementId);
        this._fileName = fileName;
    }

    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        return reviewItem.fileName == this._fileName;
    }
}

class MatchFileLocation extends AbstractMatcher 
{
    private _fileName : string;
    private _lineNumber : number;

    constructor(elementId : string, fileName : string, lineNumber : number)
    {
        super(elementId);
        this._fileName = fileName;
        this._lineNumber = lineNumber;
    }

    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        return (reviewItem.fileName == this._fileName && reviewItem.lineNumber == this._lineNumber);
    }
}

class MatchError extends AbstractMatcher
{
    private _errorType : string;

    constructor(elementId : string, errorType : string)
    {
        super(elementId);
        this._errorType = errorType;
    }

    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        if(reviewItem instanceof CodeError)
            return reviewItem.formatErrorTypeForScreen() == this._errorType;
        else 
            return false;
    }
}

class MatchTool extends AbstractMatcher
{
    private _toolName : string;

    constructor(elementId : string, toolName : string)
    {
        super(elementId);
        this._toolName = toolName;
    }

    protected _checkMatch(reviewItem : AbstractReviewItem, state : StateManager)
    {
        // Check to see if the tool matches
        if(reviewItem.id.startsWith(this._toolName))
            return true;
        else
            return false;
    }
}




/**
 * MatchGroup
 */
class MatchGroup
{
    public matchers : Array<AbstractMatcher>;

    constructor()
    {
        this.matchers = new Array<AbstractMatcher>();
    }

    public addMatcher(matcher : AbstractMatcher)
    {
        this.matchers.push(matcher);
    }

    public clear()
    {
        this.matchers = new Array<AbstractMatcher>();
    }

    public setAllNone(allNone : string)
    {
        let matchAction = (allNone == "all") ? MatchAction.Show : MatchAction.Hide;

        for(let matcher of this.matchers)
            matcher.setMatchAction(matchAction)
    }
   
    public checkItem(item : AbstractReviewItem, state : StateManager) : MatchAction 
    {
        let hasMatched = false;
        
        for(let matcher of this.matchers)
        {
            // If any of the associated matchers says show, then show. Otherwise
            // hide. 
            switch(matcher.evaluateItem(item, state))
            {
                case MatchAction.Show:
                    return MatchAction.Show; 

                case MatchAction.Hide:
                    hasMatched = true;
                    break;

                case MatchAction.NoMatch:
                    break;
            }
        }

        // If we get here, and no matchers have matched, then no match. Otherwise
        // hide this. 
        return (hasMatched ? MatchAction.Hide : MatchAction.NoMatch);
    }
}