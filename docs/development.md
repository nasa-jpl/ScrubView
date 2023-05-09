# Development 
Follow the steps below to set up the development environment:

1. Clone the repository: `git clone https://github.jpl.nasa.gov/lbarner/ScrubView.git`
2. Navigate into the repository: `cd ScrubView`
3. Install project dependencies: `npm install`

This will install all of the dependencies that are required for ScrubView development and packaging. Developers may use any IDE for development purposes, but VSCode is recommended.


## Compilation
Before debugging any changes that have been made, the JavaScript files must be generated. This can be done using the following command

```
tsc -p tsconfig.json
```

You may encounter the following error during compilation:

```
error TS2688: Cannot find type definition file for 'keyv'.
```
Running the command `npm install -D keyv` should resolve this issue and compilation can proceed as normal.


## Debugging
Live debugging can be performed by running the following command from the ScrubView. The `-d` flag enables the debugger.

```
electron . -d -p <path to project directory>
```


## Dependencies
Basic dependencies is the NPM javascript package manager. The other development & deploymenet dependencies are covered by
the package.json file and the npm install command. 


## Build & Deploy
The deployment packages can be built using the provided script. Deployment packages can be built using the following commands:

```
cd scripts
./build
```

 NOTE: Creating the windows deploy package requries wine to be installed if building from a
 non-windows platform. 
