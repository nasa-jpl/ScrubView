"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChoiceModalDialog = void 0;
const abstractComponent_1 = require("./abstractComponent");
class ChoiceModalDialog extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "ChoiceModalDialog");
        ChoiceModalDialog.singleton = this;
        this.callback = null;
        // Connect to the Event 
        this.eventSubscribe("onChoiceModalSelect", (selection) => {
            this.optionSelected(selection);
        });
    }
    render() {
        // Everything is done in show()
    }
    /**
     * Shows choice modal dialog, Blocks until the user has made a selection
     * @param title Dialog title
     * @param message Dialog Message
     * @param choices An array of strings which represnt the various choices a user can make. Must be at least 2.
     * @returns Selected Choice
     */
    static show(title, message, choices, callback) {
        // If the singleton hasn't been created, done. 
        if (ChoiceModalDialog.singleton == null) {
            return "";
        }
        // Load the Template
        ChoiceModalDialog.singleton.loadTemplateToParent();
        // Update the Template with the User Provided Options
        $("#modal-choice-title").text(title);
        $("#modal-choice-body").text(message);
        for (let choice of choices) {
            let onClickAction = `'view.routeEvent("onChoiceModalSelect", "${choice}")'`;
            let choiceElement = $(`<button type="button" class="btn btn-secondary" data-dismiss="modal" id="modal-choice-${choice.toLowerCase()}" onclick=${onClickAction} >${choice}</button>`);
            $("#modal-choice-choices").append(choiceElement);
        }
        // Show the Modal
        let modalDialog = $("#modal-choice");
        modalDialog.modal();
    }
    optionSelected(option) {
        if (this.callback == null) {
            return;
        }
        this.callback(option);
        this.callback = null;
    }
}
exports.ChoiceModalDialog = ChoiceModalDialog;
//# sourceMappingURL=choiceModalDialog.js.map