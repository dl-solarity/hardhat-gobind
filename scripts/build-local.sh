#!/usr/bin/bash

cp -r ./README.md ./LICENSE ./src ./bin ./publish
mkdir -p ./publish/dist/
cp -r ./dist/src ./publish/dist/
