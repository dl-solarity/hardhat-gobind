#!/usr/bin/bash

cp -r ./README.md ./LICENSE ./src ./publish
cp -r ./bin ./publish/bin
mkdir -p ./publish/dist/
cp -r ./dist/src ./publish/dist/
