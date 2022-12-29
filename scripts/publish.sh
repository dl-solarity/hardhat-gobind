#!/usr/bin/bash

cp -r ./README.md ./LICENSE ./dist ./src ./bin ./publish
npm publish ./publish/ --access public
rm -r ./publish/README.md ./publish/LICENSE ./publish/dist ./publish/src ./publish/bin
