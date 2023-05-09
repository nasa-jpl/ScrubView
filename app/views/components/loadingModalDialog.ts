import { AbstractComponent } from "./abstractComponent";
import { StateManager } from "../stateManager";


export class LoadingModalDialog extends AbstractComponent
{
    private static singleton : LoadingModalDialog;

    constructor(state : StateManager)
    {
        super(state, "LoadingModalDialog");
        LoadingModalDialog.singleton = this;
    }

    public render()
    {
        // Do Nothing, everything happens in show()
    }
    public static show(message : string, callback : Function, hasProgress?:Boolean)
    {
        // If the singleton hasn't been created, done. 
        if(LoadingModalDialog.singleton == null) {
            return;
        }

        // Load the Template
        LoadingModalDialog.singleton.loadTemplateToParent();

        // Set the Progress
        let progress = 100;
        if(hasProgress){
            // If progress will be defined, set to zero, otherwise use the default
            progress = 0;
        }
        LoadingModalDialog.updateProgress(progress);

        // Set the Message & Progress
        LoadingModalDialog.updateMessage(message);
        
        // Connect the Shown Event
        let loadingModal : any = $("#loadingModal");
        loadingModal.on("shown.bs.modal", callback)

         // Show the Modal
         let options = {show:true, keyboard:false, backdrop:"static"}
         loadingModal.modal(options);
    }

    public static updateProgress(progress : number)
    {
        // If the singleton hasn't been created, done. 
        if(LoadingModalDialog.singleton == null) {
            return;
        }

        // Set the Values
        $("#loading-modal-progressbar").attr("aria-valuenow", progress.toString());
    }

    public static updateMessage(message:string)
    {
        // If the singleton hasn't been created, done. 
        if(LoadingModalDialog.singleton == null) {
            return;
        }

        $("#loading-modal-message").text(message);
    }

    public static hide()
    {
        // If the singleton hasn't been created, done. 
        if(LoadingModalDialog.singleton == null) {
            return;
        }

        let loadingModal : any = $("#loadingModal");
        loadingModal.modal('hide');
    }

}