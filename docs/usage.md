# Usage

## Prerequisites
Before ScrubView can be run, the only expectation is that at least some static analysis results are available for review. ScrubView expects results to be formatted using the SARIF standard. These results should be collected into the directory `<source code root>/scrub_results` and should follow the naming format `<tool name>.sarif`.

## Structure
The ScrubView interface is broken down into 3 major pieces:

- **File List**: This section is used to browse the source code tree. 
  - A number is displayed directly to the right of each file and sub-directory. For files, this represents the number of issues presemt within the file. For sub-directories, this number is a roll-up of all the files and sub-directories found within.
- **Code Browser**: The section of the interface displays the selected file from the source code
- **Error List**: This section shows all of the warnings associated with the current directory displayed in the File List. Double-clicking on an error will populate the Code Browser section with the file of interest and highlight the particular line the error is referencing.
  - Selecting a file from the File List will update the Error List to only show errors asociated with the selected file
  - The `Filter` option within this section allows errors to be filtered by the tool that generated the error

## Starting ScrubView
There are two basic options for launching ScrubView:

1. Double-click on the icon to launch an empty viewer. From here a project must be loaded
2. From the command-line, execute ScrubView and provide the project diretory using the `-p` option flag

```
ScrubView -p <Path to Source Code Root>
```
Launching without the `-p` flag will default to using the current directory as the project directory

## Loading a Project
To load a new project, select the `Load new project...` option from the `ScrubView` drop down menu. This will launch a diretory browser. Select the root directory of your source code and click on the `Load Project` button. 

## Navigation
When a project is loaded, the File List section of the browser will load all of the files and sub-directories present at the root of the source code tree. Clicking on a file will load the contents into the Code Browser. Clicking on a sub-directory will move this update the File List section to display the contents of the sub-directory. A `..` option will also be added to allow for navigation back to the source code root directory.
