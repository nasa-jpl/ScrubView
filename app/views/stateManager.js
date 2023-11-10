"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = exports.DisplayMode = void 0;
const events_1 = require("events");
const log_1 = require("../types/utils/log");
var DisplayMode;
(function (DisplayMode) {
    DisplayMode[DisplayMode["Disposition"] = 0] = "Disposition";
    DisplayMode[DisplayMode["Review"] = 1] = "Review";
})(DisplayMode = exports.DisplayMode || (exports.DisplayMode = {}));
/**
 * State Manager
 * Manges overall state for the application, as well as routing events between
 * components
 */
class StateManager extends events_1.EventEmitter {
    constructor() {
        super();
        this._displayMode = DisplayMode.Disposition;
        this._configuration = null;
        this._users = null;
        this._buildList = null;
        this._selectedBuild = null;
        this._selectedModule = null;
        this._selectedError = null;
        this._selectedPathIndex = null;
        this._currentBrowserPath = null;
        this._metricsList = null;
        // Each Error tile will listen for the onErrorClicked event, so
        // this needs to be sized for the maximum number of errors a module
        // could conceivably have. 
        this.setMaxListeners(500);
    }
    get configuration() { return this._configuration; }
    get buildList() { return this._buildList; }
    get metricsList() { return this._metricsList; }
    get users() { return this._users; }
    get displayMode() { return this._displayMode; }
    get selectedBuild() { return this._selectedBuild; }
    get selectedModule() { return this._selectedModule; }
    get selectedError() { return this._selectedError; }
    get selectedPathIndex() { return this._selectedPathIndex; }
    get currentBrowserPath() { return this._currentBrowserPath; }
    setConfiguration(newConfiguration) {
        this._configuration = newConfiguration;
        this.emit("onConfigurationChanged", this._configuration);
    }
    setBuildList(buildList) {
        this._buildList = buildList;
        log_1.Log.debug("Build List Changed");
        this.emit("onBuildListChanged", this._buildList);
    }
    setMetricsTable(metricsList) {
        this._metricsList = metricsList;
        // this.emit("onMetricsRequested", this._metricsList)
    }
    setUserCollection(userCollection) {
        this._users = userCollection;
    }
    setSelectedBuild(newBuild) {
        // Emit the events
        this._selectedBuild = newBuild;
        log_1.Log.debug(`Selected Build Changed to ${newBuild.name}`);
        this.emit("onBuildChanged", this._selectedBuild);
        // When setting the build, we also want to clear the current module
        // since builds may have different module lists
        // this.setSelectedModule(null);
        this.setCurrentBrowserPath(newBuild.codePath);
        this.setSelectedModule(newBuild.codePath);
    }
    setSelectedModule(newModule) {
        // Emit the events
        this._selectedModule = newModule;
        log_1.Log.debug(`Selected Module Changed to ${newModule}`);
        this.emit("onModuleChanged", this._selectedModule);
        // When setting the module, we also want to clear the current filename
        // and the current error
        this.setSelectedError(null);
    }
    setSelectedError(error) {
        // State State & Emit Events
        let oldError = this._selectedError;
        this._selectedError = error;
        // Before emitting the event, make sure its a new error
        if (oldError != this._selectedError) {
            log_1.Log.debug(`Selected Error Changed To ${error}`);
            this.emit("onErrorChanged", this._selectedError);
        }
    }
    setDisplayMode(newDisplayMode) {
        this._displayMode = newDisplayMode;
        log_1.Log.debug(`Display Mode Changed to ${newDisplayMode}`);
        this.emit("onDisplayModeChanged", this._displayMode);
    }
    setSelectedPathIndex(newIndex) {
        this._selectedPathIndex = newIndex;
        log_1.Log.debug(`Set Selected Path Index to ${newIndex}`);
        this.emit("onSelectedPathIndexChanged", this._selectedPathIndex);
    }
    setCurrentBrowserPath(newPath) {
        this._currentBrowserPath = newPath;
        log_1.Log.debug(`Set New Browser Path to ${newPath}`);
        this.emit("onCurrentBrowserPathChanged", this._currentBrowserPath);
    }
    currentModuleHasReview() {
        if (this._selectedModule != null &&
            this._selectedBuild != null) {
            return this._selectedBuild.reviewManager.checkReviewedStatus(this._selectedModule);
        }
        else {
            return false;
        }
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=stateManager.js.map