#!/bin/bash

ELECTRON_PACKAGER="./node_modules/electron-packager/bin/electron-packager.js"
SOURCE_DIR="./"
OUTPUT_DIR="./builds"
IGNORE="--ignore ^/test --ignore ^/builds --ignore ^/scripts"

echo ""
echo "===== Clearing the build directory"
rm -rf $OUTPUT_DIR/*

echo ""
echo "===== Building for Mac (Darwin)"
pwd
electron-packager $SOURCE_DIR --overwrite --platform=darwin --arch=x64  --prune=true --out=$OUTPUT_DIR $IGNORE --asar --icon="./icon/icon.icns"
cd $OUTPUT_DIR
chmod 777 ./ScrubView-darwin-x64/ScrubView.app/Contents/MacOS/ScrubView
zip -r -X -q ScrubView-darwin-x64.zip ScrubView-darwin-x64
pwd
cd ..

echo ""
echo "===== Building for Linux"
pwd
electron-packager $SOURCE_DIR --overwrite --platform=linux  --arch=x64  --prune=true --out=$OUTPUT_DIR $IGNORE --asar
cd $OUTPUT_DIR
chmod 777 ScrubView-linux-x64/ScrubView
zip -r -X -q ScrubView-linux-x64.zip ScrubView-linux-x64
cd ../


