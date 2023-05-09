import {AbstractComponent} from "./abstractComponent"
import { StateManager } from "../stateManager";
import { Log, LogLevels } from "../../types/utils/log"


export class LogMessageViewer extends AbstractComponent
{
    
    constructor(state : StateManager)
    {
        super(state, "LogMessageViewer");

        // Subscribe to onModuleChanged
        Log.getInstance().on("onLogMessage", (message, level) => {
            this.showMessage(message, level);
        });
    }

    private showMessage(message : string, level : LogLevels)
    {
        let displayElement = $("#log-message-text");
        let statusBarElement = $("#status-bar");

        // Filter & Color
        switch(level)
        {
            case LogLevels.DEBUG:
                return; // Skip These

            case LogLevels.INFO:
                statusBarElement.css("color", "var(--color-text-primary)");
                statusBarElement.css("background-color", "unset")
                break;

            case LogLevels.WARNING:
                statusBarElement.css("color", "black");    
                statusBarElement.css("background-color", "var(--warning)")
                break;

            case LogLevels.ERROR:
                statusBarElement.css("color", "black");
                statusBarElement.css("background-color", "var(--danger)")
                break;
        }

        displayElement.text(message);
        statusBarElement.css("display", "block");

        // Start the Fade out Timer for 10 seconds
        setTimeout(()=> {
            statusBarElement.fadeOut();
        }, 10000);
    }


    public render()
    {
        // Load Template
        this.loadTemplateToParent();
    }

}