#!/usr/bin/env sh
docker run --rm -it -v $HOME/.aws:/root/.aws -v $PWD:/src -v $PWD/.tmp/node_modules:/src/node_modules sls-amazonlinux:latest
