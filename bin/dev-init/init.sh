#!/bin/bash
export QUIET_INIT=1
export DEBUG=0
node -e 'require("./module/boot/bin/boot"); require("./bin/dev-init").init()';