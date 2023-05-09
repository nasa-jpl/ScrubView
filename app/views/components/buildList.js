"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildListComponent = void 0;
const abstractComponent_1 = require("./abstractComponent");
class BuildListComponent extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "BuildList");
        this.eventSubscribe("onBuildChanged", () => {
            this.render();
        });
        // Subscribe to the onBuildListsUpdated event
        this.eventSubscribe("onBuildListChanged", () => {
            this.render();
        });
        this.eventSubscribe("onDisplayModeChanged", () => {
            this.render();
        });
    }
    render() {
        if (this._displayElement == null) {
            return;
        }
        // Add the Template to the Parent Object
        this.loadTemplateToParent();
        // If we've selected a build, disable it (changing teh build after 
        // selection currently results in errors).
        if (this._state.selectedBuild != null) {
            $("#menu-build-parent").addClass("disabled");
        }
        else {
            $("#menu-build-parent").removeClass("disabled");
        }
        // Set the Build Title
        if (this._state.selectedBuild == null) {
            $("#menu-build-parent").text("Select Build");
        }
        else {
            $("#menu-build-parent").text(this._state.selectedBuild.name);
        }
        if (this._state.buildList == null) {
            return;
        }
        // Find the build List Items DOM object
        let buildListItemsParent = $("#menu-buildlist");
        buildListItemsParent.empty();
        // Set the List
        for (let buildInfo of this._state.buildList) {
            let badgeText = "";
            if (buildInfo.badgeText != undefined) {
                let badgeType = buildInfo.badgeType == undefined ? "info" : buildInfo.badgeType;
                badgeText = `<span class="badge badge-${badgeType}">${buildInfo.badgeText}</span>`;
            }
            buildListItemsParent.append(`<a class="menu-item" onclick="view.routeEvent('onBuildClicked', '${buildInfo.name}')">${buildInfo.name} ${badgeText}</a>`);
        }
    }
}
exports.BuildListComponent = BuildListComponent;
//# sourceMappingURL=buildList.js.map