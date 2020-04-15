#!/bin/bash -ex

export PATH=${HOME}/build_tools/node-latest/bin:${HOME}/build_tools/yarn-latest/bin:$PATH

rm -rf ./build-tools
git clone git@github.com:onshape/build-tools.git
pushd build-tools
. ./buildenv.bash
popd

# build
yarn clean
yarn build

# promote
[[ "$1" == "1" ]] && yarn push || true
