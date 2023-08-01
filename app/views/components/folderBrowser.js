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
exports.FolderBrowserComponent = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const abstractComponent_1 = require("./abstractComponent");
const log_1 = require("../../types/utils/log");
const loadingModalDialog_1 = require("./loadingModalDialog");
let $ = require('jquery');
let paddingLength = 30;
class FolderBrowserComponent extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "FolderBrowser");
        // Subscribe to onModuleChanged
        this.eventSubscribe('onModuleChanged', () => {
            this.render();
        });
        // Subscribe to onFolderClicked
        this.eventSubscribe("onFolderClicked", (folder) => {
            if (this._state.currentBrowserPath == null) {
                log_1.Log.error('Unable to find current working directory.');
                return;
            }
            let browserPath = '';
            if (folder == '..') {
                browserPath = path.dirname(this._state.currentBrowserPath);
            }
            else {
                browserPath = path.join(this._state.currentBrowserPath, folder);
            }
            this._state.setCurrentBrowserPath(browserPath);
            // Render results and display loading screen
            loadingModalDialog_1.LoadingModalDialog.show("Loading sub-directory results...", this.render.bind(this), true);
        });
    }
    render() {
        // Clear the parent object of all child elements
        this.loadTemplateToParent();
        // If the current state is such that we dont have everyting we need to 
        // continue. Stop. 
        if (this._state.selectedBuild == null ||
            this._state.selectedModule == null ||
            this._state.configuration == null) {
            return;
        }
        // Get the Path for the current build
        let buildSettings = this._state.configuration.getBuildSettings(this._state.selectedBuild.name);
        if (buildSettings == null || buildSettings.buildFolder == undefined) {
            log_1.Log.error(`Unable to get build settings for build name: ${this._state.selectedBuild.name}`);
            return;
        }
        if (this._state.currentBrowserPath == null) {
            log_1.Log.error('Unable to find current working directory.');
            return;
        }
        let modulePath = this._state.currentBrowserPath;
        let ignoreList = [
            ".svn",
            "wsts-wsts",
            "wsts-vxsim",
            "ac_dep",
            "linux-linux",
            "flight-vxworks",
            ".o"
        ];
        // Add the Parent Folder
        $("#file-list").empty();
        this.addFolderToParent($("#file-list"), modulePath, ignoreList, false);
        // Hide the loading screen
        loadingModalDialog_1.LoadingModalDialog.hide();
    }
    addFolderToParent(parentElement, folderPath, ignoreList, nested) {
        var _a;
        // Read the Folder Files
        let folderItems = fs.readdirSync(folderPath);
        folderItems = folderItems.sort();
        let fileList = [];
        let folderList = [];
        for (let file of folderItems) {
            // Filter Ignored Files
            let skipFile = false;
            for (let ignoreFilter of ignoreList) {
                if (file.includes(ignoreFilter)) {
                    skipFile = true;
                    break;
                }
            }
            if (skipFile || file.startsWith(".")) {
                continue;
            }
            let fullPath = path.join(folderPath, file);
            if (fs.lstatSync(fullPath).isDirectory()) {
                folderList.push(file);
            }
            else {
                fileList.push(file);
            }
        }
        // Add a diretory up navigation option, if applicable
        if (this._state.currentBrowserPath != ((_a = this._state.selectedBuild) === null || _a === void 0 ? void 0 : _a.codePath)) {
            folderList.unshift('..');
        }
        if (this._state.selectedBuild == null) {
            return;
        }
        // Append the <ul>
        let folderListElement = $("<ul></ul>");
        if (nested) {
            folderListElement = folderListElement.addClass("nested");
        }
        // Load the Folders First
        // NOTE: This is recursive 
        for (let folder of folderList) {
            // Get the error count for the folder
            let folderErrorList = this._state.selectedBuild.errors.getFolderReviewItemList(path.join(folderPath, folder));
            let errorBadgeStyle = folderErrorList.length == 0 ? "badge-dark" : "badge-warning";
            // Construct the badge
            let badgeStyling = '';
            if (folder !== '..') {
                badgeStyling = `<span class="badge ${errorBadgeStyle}">${folderErrorList.length}</span>`;
            }
            // Add the folder to the list
            let newFolderElement = $(`<li><span style="display:flex;align-items: center;" ondblclick='view.routeEvent("onFolderClicked", "${folder}")'>${folder}  ${badgeStyling}</span></li>`);
            folderListElement.append(newFolderElement);
        }
        loadingModalDialog_1.LoadingModalDialog.updateProgress(50);
        // Then the Files
        for (let file of fileList) {
            // Get the file path
            let filePath = path.join(folderPath, file);
            // Get the error count for the folder
            let fileErrorList = this._state.selectedBuild.errors.getFileReviewItemList(filePath);
            let errorBadgeStyle = fileErrorList.length == 0 ? "badge-dark" : "badge-warning";
            // Add the file to the list
            folderListElement.append(`<li style="display:flex;align-items: center;" ondblclick='view.routeEvent("onFileClicked", "${filePath}")'><img height="24px" width="24px" src="${this.getImagePath(filePath)}"><span class="svg-file" style="padding-right: 4px;"></span>${file}  <span class="badge ${errorBadgeStyle}">${fileErrorList.length}</span></li>`);
        }
        parentElement.append(folderListElement);
        loadingModalDialog_1.LoadingModalDialog.updateProgress(100);
    }
    getImagePath(filePath) {
        // Icons from here:
        // https://www.iconfinder.com/search/?q=iconset%3Ahawcons
        let extension = path.extname(filePath).substring(1);
        let iconName;
        switch (extension) {
            case "c":
                iconName = "file-c.png";
                break;
            case "h":
                iconName = "file-h.png";
                break;
            case "cpp":
                iconName = "file-cpp.png";
                break;
            case "xml":
                iconName = "file-xml.png";
                break;
            default:
                iconName = "file-grey.png";
                break;
        }
        return path.join("img", iconName);
    }
}
exports.FolderBrowserComponent = FolderBrowserComponent;
//# sourceMappingURL=folderBrowser.js.map