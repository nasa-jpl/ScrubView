import { StateManager } from "../stateManager";
import { Log } from "../../types/utils/log";
import * as fs from "fs";
import * as path from "path";
let $ = require('jquery');

/**
 * Abstract Component -
 * Defines a base class for all Component classes to inherit from 
 */
export abstract class AbstractComponent
{

    protected _state : StateManager;
    protected _displayElementName : string | null;
    protected _displayElement : JQuery | null;
    protected _templateFilepath : string;
    protected _componentName : string;
    protected _subscribedEvents : Map<string, any>;

    get displayElementName() : string | null { return this._displayElementName; }

    /**
     * Creates an instance of abstract component.
     */
    constructor(state : StateManager, componentName : string)
    {
        this._state  = state;
        this._displayElement = null;
        this._displayElementName = null;
        this._subscribedEvents = new Map<string, any>();

        // Create the template filename from the component name
        this._componentName = componentName;
        this._templateFilepath = AbstractComponent.getTemplateFilename(this._componentName);

        // Verify the Template File Path Exists
        if(!fs.existsSync(this._templateFilepath))
        {
            Log.error(`Unable to find template file for component ${this._componentName} at ${this._templateFilepath}`);
        }

        // Attach to the display eleemnt DOM object. For child components, this
        // element may not exist yet, so this will fail. That is fine, since
        // the parent will call it again once the object is created
        this.attachToElement(this._componentName);

        // Render
        this.render();
    }

    protected eventSubscribe(eventName : string, callback: (...args: any[] )=>void )
    {
        this._state.on(eventName, callback);
        this._subscribedEvents.set(eventName, callback);
    }

    public dispose()
    {
        for(let eventName in this._subscribedEvents)
            this._state.removeListener(eventName, this._subscribedEvents.get(eventName))
    }

    public static getTemplateFilename(componentName : string) : string 
    {
        const remote = require('@electron/remote');
        const app = remote.app;
        let viewPath = path.join(app.getAppPath(), "app/views/components");
        
        let templateFilename = componentName.charAt(0).toLowerCase() + componentName.slice(1) + ".html";
        return path.join(viewPath, templateFilename);
    }

    public attachToElement(displayElementName : string) : void 
    {
        // Find the Display Element
        this._displayElementName = displayElementName;
        this._displayElement = $(this._displayElementName);

        if(this._displayElement == null) {
            Log.error(`Unable to attach component ${this._componentName} to its DOM object`);
        }
    }

    // Render this object
    public abstract render() : void;   

    public static readTemplateFile(filepath : string) : string
    {
        return fs.readFileSync(filepath).toString();
    }


    /**
     * Clears the parent element, and loads the contents of the template file
     */
    protected loadTemplateToParent()
    {
        if(this._displayElement == null){
            Log.error("Display Element for Component is not defined.");
            return;
        }

        let template = AbstractComponent.readTemplateFile(this._templateFilepath);
        Log.debug(`Replacing element ${this._displayElement.prop('nodeName')}, with contents of ${this._templateFilepath}`)
        this._displayElement.replaceWith(template)
    }


}

export abstract class AbstractParentComponent extends AbstractComponent
{

    protected childComponents : Array<AbstractComponent>;
    protected listElement : JQuery | null = null;

    constructor(state : StateManager, componentName : string, listElementId : string)
    {
        super(state, componentName);
        this.childComponents = new Array<AbstractComponent>();
        this.listElement = $("#" + listElementId);
    }


    public addChildComponent(childComponent : AbstractComponent)
    {
        if(childComponent.displayElementName == null || this.listElement == null) {
            Log.error(`Unable to display child object for parent ${this._displayElementName}`);
            return;
        }

        // Create a Child Element in the List Element
        this.listElement.append(`<div id='${childComponent.displayElementName}'></div>`);

        // Attach the Child Component to this new Element
        childComponent.attachToElement("#" + childComponent.displayElementName);

        // Render the Child Component
        childComponent.render();

        // Add the child to the parents list
        this.childComponents.push(childComponent)
    }

    public clearChildren()
    {
        // Clear the Children from the display
        if(this.listElement != null) {
            this.listElement.empty();
        }

        // Dispose of the children controls (i.e. unsubscribe from all 
        // events)
        if(this.childComponents != undefined)
        {
            for(let child of this.childComponents)
            {
                child.dispose();
            }

            // Remove the references
            this.childComponents = new Array<AbstractComponent>();
        }
    }
}