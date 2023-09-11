
import { app } from "electron";
import * as path from 'path';
import * as fs from 'fs';
import { CommandLineArgs } from "./commandLineArgs";
import { Log } from "./log"

export interface ToolConfiguration
{
    name : string,
    prefix : string,
    resultsFile : string,
    metricsFile : string,
    parser : string,
    excludeFiles : Array<string>,
    excludeErrors : Array<string>
}

export interface ProjectConfigurationFile
{
    name : string, 
    buildFolder : string, 
    scrubFolder : string, 
    leads : Array<string>,
    globalExcludeFiles : Array<string>
    onlyIncludeFiles : Array<string>
    tools : Array<ToolConfiguration>,
    builds : Array<BuildInfo>
}

export interface BuildInfo
{
    name: string,
    buildFolder: string | undefined,
    badgeType: string | undefined,
    badgeText: string | undefined,
    globalExcludeFiles : Array<string> | undefined,
    onlyIncludeFiles : Array<string> | undefined
}


export class Configuration
{
    private _commandLineArgs : CommandLineArgs;
    private _currentUser : string;
    private _programVersion : string;
    private _projectConfiguration : ProjectConfigurationFile

    get currentUser() : string { return this._currentUser; }
    get programVersion() : string { return this._programVersion; }
    get projectConfiguration() : ProjectConfigurationFile { return this._projectConfiguration; }
    get commandLineArgs() : CommandLineArgs { return this._commandLineArgs; }

    constructor(commandLineArgs : CommandLineArgs)
    {
        // Setup Defaults
        this._commandLineArgs = commandLineArgs;
        this._currentUser = require("os").userInfo().username;
        
        // Get the version number
        const remote = require('@electron/remote');
        const app = remote.app;
        this._programVersion = app.getVersion();

        // Read the configuration file to get the rest of the configuration
        this._projectConfiguration = this._readConfigurationFile();
    } 

    /**
     * Reads the project configuration file
     * @returns configuration file object 
     */
    private _readConfigurationFile() : ProjectConfigurationFile 
    {
        // If the path is relative (i.e. doesnt start with a /), make it into a fully
        // qualified path
        let configFilePath = path.join(this._commandLineArgs.projectFolder, "projectConfig.json");
        if(!configFilePath.startsWith("/")) {
            Log.error(`Project Folder must be fully qualified. Got: ${this._commandLineArgs.projectFolder}`);
            process.exit(-1);
        }

        // (Try to) Parse the configuration file if it exists, otherwise set default values
        let configObject;
        if (fs.existsSync(configFilePath)) {
            try {
                configObject = JSON.parse(fs.readFileSync(configFilePath).toString());
                Log.message(`Loaded project configuration file from ${configFilePath}`);
            }
            catch(e) {
                Log.error(`Error reading project configuration file: ${configFilePath} Error: ${e}`)
                process.exit(-1);
            }
        }
        else {
            
            // Set the default values
            let buildFolder = this._commandLineArgs.projectFolder;
            let projectName = path.basename(buildFolder);
            let scrubFolder = path.join(buildFolder, 'scrub_results');
            let projectLeads = [require("os").userInfo().username];
        
            // Find all of the SARIF files and metrics files
            let sarifFiles = fs.readdirSync(scrubFolder).filter(fn => fn.endsWith('.sarif'));

            // Add all of the tool configuration data
            let toolConfigs = [];
            for (let sarifFile of sarifFiles) {
                // Get the configuration values
                let toolFile = path.basename(sarifFile);
                let toolName = toolFile.split('.')[0];
                
                // Add metrics data if it exists
                let metricsFile = "";
                let metricsPath = path.join(scrubFolder, toolName.concat("_metrics.csv"));
                if (fs.existsSync(metricsPath)) {
                    metricsFile = path.basename(metricsPath);
                } 

                // Add the configuration data
                toolConfigs.push({
                                    "name": toolName,
                                    "prefix": toolName,
                                    "resultsFile": toolFile,
                                    "metricsFile": metricsFile,
                                    "parser":"sarif",
                                    "excludeFiles" : [],
                                    "excludeErrors" : []
                });   
            }

            // Create the configuration object
            configObject = {
                "name" : projectName,
                "buildFolder" : buildFolder,
                "scrubFolder" : scrubFolder,
                "leads" : projectLeads,
                "globalExcludeFiles" : [],
                "onlyIncludeFiles" : [],
                "tools" : toolConfigs,
                "builds" :
                [
                    {
                        "name": projectName,
                        "buildFolder": buildFolder,
                        "globalExcludeFiles" : []
                    }
                ]
            }



            // configObject = {
            //     "name" : projectName,
            //     "buildFolder" : buildFolder,
            //     "scrubFolder" : scrubFolder,
            //     "leads" : projectLeads,
            //     "globalExcludeFiles" : [],
            //     "onlyIncludeFiles" : [],
            //     "tools" :
            //     [
            //         {
            //             "name": "Coverity",
            //             "prefix": "coverity",
            //             "resultsFile": "coverity.scrub",
            //             "parser":"scrub",
            //             "excludeFiles" : [],
            //             "excludeErrors" : []
            //         },
            //         {
            //             "name": "CodeSonar",
            //             "prefix": "codesonar",
            //             "resultsFile": "codesonar.scrub",
            //             "parser":"scrub",
            //             "excludeFiles" : [],
            //             "excludeErrors" : []
            //         },
            //         {
            //             "name": "SonarQube",
            //             "prefix": "sonarqube",
            //             "resultsFile": "sonarqube.scrub",
            //             "parser":"scrub",
            //             "excludeFiles" : [],
            //             "excludeErrors" : []
            //         }
            //     ],
            //     "builds" :
            //     [
            //         {
            //             "name": projectName,
            //             "buildFolder": buildFolder,
            //             "globalExcludeFiles" : []
            //         }
            //     ]
            // }
            // configObject = {
            //     "name" : projectName,
            //     "buildFolder" : buildFolder,
            //     "scrubFolder" : scrubFolder,
            //     "leads" : projectLeads,
            //     "globalExcludeFiles" : [],
            //     "onlyIncludeFiles" : [],
            //     "tools" :
            //     [
            //         {
            //             "name": "Coverity",
            //             "prefix": "coverity",
            //             "resultsFile": "coverity.sarif",
            //             "parser":"sarif",
            //             "excludeFiles" : [],
            //             "excludeErrors" : []
            //         },
            //         {
            //             "name": "CodeSonar",
            //             "prefix": "codesonar",
            //             "resultsFile": "codesonar.sarif",
            //             "parser":"sarif",
            //             "excludeFiles" : [],
            //             "excludeErrors" : []
            //         },
            //         {
            //             "name": "SonarQube",
            //             "prefix": "sonarqube",
            //             "resultsFile": "sonarqube.sarif",
            //             "parser":"sarif",
            //             "excludeFiles" : [],
            //             "excludeErrors" : []
            //         },
            //         {
            //             "name": "Compiler",
            //             "prefix": "compiler",
            //             "resultsFile": "compiler.sarif",
            //             "parser":"sarif",
            //             "excludeFiles" : [],
            //             "excludeErrors" : []
            //         }
            //     ],
            //     "builds" :
            //     [
            //         {
            //             "name": projectName,
            //             "buildFolder": buildFolder,
            //             "globalExcludeFiles" : []
            //         }
            //     ]
            // }
        }

        return configObject;
    }

    /**
     * Gets build settings for a specific build. Copies in project level build
     * settings as needed to fill in blanks from the configuration files. 
     * @param buildName name of the build to get settings for
     * @returns build settings settings for the selected build
     */
    public getBuildSettings(buildName : string) : BuildInfo | null
    {
        // Find the Settings from the Project Configuration File
        let returnInfo = null;
        for(let build of this._projectConfiguration.builds)
        {
            if(build.name == buildName)
            {
                returnInfo = build;
                break;
            }
        }

        // If we didnt find settings here, thats a big problem. 
        if(returnInfo == null) {
            Log.error(`Unable to find build settings for build ${buildName}`);
            return null;
        }

        // Fill in the blanks
        if(returnInfo.buildFolder == undefined)
        {
            returnInfo.buildFolder = path.join(this._projectConfiguration.buildFolder, buildName)
        }

        // // Either way, if there isn't src/ at the end, add it
        // if(!returnInfo.buildFolder.endsWith("src") && !returnInfo.buildFolder.endsWith("src/"))
        // {
        //     returnInfo.buildFolder = path.join(returnInfo.buildFolder, "src");
        // }

        if(returnInfo.globalExcludeFiles == undefined)
        {
            returnInfo.globalExcludeFiles = this._projectConfiguration.globalExcludeFiles;
        }

        if(returnInfo.onlyIncludeFiles == undefined)
        {
            returnInfo.onlyIncludeFiles = this._projectConfiguration.onlyIncludeFiles;
        }

        return returnInfo;
    }
}