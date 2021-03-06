#!/usr/bin/env bash

cp -f ./scripts/config/normal.json ./iconfont.json
npx ts-node src/commands/createIcon.ts

cp -f ./scripts/config/nullsafety.json ./iconfont.json
npx ts-node src/commands/createIcon.ts
mv ./snapshots-1/icon_font.dart ./snapshots/null_safety.dart
rmdir ./snapshots-1
