import * as fs from "fs"
import * as path from "path"
import {AbstractComponent} from "./abstractComponent"
import { StateManager } from "../stateManager";
import { Log } from "../../types/utils/log";
import { LoadingModalDialog } from './loadingModalDialog';
import * as view from "../mainWindow"
import { dialog } from "electron";
let $ = require('jquery');

let paddingLength = 30;

export class FolderBrowserComponent extends AbstractComponent
{

    constructor(state : StateManager)
    {
        super(state, "FolderBrowser");

        // Subscribe to onModuleChanged
        this.eventSubscribe('onModuleChanged', () => {
            this.render();
        });

        // Subscribe to onFolderClicked
        this.eventSubscribe("onFolderClicked", (folder) => {
            if(this._state.currentBrowserPath == null){
                Log.error('Unable to find current working directory.');
                return;
            }

            let browserPath = '';
            if(folder == '..') {
                browserPath = path.dirname(this._state.currentBrowserPath);
            }
            else {
                browserPath = path.join(this._state.currentBrowserPath, folder);
            }
                
            this._state.setCurrentBrowserPath(browserPath);

            // Render results and display loading screen
            LoadingModalDialog.show("Loading sub-directory results...", this.render.bind(this), true);

        });
    }

    public render() : void
    {
        // Clear the parent object of all child elements
        this.loadTemplateToParent();

        // If the current state is such that we dont have everyting we need to 
        // continue. Stop. 
        if(this._state.selectedBuild == null || 
           this._state.selectedModule == null || 
           this._state.configuration == null) {
            return;
        }

        // Get the Path for the current build
        let buildSettings = this._state.configuration.getBuildSettings(this._state.selectedBuild.name);

        if(buildSettings == null || buildSettings.buildFolder == undefined){
            Log.error(`Unable to get build settings for build name: ${this._state.selectedBuild.name}`);
            return;
        }

        if(this._state.currentBrowserPath == null){
            Log.error('Unable to find current working directory.');
            return;
        }


        let modulePath = this._state.currentBrowserPath;

        let ignoreList = 
        [
            ".svn",
            "wsts-wsts",
            "wsts-vxsim",
            "ac_dep",
            "linux-linux",
            "flight-vxworks",
            ".o"
        ]

        // Add the Parent Folder
        $("#file-list").empty();
        this.addFolderToParent($("#file-list"), modulePath, ignoreList, false);

        // Hide the loading screen
        LoadingModalDialog.hide();        
    }

    private addFolderToParent(parentElement : JQuery, folderPath : string, ignoreList : string[], nested : boolean)
    {
        // Read the Folder Files
        let folderItems = fs.readdirSync(folderPath);
        folderItems = folderItems.sort();

        let fileList : string[] = [];
        let folderList : string[] = [];

        for(let file of folderItems)
        {
            // Filter Ignored Files
            let skipFile = false;
            for (let ignoreFilter of ignoreList) {
                if(file.includes(ignoreFilter)) {
                    skipFile = true;
                    break;
                }
            }

            if(skipFile || file.startsWith(".")) {
                continue;
            }

            let fullPath = path.join(folderPath, file);
            if(fs.lstatSync(fullPath).isDirectory())
            {
                folderList.push(file);
            }
            else
            {
                fileList.push(file)
            }
        }

        // Add a diretory up navigation option, if applicable
        if(this._state.currentBrowserPath != this._state.selectedBuild?.codePath) {
            folderList.unshift('..');
        }

        if(this._state.selectedBuild == null) {
            return;
        }        

        // Append the <ul>
        let folderListElement = $("<ul></ul>");
        if(nested) {
            folderListElement = folderListElement.addClass("nested");
        }

        // Load the Folders First
        // NOTE: This is recursive 
        for(let folder of folderList) {

            // Get the error count for the folder
            let folderErrorList = this._state.selectedBuild.errors.getFolderReviewItemList(path.join(folderPath, folder));
            let errorBadgeStyle = folderErrorList.length == 0 ? "badge-dark" : "badge-warning";

            // Construct the badge
            let badgeStyling = '';
            if(folder !== '..') {
                badgeStyling = `<span class="badge ${errorBadgeStyle}">${folderErrorList.length}</span>`;
            }

            // Add the folder to the list
            let newFolderElement = $(`<li><span style="display:flex;align-items: center;" ondblclick='view.routeEvent("onFolderClicked", "${folder}")'>${folder}  ${badgeStyling}</span></li>`);
            folderListElement.append(newFolderElement);

        }

        LoadingModalDialog.updateProgress(50);

        // Then the Files
        for(let file of fileList) {
            // Get the file path
            let filePath = path.join(folderPath, file);

            // Get the error count for the folder
            let fileErrorList = this._state.selectedBuild.errors.getFileReviewItemList(filePath);
            let errorBadgeStyle = fileErrorList.length == 0 ? "badge-dark" : "badge-warning";

            // Add the file to the list
            folderListElement.append(`<li style="display:flex;align-items: center;" ondblclick='view.routeEvent("onFileClicked", "${filePath}")'><img height="24px" width="24px" src="${this.getImagePath(filePath)}"><span class="svg-file" style="padding-right: 4px;"></span>${file}  <span class="badge ${errorBadgeStyle}">${fileErrorList.length}</span></li>`);
        }

        parentElement.append(folderListElement);

        LoadingModalDialog.updateProgress(100);

    }

    private getImagePath(filePath : string) : string 
    {
        // Icons from here:
        // https://www.iconfinder.com/search/?q=iconset%3Ahawcons

        let extension = path.extname(filePath).substring(1);
        let iconName;

        switch(extension)
        {
            case "c":   iconName = "file-c.png"; break;
            case "h":   iconName = "file-h.png"; break;
            case "cpp": iconName = "file-cpp.png"; break;
            case "xml": iconName = "file-xml.png"; break;

            default: iconName = "file-grey.png"; break;
        }

        return path.join("img", iconName);
    }

}