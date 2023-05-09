"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeSelector = void 0;
const abstractComponent_1 = require("./abstractComponent");
const stateManager_1 = require("../stateManager");
const reviewManager_1 = require("../../types/reviewManager");
const errorModalDialog_1 = require("./errorModalDialog");
const log_1 = require("../../types/utils/log");
class ModeSelector extends abstractComponent_1.AbstractComponent {
    constructor(state) {
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
    render() {
        this.loadTemplateToParent();
        if (this._state.displayMode == stateManager_1.DisplayMode.Disposition) {
            $("#mode-button").text("Disposition Mode");
            $("#mode-button").addClass("btn-primary");
            $("#mode-button").removeClass("btn-warning");
            $("#review-complete-button").css('visibility', 'hidden');
            $("#previous-review-warning").css("visibility", "hidden");
        }
        else {
            $("#mode-button").text("Review Mode");
            $("#mode-button").removeClass("btn-primary");
            $("#mode-button").addClass("btn-warning");
            $("#review-complete-button").css('visibility', 'visible');
            // Does the currently selected module already have a review? If so
            // show the warning
            if (this._state.currentModuleHasReview()) {
                $("#previous-review-warning").css("visibility", "visible");
            }
        }
    }
    toggleModeClicked() {
        let newMode = this._state.displayMode == stateManager_1.DisplayMode.Disposition ? stateManager_1.DisplayMode.Review : stateManager_1.DisplayMode.Disposition;
        // Only switch into Review Mode if we have a build & module selected
        if ((this._state.selectedBuild == null || this._state.selectedModule == null) && newMode == stateManager_1.DisplayMode.Review) {
            return;
        }
        this._state.setDisplayMode(newMode);
    }
    reviewCompleteClicked() {
        if (this._state.selectedBuild == null || this._state.selectedModule == null || this._state.users == null) {
            return;
        }
        let errorList = this._state.selectedBuild.errors.getModuleReviewItemList(this._state.selectedModule);
        let result = this._state.selectedBuild.reviewManager.reviewComplete(this._state.selectedModule, errorList, this._state.users);
        if (result == reviewManager_1.ReviewCompleteStatus.AllErrorsNotDispositioned) {
            log_1.Log.error("Not all parameters were dispositioned");
            errorModalDialog_1.ErrorModalDialog.show("Error", `There are currently unresolved errors which need lead dispositions before completeting this review.`);
            return;
        }
        else if (result == reviewManager_1.ReviewCompleteStatus.Ok) {
            // Notify
            errorModalDialog_1.ErrorModalDialog.show("Review Complete", `Review of Module ${this._state.selectedModule} is now complete. An email was sent to all participants detailing required actions.`);
            // Set Mode Back to Developer
            this._state.setDisplayMode(stateManager_1.DisplayMode.Disposition);
            return;
        }
        else {
            errorModalDialog_1.ErrorModalDialog.show("Error Completing Review", `Unexpected error completing the review: ${result}`);
        }
    }
}
exports.ModeSelector = ModeSelector;
//# sourceMappingURL=modeSelector.js.map