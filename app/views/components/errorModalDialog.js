"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorModalDialog = void 0;
const abstractComponent_1 = require("./abstractComponent");
class ErrorModalDialog extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "ErrorModalDialog");
        ErrorModalDialog.singleton = this;
    }
    render() {
        // Do Nothing, everything happens in show()
    }
    static show(title, message) {
        // If the singleton hasn't been created, done. 
        if (ErrorModalDialog.singleton == null) {
            return;
        }
        // Load the Template
        ErrorModalDialog.singleton.loadTemplateToParent();
        // Update the Template with the User Provided Options
        $("#modal-error-title").text(title);
        $("#modal-error-body").empty();
        $("#modal-error-body").append(message);
        // Show the Modal
        let errorModal = $("#modal-error");
        let options = { show: true, keyboard: false, backdrop: "static" };
        errorModal.modal(options);
    }
}
exports.ErrorModalDialog = ErrorModalDialog;
//# sourceMappingURL=errorModalDialog.js.map