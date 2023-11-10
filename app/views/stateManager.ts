import { EventEmitter } from "events";
import { Configuration, BuildInfo } from "../types/utils/configuration";
import { Build } from "../types/buildParser";
import { UserCollection } from "../types/userCollection";
import { Log } from "../types/utils/log"
import { AbstractReviewItem } from "../types/abstractReviewItem";
import { CodeMetrics } from "../types/codeMetrics";

export enum DisplayMode {
    Disposition,
    Review
}

/**
 * State Manager
 * Manges overall state for the application, as well as routing events between 
 * components
 */
export class StateManager extends EventEmitter
{
    private _configuration : Configuration | null;
    private _buildList : Array<BuildInfo> | null;
    private _users : UserCollection | null;
    private _displayMode : DisplayMode;
    private _metricsList : Array<CodeMetrics> | null;

    private _selectedBuild : Build | null;
    private _selectedModule : string | null;
    private _selectedError : AbstractReviewItem | null;
    private _selectedPathIndex : number | null;
    private _currentBrowserPath : string | null;
    
    get configuration() : Configuration | null {return this._configuration;}
    get buildList() : Array<BuildInfo> | null {return this._buildList; }
    get metricsList() : Array<CodeMetrics> | null {return this._metricsList; }
    get users() : UserCollection | null { return this._users; }
    get displayMode() : DisplayMode { return this._displayMode; }

    get selectedBuild() : Build | null {return this._selectedBuild; }
    get selectedModule() : string | null {return this._selectedModule;}
    get selectedError() : AbstractReviewItem | null {return this._selectedError; }
    get selectedPathIndex() : Number | null { return this._selectedPathIndex; }
    get currentBrowserPath() : string | null {return this._currentBrowserPath; }

    constructor()
    {
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

    public setConfiguration(newConfiguration : Configuration)
    {
        this._configuration = newConfiguration;
        this.emit("onConfigurationChanged", this._configuration);
    }

    public setBuildList(buildList : Array<BuildInfo>)
    {
        this._buildList = buildList;
        Log.debug("Build List Changed");
        this.emit("onBuildListChanged", this._buildList);
    }

    public setMetricsTable(metricsList : Array<CodeMetrics>)
    {
        this._metricsList = metricsList;
        // this.emit("onMetricsRequested", this._metricsList)
    }

    public setUserCollection(userCollection : UserCollection)
    {
        this._users = userCollection;
    }

    public setSelectedBuild(newBuild : Build)
    {
        // Emit the events
        this._selectedBuild = newBuild;
        Log.debug(`Selected Build Changed to ${newBuild.name}`);
        this.emit("onBuildChanged", this._selectedBuild);
        
        // When setting the build, we also want to clear the current module
        // since builds may have different module lists
        // this.setSelectedModule(null);
        
        this.setCurrentBrowserPath(newBuild.codePath);
        this.setSelectedModule(newBuild.codePath);
    }

    public setSelectedModule(newModule : string | null)
    {
        // Emit the events
        this._selectedModule = newModule;
        Log.debug(`Selected Module Changed to ${newModule}`);
        this.emit("onModuleChanged", this._selectedModule);

        // When setting the module, we also want to clear the current filename
        // and the current error
        this.setSelectedError(null);
    }

    public setSelectedError(error : AbstractReviewItem | null)
    {
        // State State & Emit Events
        let oldError = this._selectedError;
        this._selectedError = error;

        // Before emitting the event, make sure its a new error
        if(oldError != this._selectedError)
        {
            Log.debug(`Selected Error Changed To ${error}`);
            this.emit("onErrorChanged", this._selectedError);
        }
    }

    public setDisplayMode(newDisplayMode : DisplayMode)
    {
        this._displayMode = newDisplayMode;
        Log.debug(`Display Mode Changed to ${newDisplayMode}`);
        this.emit("onDisplayModeChanged", this._displayMode);
    }

    public setSelectedPathIndex(newIndex : number)
    {
        this._selectedPathIndex = newIndex;
        Log.debug(`Set Selected Path Index to ${newIndex}`);
        this.emit("onSelectedPathIndexChanged", this._selectedPathIndex);
    }

    public setCurrentBrowserPath(newPath : string)
    {
        this._currentBrowserPath = newPath;
        Log.debug(`Set New Browser Path to ${newPath}`);
        this.emit("onCurrentBrowserPathChanged", this._currentBrowserPath);
    }

    public currentModuleHasReview() : boolean 
    {
        if(this._selectedModule != null && 
           this._selectedBuild != null)
        {
           return this._selectedBuild.reviewManager.checkReviewedStatus(this._selectedModule);
        }
        else 
        {
            return false;
        }
    }

}