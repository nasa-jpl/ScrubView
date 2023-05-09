import { AbstractComponent } from "./abstractComponent";
import { StateManager, DisplayMode } from "../stateManager";
import { ReviewCompleteStatus } from "../../types/reviewManager"
import { ErrorModalDialog } from "./errorModalDialog";
import { Log } from "../../types/utils/log";

export class ModeSelector extends AbstractComponent
{
    constructor(state : StateManager)
    {
        super(state, "ModeSelector");

        this.eventSubscribe("onModeToggleClicked", () => {
            this.toggleModeClicked();
        });

        this.eventSubscribe("onReviewCompleteClicked", () => {
            this.reviewCompleteClicked();
        });

        this.eventSubscribe("onDisplayModeChanged", () => {
            this.render();
        });
    }

    public render()
    {
        this.loadTemplateToParent();

        if(this._state.displayMode == DisplayMode.Disposition)
        {
            $("#mode-button").text("Disposition Mode");
            $("#mode-button").addClass("btn-primary");
            $("#mode-button").removeClass("btn-warning");
            $("#review-complete-button").css('visibility', 'hidden');
            $("#previous-review-warning").css("visibility", "hidden");
        }
        else
        {
            $("#mode-button").text("Review Mode");
            $("#mode-button").removeClass("btn-primary");
            $("#mode-button").addClass("btn-warning");
            $("#review-complete-button").css('visibility', 'visible');

            // Does the currently selected module already have a review? If so
            // show the warning
            if(this._state.currentModuleHasReview())
            {
                $("#previous-review-warning").css("visibility", "visible");
            }
        }
    }

    private toggleModeClicked()
    {
        let newMode = this._state.displayMode == DisplayMode.Disposition ? DisplayMode.Review : DisplayMode.Disposition;

        // Only switch into Review Mode if we have a build & module selected
        if((this._state.selectedBuild == null || this._state.selectedModule == null) && newMode == DisplayMode.Review) {
            return;
        }

        this._state.setDisplayMode(newMode);
    }

    private reviewCompleteClicked()
    {
        if(this._state.selectedBuild == null || this._state.selectedModule == null || this._state.users == null) {
            return;
        }

        let errorList = this._state.selectedBuild.errors.getModuleReviewItemList(this._state.selectedModule);
        let result = this._state.selectedBuild.reviewManager.reviewComplete(this._state.selectedModule, errorList, this._state.users);


        if(result == ReviewCompleteStatus.AllErrorsNotDispositioned)
        {
            Log.error("Not all parameters were dispositioned");
            ErrorModalDialog.show("Error", `There are currently unresolved errors which need lead dispositions before completeting this review.`);
            return;
        }
        else if(result == ReviewCompleteStatus.Ok)
        {
            // Notify
            ErrorModalDialog.show("Review Complete", `Review of Module ${this._state.selectedModule} is now complete. An email was sent to all participants detailing required actions.`);

            // Set Mode Back to Developer
            this._state.setDisplayMode(DisplayMode.Disposition);
            return;
        }
        else
        {
            ErrorModalDialog.show("Error Completing Review", `Unexpected error completing the review: ${result}`);
        }

    }
}