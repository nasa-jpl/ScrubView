// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { CommandLineArgs } from "./types/utils/commandLineArgs";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: any;
let compareWindow: any;
let metricsWindow: any;

// Get the Command Line Arguments
let args = CommandLineArgs.parse();
let menu : null | Menu = null;

function createWindow() {

    require('@electron/remote/main').initialize()

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        // minWidth: 1150,
        // minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            sandbox: false,
            contextIsolation: false
        }
    });
    
    require("@electron/remote/main").enable(mainWindow.webContents)

    // Open the DevTools.
    if (args.debugEnabled) {
        mainWindow.webContents.openDevTools()
    }

    // and load the index.html of the app.
    mainWindow.loadFile('app/views/mainWindow.html')

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    // Setup the Main Menu
    if (args.disposition) {
        menu = Menu.buildFromTemplate([
            {
                label: "ScrubView",
                submenu:
                    [
                        {label: 'Load new project...', click() { openNewBuild() } },
                        { role : "about"},
                        { label: 'Quit', click() { app.quit() } }
                    ]
            },
            {
                label: 'Edit',
                submenu:
                    [
                        { label: "Cut", accelerator: "CommandOrControl+x", role: "cut" },
                        { label: "Copy", accelerator: "CommandOrControl+c", role: "copy" },
                        { label: "Paste", accelerator: "CommandOrControl+v", role: "paste" },
                    ]
            },
            // {
            //     label: "Disposition",
            //     submenu:
            //         [
            //             { label: "Agree", accelerator: "CommandOrControl+a", click() { addDisposition("Agree"); } },
            //             { label: "Disagree", accelerator: "CommandOrControl+d", click() { addDisposition("Disagree"); } },
            //             { label: "Discuss", accelerator: "CommandOrControl+s", click() { addDisposition("Discuss"); } },
            //             { type: 'separator' },
            //             { label: "No Action", accelerator: "CommandOrControl+n", click() { addDisposition("No Action"); } },
            //             { label: "Code Fix Requested", accelerator: "CommandOrControl+f", click() { addDisposition("Code Fix Requested"); } },
            //         ]
            // },
            {
                label: "Tools",
                submenu: 
                [
                    { label: "Compare Builds", click() { openCompareWindow(); } }
                ]
            },
            {
                label: "View",
                submenu:
                    [
                        { role: 'togglefullscreen' },
                        { type: 'separator' },
                        { label: "+ Increase Font Size", accelerator: "CommandOrControl+Plus", click() { modifyFontSize("+"); } },
                        { label: "- Decrease Font Size", accelerator: "CommandOrControl+-", click() { modifyFontSize("-"); } },
                        { type: 'separator' },
                        { label: "Open Dev Tools", accelerator: "CommandOrControl+t", click() { mainWindow.webContents.openDevTools(); } },
                        { label: "Reload", accelerator: "CommandOrControl+r", click() { mainWindow.reload(); } },
                    ]
            }
        ]);
    }
    else {
        menu = Menu.buildFromTemplate([
            {
                label: "ScrubView",
                submenu:
                    [
                        {label: 'Load new project...', click() { openNewBuild() } },
                        {label: 'Display metrics', 
                                id: 'metrics-popup',
                                enabled: false,
                                click() { openMetricsWindow() }},
                        { role : "about"},
                        { label: 'Quit', click() { app.quit() } }
                    ]
            },
            {
                label: 'Edit',
                submenu:
                    [
                        { label: "Cut", accelerator: "CommandOrControl+x", role: "cut" },
                        { label: "Copy", accelerator: "CommandOrControl+c", role: "copy" },
                        { label: "Paste", accelerator: "CommandOrControl+v", role: "paste" },
                    ]
            },
            {
                label: "Tools",
                submenu: 
                [
                    { label: "Compare Builds", click() { openCompareWindow(); } }
                ]
            },
            {
                label: "View",
                submenu:
                    [
                        { role: 'togglefullscreen' },
                        { type: 'separator' },
                        { label: "+ Increase Font Size", accelerator: "CommandOrControl+Plus", click() { modifyFontSize("+"); } },
                        { label: "- Decrease Font Size", accelerator: "CommandOrControl+-", click() { modifyFontSize("-"); } },
                        { type: 'separator' },
                        { label: "Open Dev Tools", accelerator: "CommandOrControl+t", click() { mainWindow.webContents.openDevTools(); } },
                        { label: "Reload", accelerator: "CommandOrControl+r", click() { mainWindow.reload(); } },
                    ]
            }
        ]);
    }


    //
    Menu.setApplicationMenu(menu);

    // Send the configuration object to the render task (where the bulk of the
    // application executes). This will kick off the initialization of the main
    // window 
    mainWindow.webContents.on('did-finish-load', () => {
        let argsString = JSON.stringify(args);
        console.log(`Sending start Init to Render Task: ${argsString}`);
        mainWindow.send("startInit", argsString);
    });
}

function openNewBuild() {
    // Prompt the user to select a new build
    const { dialog } = require('electron')
    dialog.showOpenDialog({ message: "Select the root directory of the new project...", buttonLabel: "Load Project", properties: ['openDirectory'], defaultPath: process.cwd() })
        .then((result) => {
            // Attempt to load the new build
            let newBuildPath = result.filePaths[0];

            let updatedArgs = {
                "debugEnabled": args.debugEnabled,
                "disposition": args.disposition,
                "projectFolder": newBuildPath
            }

            mainWindow.send("startInit", JSON.stringify(updatedArgs));
        })

}

// function addDisposition(disposition: string) {
//     mainWindow.send("addDisposition", disposition);
// }

function modifyFontSize(modification : string) {
    mainWindow.send("modifyFontSize", modification);
}


function openCompareWindow() 
{
    // Create the compare window (which is modal)
    compareWindow = new BrowserWindow({
        width: 600,
        height: 600,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            sandbox: false
        }
    });

    // and load the index.html of the app.
    compareWindow.loadFile('app/views/compareWindow.html')

    // Emitted when the window is closed.
    compareWindow.on('closed', function () {
        compareWindow = null;
    });

}

ipcMain.on('metricsDataReady', (event, arg) => {
    // console.log(arg);
    const { dialog } = require('electron')
    dialog.showMessageBox(mainWindow, {type: "info", message: arg})
});


ipcMain.on('metricsDataStatus', (event, arg) => {
    // console.log(arg);
    if(menu == null)
    {
        return;
    }

    let metricsMenuItem = menu.getMenuItemById('metrics-popup');

    if(metricsMenuItem == null)
    {
        return;
    }

    metricsMenuItem.enabled = arg;

});

function openMetricsWindow() 
{
    mainWindow.send("loadMetrics");
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    createWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
})


export function dispositionAll(module : string, file : string, line : number, disposition:string)
{
    console.log("Yay!")
}