#!/bin/bash -ex

export PATH=${HOME}/build_tools/node-latest/bin:${HOME}/build_tools/yarn-latest/bin:$PATH

# build
yarn clean
yarn build

# promote
[[ "$1" == "1" ]] && yarn push
