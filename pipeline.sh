#!/usr/bin/env bash

cur="$(pwd)"
cd "$(dirname "$0")"

cd client && 
    npm run lint:fix && 
    npm run build &&
    npm run test -- --browsers ChromeHeadless --no-watch && 
    cd ..

cd server && 
    npm run lint:fix && 
    npm run build &&
    npm run test && 
    cd ..

cd "$cur"