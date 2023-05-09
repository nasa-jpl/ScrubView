import { AbstractComponent } from "./abstractComponent";
import { StateManager } from "../stateManager";


export class ChoiceModalDialog extends AbstractComponent
{
    private static singleton : ChoiceModalDialog | null;

    private callback : Function | null;
   
    constructor(state : StateManager)
    {
        super(state, "ChoiceModalDialog");
        ChoiceModalDialog.singleton = this;
        this.callback = null;

        // Connect to the Event 
        this.eventSubscribe("onChoiceModalSelect", (selection) => {
            this.optionSelected(selection);
        });
    }

    public render() 
    {
        // Everything is done in show()
    }


    /**
     * Shows choice modal dialog, Blocks until the user has made a selection
     * @param title Dialog title
     * @param message Dialog Message
     * @param choices An array of strings which represnt the various choices a user can make. Must be at least 2. 
     * @returns Selected Choice 
     */
    public static show(title : string, message : string, choices : string[], callback : Function) 
    {
        // If the singleton hasn't been created, done. 
        if(ChoiceModalDialog.singleton == null) {
            return "";
        }

        // Load the Template
        ChoiceModalDialog.singleton.loadTemplateToParent();

        // Update the Template with the User Provided Options
        $("#modal-choice-title").text(title);
        $("#modal-choice-body").text(message);

        for(let choice of choices)
        {
            let onClickAction = `'view.routeEvent("onChoiceModalSelect", "${choice}")'`;
            let choiceElement = $(`<button type="button" class="btn btn-secondary" data-dismiss="modal" id="modal-choice-${choice.toLowerCase()}" onclick=${onClickAction} >${choice}</button>`)
            $("#modal-choice-choices").append(choiceElement);
        }

        // Show the Modal
        let modalDialog : any = $("#modal-choice");
        modalDialog.modal();
    }

    private optionSelected(option : string)
    {
        if(this.callback == null) {
            return;
        }

        this.callback(option);
        this.callback = null;
    }


}