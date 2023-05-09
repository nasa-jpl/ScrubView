import { AbstractComponent } from "./abstractComponent";
import { StateManager } from "../stateManager";


export class ErrorModalDialog extends AbstractComponent
{
    private static singleton : ErrorModalDialog;

    constructor(state : StateManager)
    {
        super(state, "ErrorModalDialog");
        ErrorModalDialog.singleton = this;
    }

    public render()
    {
        // Do Nothing, everything happens in show()
    }

    public static show(title : string, message : string)
    {
        // If the singleton hasn't been created, done. 
        if(ErrorModalDialog.singleton == null) {
            return;
        }

         // Load the Template
         ErrorModalDialog.singleton.loadTemplateToParent();

         // Update the Template with the User Provided Options
         $("#modal-error-title").text(title);
         $("#modal-error-body").empty();
         $("#modal-error-body").append(message);

         // Show the Modal
         let errorModal : any = $("#modal-error");
         let options = {show:true, keyboard:false, backdrop:"static"}
         errorModal.modal(options);
    }

}