"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractParentComponent = exports.AbstractComponent = void 0;
const log_1 = require("../../types/utils/log");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let $ = require('jquery');
/**
 * Abstract Component -
 * Defines a base class for all Component classes to inherit from
 */
class AbstractComponent {
    /**
     * Creates an instance of abstract component.
     */
    constructor(state, componentName) {
        this._state = state;
        this._displayElement = null;
        this._displayElementName = null;
        this._subscribedEvents = new Map();
        // Create the template filename from the component name
        this._componentName = componentName;
        this._templateFilepath = AbstractComponent.getTemplateFilename(this._componentName);
        // Verify the Template File Path Exists
        if (!fs.existsSync(this._templateFilepath)) {
            log_1.Log.error(`Unable to find template file for component ${this._componentName} at ${this._templateFilepath}`);
        }
        // Attach to the display eleemnt DOM object. For child components, this
        // element may not exist yet, so this will fail. That is fine, since
        // the parent will call it again once the object is created
        this.attachToElement(this._componentName);
        // Render
        this.render();
    }
    get displayElementName() { return this._displayElementName; }
    eventSubscribe(eventName, callback) {
        this._state.on(eventName, callback);
        this._subscribedEvents.set(eventName, callback);
    }
    dispose() {
        for (let eventName in this._subscribedEvents)
            this._state.removeListener(eventName, this._subscribedEvents.get(eventName));
    }
    static getTemplateFilename(componentName) {
        const remote = require('@electron/remote');
        const app = remote.app;
        let viewPath = path.join(app.getAppPath(), "app/views/components");
        let templateFilename = componentName.charAt(0).toLowerCase() + componentName.slice(1) + ".html";
        return path.join(viewPath, templateFilename);
    }
    attachToElement(displayElementName) {
        // Find the Display Element
        this._displayElementName = displayElementName;
        this._displayElement = $(this._displayElementName);
        if (this._displayElement == null) {
            log_1.Log.error(`Unable to attach component ${this._componentName} to its DOM object`);
        }
    }
    static readTemplateFile(filepath) {
        return fs.readFileSync(filepath).toString();
    }
    /**
     * Clears the parent element, and loads the contents of the template file
     */
    loadTemplateToParent() {
        if (this._displayElement == null) {
            log_1.Log.error("Display Element for Component is not defined.");
            return;
        }
        let template = AbstractComponent.readTemplateFile(this._templateFilepath);
        log_1.Log.debug(`Replacing element ${this._displayElement.prop('nodeName')}, with contents of ${this._templateFilepath}`);
        this._displayElement.replaceWith(template);
    }
}
exports.AbstractComponent = AbstractComponent;
class AbstractParentComponent extends AbstractComponent {
    constructor(state, componentName, listElementId) {
        super(state, componentName);
        this.listElement = null;
        this.childComponents = new Array();
        this.listElement = $("#" + listElementId);
    }
    addChildComponent(childComponent) {
        if (childComponent.displayElementName == null || this.listElement == null) {
            log_1.Log.error(`Unable to display child object for parent ${this._displayElementName}`);
            return;
        }
        // Create a Child Element in the List Element
        this.listElement.append(`<div id='${childComponent.displayElementName}'></div>`);
        // Attach the Child Component to this new Element
        childComponent.attachToElement("#" + childComponent.displayElementName);
        // Render the Child Component
        childComponent.render();
        // Add the child to the parents list
        this.childComponents.push(childComponent);
    }
    clearChildren() {
        // Clear the Children from the display
        if (this.listElement != null) {
            this.listElement.empty();
        }
        // Dispose of the children controls (i.e. unsubscribe from all 
        // events)
        if (this.childComponents != undefined) {
            for (let child of this.childComponents) {
                child.dispose();
            }
            // Remove the references
            this.childComponents = new Array();
        }
    }
}
exports.AbstractParentComponent = AbstractParentComponent;
//# sourceMappingURL=abstractComponent.js.map