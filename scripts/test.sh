#!/usr/bin/env bash

deno lint
deno fmt --check
DENO_ENV=test deno test --allow-env --allow-read --allow-write --unstable adapter_test.js
