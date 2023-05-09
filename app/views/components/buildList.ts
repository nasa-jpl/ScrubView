import {AbstractComponent} from "./abstractComponent"
import {StateManager, DisplayMode} from "../stateManager";

export class BuildListComponent extends AbstractComponent
{
    constructor(state : StateManager)
    {
        super(state, "BuildList");

        this.eventSubscribe("onBuildChanged", () => {
            this.render();
        });

        // Subscribe to the onBuildListsUpdated event
        this.eventSubscribe("onBuildListChanged", ()=>{
            this.render();
        });

        this.eventSubscribe("onDisplayModeChanged", () => {
            this.render();
        });
    }

    public render()
    {
        if(this._displayElement == null){
            return;
        }
        
        // Add the Template to the Parent Object
        this.loadTemplateToParent();

        // If we've selected a build, disable it (changing teh build after 
        // selection currently results in errors).
        if(this._state.selectedBuild != null) {
            $("#menu-build-parent").addClass("disabled");
        } else {
            $("#menu-build-parent").removeClass("disabled");
        }

        // Set the Build Title
        if(this._state.selectedBuild == null) {
            $("#menu-build-parent").text("Select Build");
        }
        else {
            $("#menu-build-parent").text(this._state.selectedBuild.name);
        }

        if(this._state.buildList == null) {
            return;
        }

        // Find the build List Items DOM object
        let buildListItemsParent = $("#menu-buildlist");
        buildListItemsParent.empty();

        // Set the List
        for(let buildInfo of this._state.buildList)
        {
            let badgeText = "";
            if(buildInfo.badgeText != undefined)
            {
                let badgeType = buildInfo.badgeType == undefined ? "info" : buildInfo.badgeType;
                badgeText = `<span class="badge badge-${badgeType}">${buildInfo.badgeText}</span>`
            }

            buildListItemsParent.append(`<a class="menu-item" onclick="view.routeEvent('onBuildClicked', '${buildInfo.name}')">${buildInfo.name} ${badgeText}</a>`);
        }
    }
}