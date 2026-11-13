#!/usr/bin/env bash
cd "$(dirname "$0")"
node --check manager.js || exit 1
node manager.js --open
