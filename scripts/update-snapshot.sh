#!/usr/bin/env bash

cp -f ./scripts/config/normal.json ./iconfont.json
npx ts-node src/commands/createIcon.ts

cp -f ./scripts/config/custom-icon.json ./iconfont.json
npx ts-node src/commands/createIcon.ts
