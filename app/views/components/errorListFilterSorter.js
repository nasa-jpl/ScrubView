"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorListFilterSorter = void 0;
const stateManager_1 = require("../stateManager");
const commentObjects_1 = require("../../types/commentObjects");
const codeError_1 = require("../../types/codeError");
const codeComment_1 = require("../../types/codeComment");
const log_1 = require("../../types/utils/log");
var SortTypes;
(function (SortTypes) {
    SortTypes[SortTypes["None"] = 0] = "None";
    SortTypes[SortTypes["ByFile"] = 1] = "ByFile";
    SortTypes[SortTypes["ByError"] = 2] = "ByError";
    SortTypes[SortTypes["ByPriority"] = 3] = "ByPriority";
    SortTypes[SortTypes["ByTool"] = 4] = "ByTool";
})(SortTypes || (SortTypes = {}));
var MatchAction;
(function (MatchAction) {
    MatchAction[MatchAction["Hide"] = 0] = "Hide";
    MatchAction[MatchAction["Show"] = 1] = "Show";
    MatchAction[MatchAction["NoMatch"] = 2] = "NoMatch";
})(MatchAction || (MatchAction = {}));
class ErrorListFilterSorter {
    constructor(state, paginator) {
        this._changingFilterStates = false;
        this._delayedUpdatePending = false;
        this._sortType = SortTypes.None;
        this._matchGroups = new Array();
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
        dispositionGroup.addMatcher(new MatchDevDisposition(commentObjects_1.DeveloperDispositions.Agree, "match-agree"));
        dispositionGroup.addMatcher(new MatchDevDisposition(commentObjects_1.DeveloperDispositions.Disagree, "match-disagree"));
        dispositionGroup.addMatcher(new MatchDevDisposition(commentObjects_1.DeveloperDispositions.Discuss, "match-discuss"));
        dispositionGroup.addMatcher(new MatchLeadDisposition(commentObjects_1.LeadDispositions.No_Action, "match-no-action"));
        dispositionGroup.addMatcher(new MatchLeadDisposition(commentObjects_1.LeadDispositions.Code_Fix_Requested, "match-code-fix"));
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
            if (this._delayedUpdatePending) {
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
        this._state.on('filter.allNone', (args) => {
            switch (args.group) {
                case "file":
                    this._fileMatchGroup.setAllNone(args.type);
                    break;
                case "file-location":
                    this._fileLocationMatchGroup.setAllNone(args.type);
                    break;
                case "errors":
                    this._errorMatchGroup.setAllNone(args.type);
                    break;
                default:
                    log_1.Log.warning(`Unknown filter group: ${args.group}`);
                    return;
            }
            this._updateFilteredList();
        });
        this._state.on('sort.changed', (sortType) => {
            switch (sortType) {
                case "none": this._sortType = SortTypes.None;
                case "file":
                    this._sortType = SortTypes.ByFile;
                    break;
                case "tool":
                    this._sortType = SortTypes.ByTool;
                    break;
                case "priority":
                    this._sortType = SortTypes.ByPriority;
                    break;
                default:
                    log_1.Log.warning(`Invalid sort type: ${sortType}.`);
                    return;
            }
            this._updateFilteredList();
        });
    }
    _onModuleChanged() {
        if (this._state.selectedBuild == null || this._state.selectedModule == null)
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
    _onFolderChanged() {
        if (this._state.selectedBuild == null || this._state.selectedModule == null)
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
    _onFileChanged(filePath) {
        if (this._state.selectedBuild == null || this._state.selectedModule == null)
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
    _updateModuleItemList() {
        var _a;
        if (this._state.selectedBuild == null || this._state.selectedModule == null || this._state.currentBrowserPath == null || ((_a = this._state.configuration) === null || _a === void 0 ? void 0 : _a.projectConfiguration.buildFolder) == null)
            return;
        let relativeDir = this._state.currentBrowserPath.replace(this._state.configuration.projectConfiguration.buildFolder, '');
        if (relativeDir.startsWith('/')) {
            relativeDir = relativeDir.substring(1);
        }
        $("#current-scope").text(` | ${relativeDir}`);
        $("#relative-directory").text(` | ${relativeDir}`);
        this._moduleList = this._state.selectedBuild.errors.getFolderReviewItemList(this._state.currentBrowserPath);
    }
    _updateFileItemList(filePath) {
        var _a;
        if (this._state.selectedBuild == null || this._state.selectedModule == null || this._state.currentBrowserPath == null || ((_a = this._state.configuration) === null || _a === void 0 ? void 0 : _a.projectConfiguration.buildFolder) == null)
            return;
        let relativeFilePath = filePath.replace(this._state.configuration.projectConfiguration.buildFolder, '');
        if (relativeFilePath.startsWith('/')) {
            relativeFilePath = relativeFilePath.substring(1);
        }
        $("#current-scope").text(` | ${relativeFilePath}`);
        this._moduleList = this._state.selectedBuild.errors.getFileReviewItemList(filePath);
    }
    _setAllMatchActions(action) {
        // Disable Filter Changed Events
        this._changingFilterStates = true;
        // Change 
        for (let group of this._matchGroups)
            for (let matcher of group.matchers)
                matcher.setMatchAction(action);
        // Re-enable Match Action Changed events
        this._changingFilterStates = false;
    }
    _onErrorFilterChanged(elementId) {
        // If we're currently changing the filter states programatically, we 
        // want to ignore these events
        if (this._changingFilterStates)
            return;
        // If 'filter-select-all' was clicked, either enable or disable all the 
        // filteres. 
        // Counterintuitively, if a box is checked, its associated filter is
        // disabled. 
        if (elementId == "select-all" || elementId == "select-none") {
            let matchAction = (elementId == "select-all") ? MatchAction.Show : MatchAction.Hide;
            this._setAllMatchActions(matchAction);
        }
        else {
            let found = false;
            // Enable or Disable the selected filter
            for (let matchGroup of this._matchGroups)
                for (let matcher of matchGroup.matchers)
                    if (matcher.elementId == elementId) {
                        log_1.Log.debug(`Toggling matcher ${matcher.elementId}`);
                        matcher.toggleMatchAction();
                        found = true;
                    }
            if (!found)
                log_1.Log.debug(`Did not find matcher for element: ${elementId}`);
        }
        // Update the Display List & Emit the Event notifying of the new display
        // list 
        this._updateFilteredList();
    }
    setModuleErrorList(moduleList) {
        this._moduleList = moduleList;
        this._updateFilteredList();
        this._updateFilterSortMenu();
    }
    setSort(sortType) {
        this._sortType = sortType;
        this._updateFilteredList();
    }
    _updateFilteredList() {
        // No error list? We're done. 
        if (this._moduleList == null) {
            return;
        }
        // Filter First
        this._filteredList = new Array();
        for (let item of this._moduleList) {
            let result = MatchAction.Show;
            // Each Match group needs to return "show", otherwise the item is 
            // hidden. Within the match groups, if any of the match criteria says
            // show, the item is shown. 
            for (let matchGroup of this._matchGroups) {
                if (matchGroup.checkItem(item, this._state) == MatchAction.Hide) {
                    result = MatchAction.Hide;
                    break;
                }
            }
            // If the result is still show, add the item to the list. 
            if (result == MatchAction.Show) {
                this._filteredList.push(item);
            }
        }
        // Sort the list
        if (this._sortType != SortTypes.None) {
            this._filteredList.sort((a, b) => {
                let naturalCompare = require("natural-compare-lite");
                // Sort by File
                if (this._sortType == SortTypes.ByFile) {
                    let rVal = naturalCompare(a.fileName.toLowerCase(), b.fileName.toLowerCase());
                    if (rVal != 0)
                        return rVal; // Different files
                    else {
                        // Files are the same, sort by line number
                        return a.lineNumber - b.lineNumber;
                    }
                }
                else if (this._sortType == SortTypes.ByTool) {
                    let rVal = naturalCompare(a.id, b.id);
                    return rVal;
                }
                else {
                    // Sort by Error Type
                    let aType = (a instanceof codeError_1.CodeError) ? a.errorType : "Comment";
                    let bType = (b instanceof codeError_1.CodeError) ? b.errorType : "Comment";
                    return naturalCompare(aType, bType);
                }
            });
        }
        // Update Display
        $("#filter-count-displayed").text(this._filteredList.length);
        $("#filter-count-total").text(this._moduleList.length);
        // Notify that the new filtered & sorted list is ready
        log_1.Log.debug(`  Module List is length: ${this._moduleList.length}. 
        Filtered list is length: ${this._filteredList.length}. 
        Sending new display list to the paginator`);
        this._paginator.loadDisplayItems(this._filteredList);
    }
    _updateFilterSortMenu() {
        if (this._moduleList == null)
            return;
        let moduleFileList = new Array();
        let moduleErrorList = new Array();
        let moduleFileLocationList = new Array();
        let toolList = new Array();
        // Traverse the module's error list to get the new files & errors
        for (let reviewItem of this._moduleList) {
            // Get the tool name
            let toolName = reviewItem.id.replace(/\d+/g, '');
            // New Tool?
            if (!toolList.includes(toolName))
                toolList.push(toolName);
            // New File?
            if (!moduleFileList.includes(reviewItem.fileName))
                moduleFileList.push(reviewItem.fileName);
            // New Error?
            if (reviewItem instanceof codeError_1.CodeError) {
                let errorType = reviewItem.formatErrorTypeForScreen();
                if (!moduleErrorList.includes(errorType))
                    moduleErrorList.push(errorType);
            }
            // New Location?
            let locationString = `${reviewItem.fileName}:${reviewItem.lineNumber}`;
            if (!moduleFileLocationList.includes(locationString))
                moduleFileLocationList.push(locationString);
        }
        // Update the Files Menu
        $("#match-group-file-list").empty();
        this._fileMatchGroup.clear();
        for (let file of moduleFileList) {
            // Add the Menu Item
            let menuElementId = this._addMenuItem("match-group-file-list", file, "file");
            this._fileMatchGroup.addMatcher(new MatchFile(menuElementId, file));
        }
        // Update the File Location Menu
        $("#match-group-file-locations-list").empty();
        this._fileLocationMatchGroup.clear();
        for (let fileLocation of moduleFileLocationList) {
            let menuElementId = this._addMenuItem("match-group-file-locations-list", fileLocation, "file-location");
            let fileName = fileLocation.split(":")[0];
            let lineNumber = fileLocation.split(":")[1];
            this._fileLocationMatchGroup.addMatcher(new MatchFileLocation(menuElementId, fileName, Number(lineNumber)));
        }
        // Update the Tools Menu
        $("#match-tools-list").empty();
        this._toolMatchGroup.clear();
        for (let tool of toolList) {
            // Add the Menu Item
            let menuElementId = this._addMenuItem("match-tools-list", tool, "findings");
            this._toolMatchGroup.addMatcher(new MatchTool(menuElementId, tool));
        }
        // Update the Errors Menu
        $("#match-group-errors-list").empty();
        this._errorMatchGroup.clear();
        for (let error of moduleErrorList) {
            // Add the Menu Item
            let menuElementId = this._addMenuItem("match-group-errors-list", error, "error");
            this._errorMatchGroup.addMatcher(new MatchError(menuElementId, error));
        }
        // Elements to Connect Events To
        // NOTE: We dont want to connect events twice to the "base" filter options
        // that dont change module to module. Doing so will call the handler multiple times
        // let elementsToConnect = "#match-group-errors-list a, #match-group-file-list a, #match-group-file-locations-list a";
        let elementsToConnect = "#match-tools-list a";
        if (!this._hasConnectedFilterEvents) {
            elementsToConnect += ", #filter-menu a";
            this._hasConnectedFilterEvents = true;
        }
        // Connect Events
        $(elementsToConnect).on("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            this._onErrorFilterChanged(e.currentTarget.id);
        });
    }
    _addMenuItem(menuParentElement, item, elementPrefix) {
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
    _replaceCharsInString(charList, replacementChar, originalString) {
        for (let char of charList) {
            let re = new RegExp(char, "g");
            originalString = originalString.replace(re, replacementChar);
        }
        return originalString;
    }
}
exports.ErrorListFilterSorter = ErrorListFilterSorter;
class AbstractMatcher {
    constructor(elementId) {
        this._elementId = elementId;
        this._currentMatchAction = MatchAction.Show;
    }
    get elementId() { return this._elementId; }
    get matchResult() { return this._currentMatchAction; }
    /**
     * Evaluates an item for display.
     * @param reviewItem The AbstractReviewItem object to test
     * @returns true if item should be displayed, false otherwise
     */
    evaluateItem(item, state) {
        // Does this item match?
        let itemMatches = this._checkMatch(item, state);
        // If the item doesnt match the criteria, we dont render a verdict
        if (!itemMatches)
            return MatchAction.NoMatch;
        else
            // Otherwise, we return hide or show depending on the state of the 
            // associated checkbox in the Filter menu
            return this._currentMatchAction;
    }
    setMatchAction(newAction) {
        this._currentMatchAction = newAction;
        // Update the Menu
        $("#" + this.elementId).removeClass("active");
        $("#" + this.elementId).removeClass("inactive");
        if (this._currentMatchAction == MatchAction.Show)
            $("#" + this.elementId).addClass("active");
        else
            $("#" + this.elementId).addClass("inactive");
        // Debug
        log_1.Log.debug(`Setting ${this._elementId} to ${this._currentMatchAction}`);
    }
    toggleMatchAction() {
        // If the display box is checked, we want to include results which match
        // this filter. If the box is unchecked, we want to remove them. 
        this.setMatchAction(this._currentMatchAction == MatchAction.Show ? MatchAction.Hide : MatchAction.Show);
    }
}
/**
 * Filter To Go and Filter Complete
 * Work to go is defined by the current mode. In Disposition mode
 * anything without a dev disposition is to go. In Review mode anything
 * without a lead disposition is to go. FilterComplete is the opposite of this.
 */
class MatchToGo extends AbstractMatcher {
    _checkMatch(reviewItem, state) {
        // Work to go is defined by the current mode. In Disposition mode
        // anything without a dev disposition is to go. In Review mode 
        // anything without a lead disposition is to go. 
        if (state.displayMode == stateManager_1.DisplayMode.Disposition) {
            return !reviewItem.hasDeveloperDisposition;
        }
        else {
            return !reviewItem.hasLeadDisposition;
        }
    }
}
class MatchComplete extends MatchToGo {
    _checkMatch(reviewItem, state) {
        return !super._checkMatch(reviewItem, state);
    }
}
class MatchDevDisposition extends AbstractMatcher {
    constructor(disposition, elementId) {
        super(elementId);
        this._disposition = disposition;
    }
    _checkMatch(reviewItem, state) {
        return (reviewItem.devDisposition == this._disposition);
    }
}
class MatchLeadDisposition extends AbstractMatcher {
    constructor(disposition, elementId) {
        super(elementId);
        this._disposition = disposition;
    }
    _checkMatch(reviewItem, state) {
        return (reviewItem.leadDisposition == this._disposition);
    }
}
class MatchErrors extends AbstractMatcher {
    _checkMatch(reviewItem, state) {
        return (reviewItem instanceof codeError_1.CodeError);
    }
}
class MatchComments extends AbstractMatcher {
    _checkMatch(reviewItem, state) {
        return (reviewItem instanceof codeComment_1.CodeComment);
    }
}
class MatchFile extends AbstractMatcher {
    constructor(elementId, fileName) {
        super(elementId);
        this._fileName = fileName;
    }
    _checkMatch(reviewItem, state) {
        return reviewItem.fileName == this._fileName;
    }
}
class MatchFileLocation extends AbstractMatcher {
    constructor(elementId, fileName, lineNumber) {
        super(elementId);
        this._fileName = fileName;
        this._lineNumber = lineNumber;
    }
    _checkMatch(reviewItem, state) {
        return (reviewItem.fileName == this._fileName && reviewItem.lineNumber == this._lineNumber);
    }
}
class MatchError extends AbstractMatcher {
    constructor(elementId, errorType) {
        super(elementId);
        this._errorType = errorType;
    }
    _checkMatch(reviewItem, state) {
        if (reviewItem instanceof codeError_1.CodeError)
            return reviewItem.formatErrorTypeForScreen() == this._errorType;
        else
            return false;
    }
}
class MatchTool extends AbstractMatcher {
    constructor(elementId, toolName) {
        super(elementId);
        this._toolName = toolName;
    }
    _checkMatch(reviewItem, state) {
        // Check to see if the tool matches
        if (reviewItem.id.startsWith(this._toolName))
            return true;
        else
            return false;
    }
}
/**
 * MatchGroup
 */
class MatchGroup {
    constructor() {
        this.matchers = new Array();
    }
    addMatcher(matcher) {
        this.matchers.push(matcher);
    }
    clear() {
        this.matchers = new Array();
    }
    setAllNone(allNone) {
        let matchAction = (allNone == "all") ? MatchAction.Show : MatchAction.Hide;
        for (let matcher of this.matchers)
            matcher.setMatchAction(matchAction);
    }
    checkItem(item, state) {
        let hasMatched = false;
        for (let matcher of this.matchers) {
            // If any of the associated matchers says show, then show. Otherwise
            // hide. 
            switch (matcher.evaluateItem(item, state)) {
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
//# sourceMappingURL=errorListFilterSorter.js.map