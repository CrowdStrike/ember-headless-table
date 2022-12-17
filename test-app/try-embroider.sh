#!/bin/bash

DEFAULT_VALUE="'ember-lts-4.8 + embroider-optimized'"

scenario="${1:-$DEFAULT_VALUE}"

if [ -z "$scenario" ]; then
  echo "Scenario not specified. Please specify a scenario."
  exit 1
fi

node_modules/.bin/ember try:one "$scenario" --- ember s
