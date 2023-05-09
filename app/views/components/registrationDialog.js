"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationDialog = void 0;
const abstractComponent_1 = require("./abstractComponent");
const userCollection_1 = require("../../types/userCollection");
class RegistrationDialog extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "RegistrationDialog");
        RegistrationDialog.singleton = this;
        this.eventSubscribe("onRegistrationClosed", () => {
            this.onRegistrationClosed();
        });
    }
    render() {
        // Do Nothing, everything happens in show()
    }
    static show() {
        // If the singleton hasn't been created, done. 
        if (RegistrationDialog.singleton == null) {
            return;
        }
        // Load the Template
        RegistrationDialog.singleton.loadTemplateToParent();
        // Show the Modal
        let errorModal = $("#modal-registration");
        let options = { show: true, keyboard: false, backdrop: "static" };
        errorModal.modal(options);
    }
    onRegistrationClosed() {
        if (this._state.configuration == null || this._state.users == null) {
            return;
        }
        // Grab the user information and add the user
        let username = this._state.configuration.currentUser;
        let displayName = $("#displayName").val();
        let emailAddress = $("#email").val();
        // Add the user
        this._state.users.addUser(new userCollection_1.User(username, displayName, emailAddress));
    }
}
exports.RegistrationDialog = RegistrationDialog;
//# sourceMappingURL=registrationDialog.js.map