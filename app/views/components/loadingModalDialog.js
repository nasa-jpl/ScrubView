"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingModalDialog = void 0;
const abstractComponent_1 = require("./abstractComponent");
class LoadingModalDialog extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "LoadingModalDialog");
        LoadingModalDialog.singleton = this;
    }
    render() {
        // Do Nothing, everything happens in show()
    }
    static show(message, callback, hasProgress) {
        // If the singleton hasn't been created, done. 
        if (LoadingModalDialog.singleton == null) {
            return;
        }
        // Load the Template
        LoadingModalDialog.singleton.loadTemplateToParent();
        // Set the Progress
        let progress = 100;
        if (hasProgress) {
            // If progress will be defined, set to zero, otherwise use the default
            progress = 0;
        }
        LoadingModalDialog.updateProgress(progress);
        // Set the Message & Progress
        LoadingModalDialog.updateMessage(message);
        // Connect the Shown Event
        let loadingModal = $("#loadingModal");
        loadingModal.on("shown.bs.modal", callback);
        // Show the Modal
        let options = { show: true, keyboard: false, backdrop: "static" };
        loadingModal.modal(options);
    }
    static updateProgress(progress) {
        // If the singleton hasn't been created, done. 
        if (LoadingModalDialog.singleton == null) {
            return;
        }
        // Set the Values
        $("#loading-modal-progressbar").attr("aria-valuenow", progress.toString());
    }
    static updateMessage(message) {
        // If the singleton hasn't been created, done. 
        if (LoadingModalDialog.singleton == null) {
            return;
        }
        $("#loading-modal-message").text(message);
    }
    static hide() {
        // If the singleton hasn't been created, done. 
        if (LoadingModalDialog.singleton == null) {
            return;
        }
        let loadingModal = $("#loadingModal");
        loadingModal.modal('hide');
    }
}
exports.LoadingModalDialog = LoadingModalDialog;
//# sourceMappingURL=loadingModalDialog.js.map