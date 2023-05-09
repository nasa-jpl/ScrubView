import { AbstractComponent } from "./abstractComponent";
import { StateManager } from "../stateManager";
import { User } from "../../types/userCollection";


export class RegistrationDialog extends AbstractComponent
{
    private static singleton : RegistrationDialog;

    constructor(state : StateManager)
    {
        super(state, "RegistrationDialog");
        RegistrationDialog.singleton = this;

        this.eventSubscribe("onRegistrationClosed", () => {
            this.onRegistrationClosed();
        })
    }

    public render()
    {
        // Do Nothing, everything happens in show()
    }

    public static show()
    {
        // If the singleton hasn't been created, done. 
        if(RegistrationDialog.singleton == null) {
            return;
        }

         // Load the Template
         RegistrationDialog.singleton.loadTemplateToParent();

         // Show the Modal
         let errorModal : any = $("#modal-registration");
         let options = {show:true, keyboard:false, backdrop:"static"}
         errorModal.modal(options);
    }

    private onRegistrationClosed()
    {
        if(this._state.configuration == null || this._state.users == null) {
            return;
        }
        
        // Grab the user information and add the user
        let username = this._state.configuration.currentUser;
        let displayName = <string>$("#displayName").val();
        let emailAddress = <string>$("#email").val();

        // Add the user
        this._state.users.addUser(new User(username, displayName, emailAddress));
    }

}