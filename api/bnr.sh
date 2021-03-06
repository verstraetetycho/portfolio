#!/bin/bash
# Shell script to rebuild and run the api
parentDir=${PWD##*/}

rm -rf build
mkdir build
cd build

cmake ..
make

echo "Server running..."
./${parentDir}
