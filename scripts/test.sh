#!/usr/bin/env bash

deno lint
deno fmt --check
deno test --allow-env --allow-read --allow-write --unstable
