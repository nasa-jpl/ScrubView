import commandLineArgs = require('command-line-args');

interface CommandLineJSON
{
    debugEnabled : boolean,
    disposition: boolean,
    projectFolder : string
}

export class CommandLineArgs
{

    private _debugEnabled : Boolean;
    private _disposition : Boolean;
    private _projectFolder :  string;

    get debugEnabled() : Boolean { return this._debugEnabled; }
    get disposition() : Boolean { return this._disposition; }
    get projectFolder(): string {return this._projectFolder; }

    constructor(projectFolder : string, debugEnabled : boolean, disposition : boolean)
    {
        this._debugEnabled = debugEnabled;
        this._disposition = disposition;
        this._projectFolder = projectFolder;
    }

    public static parse()
    {

        // Setup the Command Line Options
       const optionDefinitions = [
            { name: "debugEnabled", alias: "d", type: Boolean},
            { name: "project", alias: "p", type: String},
            { name: "disposition", alias: "m", type: Boolean},
            { name: "executable", type: String, defaultOption: true} // Note, this has to be there...
        ]

        // Parse
        const options = commandLineArgs(optionDefinitions, {partial: true });

        // Set
        let debugEnabled = options.debugEnabled;
        let disposition = options.disposition;
        let projectFolder = options.project;

        // Default
        if(debugEnabled== undefined) {
            debugEnabled = false;
        }

        // Default
        if(disposition == undefined) {
            disposition = false;
        }

        // Default
        if(projectFolder == undefined) {
            projectFolder = process.cwd();
        }

        // Log
        console.info(`Debug Enabled: ${debugEnabled}`);
        console.info(`Disposition Enabled: ${disposition}`);
        console.info(`Project Folder: ${projectFolder}`);

        return new CommandLineArgs(projectFolder, debugEnabled, disposition)
    }

    public toJSON()
    {
        return {
            debugEnabled: this._debugEnabled,
            disposition: this._disposition,
            projectFolder: this._projectFolder
        }
    }

    static fromJSON(json :CommandLineJSON )
    {
        return new CommandLineArgs(json.projectFolder, json.debugEnabled, json.disposition);
    }

}