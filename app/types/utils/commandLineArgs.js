"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandLineArgs = void 0;
const commandLineArgs = require("command-line-args");
class CommandLineArgs {
    constructor(projectFolder, debugEnabled, disposition) {
        this._debugEnabled = debugEnabled;
        this._disposition = disposition;
        this._projectFolder = projectFolder;
    }
    get debugEnabled() { return this._debugEnabled; }
    get disposition() { return this._disposition; }
    get projectFolder() { return this._projectFolder; }
    static parse() {
        // Setup the Command Line Options
        const optionDefinitions = [
            { name: "debugEnabled", alias: "d", type: Boolean },
            { name: "project", alias: "p", type: String },
            { name: "disposition", alias: "m", type: Boolean },
            { name: "executable", type: String, defaultOption: true } // Note, this has to be there...
        ];
        // Parse
        const options = commandLineArgs(optionDefinitions, { partial: true });
        // Set
        let debugEnabled = options.debugEnabled;
        let disposition = options.disposition;
        let projectFolder = options.project;
        // Default
        if (debugEnabled == undefined) {
            debugEnabled = false;
        }
        // Default
        if (disposition == undefined) {
            disposition = false;
        }
        // Default
        if (projectFolder == undefined) {
            projectFolder = process.cwd();
        }
        // Log
        console.info(`Debug Enabled: ${debugEnabled}`);
        console.info(`Disposition Enabled: ${disposition}`);
        console.info(`Project Folder: ${projectFolder}`);
        return new CommandLineArgs(projectFolder, debugEnabled, disposition);
    }
    toJSON() {
        return {
            debugEnabled: this._debugEnabled,
            disposition: this._disposition,
            projectFolder: this._projectFolder
        };
    }
    static fromJSON(json) {
        return new CommandLineArgs(json.projectFolder, json.debugEnabled, json.disposition);
    }
}
exports.CommandLineArgs = CommandLineArgs;
//# sourceMappingURL=commandLineArgs.js.map