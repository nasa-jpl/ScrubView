"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleListComponent = void 0;
const abstractComponent_1 = require("./abstractComponent");
const stateManager_1 = require("../stateManager");
class ModuleListComponent extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "ModuleList");
        this.moduleList = null;
        // Subscribe to the onModuleClicked event, which indicates a user has 
        // clicked on a module. 
        this.eventSubscribe("onModuleClicked", (arg) => {
            this._state.setSelectedModule(arg);
        });
        // This event is triggered by the setSelectedModule above, but signifies
        // that the selected module changed.
        this.eventSubscribe("onModuleChanged", (arg) => {
            this.render();
        });
        // Subscribe to the onBuildChanged event which indicates that a new
        // build has been parsed, and the module list is available. 
        this.eventSubscribe("onBuildChanged", (arg) => {
            this.render();
        });
        this.eventSubscribe("onDisplayModeChanged", (displayMode) => {
            this.render();
        });
    }
    render() {
        // Clear the component
        this.loadTemplateToParent();
        // If there's no build selected, disable the dropdown and return
        if (this._state.selectedBuild == null) {
            $("#menu-module-parent").addClass("disabled");
            return;
        }
        // If We're in Review Mode - Disable
        //TODO FIX THIS
        if (this._state.displayMode == stateManager_1.DisplayMode.Review) {
            console.debug("DISABLING");
            $("#menu-module-parent").addClass("disabled");
        }
        else {
            console.debug("ENABLING");
            $("#menu-module-parent").removeClass("disabled");
        }
        // Set the Current Module Name
        if (this._state.selectedModule != null) {
            $("#menu-module-parent").text(this._state.selectedModule);
        }
        else {
            $("#menu-module-parent").text("Select Module");
        }
        let listParent = $("#menu-modulelist");
        listParent.empty();
        // For each module, create a menu item 
        for (let module of this._state.selectedBuild.modules) {
            // Get the error count for the module
            let moduleErrorList = this._state.selectedBuild.errors.getModuleReviewItemList(module);
            let errorBadgeStyle = moduleErrorList.length == 0 ? "badge-dark" : "badge-warning";
            // Create the menu item
            //listParent.append(`<a class="menu-item" onclick="view.routeEvent('onModuleClicked', '${module}'>${module} <span class="badge ${errorBadgeStyle}">${moduleErrorList.length}</span></a>`);
            listParent.append(`<a class="menu-item" onclick="view.routeEvent('onModuleClicked', '${module}')">${module} <span class="badge ${errorBadgeStyle}">${moduleErrorList.length}</span></a>`);
        }
    }
}
exports.ModuleListComponent = ModuleListComponent;
//# sourceMappingURL=moduleList.js.map