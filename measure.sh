#!/bin/bash

# Function to collect metrics for a given configuration
collect_metrics() {
    local config_name=$1
    local config_lto=$2
    local qjsc_flags=$3

    echo "Measuring configuration: $config_name (CONFIG_LTO=$config_lto, flags=$qjsc_flags)"

    make clean > /dev/null 2>&1
    make CONFIG_LTO=$config_lto > /dev/null 2>&1

    if [ ! -f ./qjsc ]; then
        echo "Failed to build qjsc for $config_name"
        return
    fi

    # Compile examples
    ./qjsc $qjsc_flags -o "hello_${config_name}" examples/hello.js
    ./qjsc $qjsc_flags -o "pi_${config_name}" examples/pi_bigint.js

    # hello_module.js requires -m. If -fno-module-loader is used, it might fail to run, but let's see if it compiles.
    # Actually, if we disable module-loader, -m might still work for static modules?
    # Let's check qjsc.c again. FE_MODULE_LOADER controls JS_SetModuleLoaderFunc2.
    if [[ "$qjsc_flags" == *"-fno-module-loader"* ]]; then
        echo "Skipping hello_module for $config_name as module-loader is disabled"
    else
        ./qjsc $qjsc_flags -m -o "hello_mod_${config_name}" examples/hello_module.js
    fi

    # Store sizes
    echo "Results for $config_name:"
    ls -l "hello_${config_name}" "pi_${config_name}" 2>/dev/null | awk '{print $9 ": " $5}'
    ls -l "hello_mod_${config_name}" 2>/dev/null | awk '{print $9 ": " $5}'
    echo "-----------------------------------"
}

# 1. baseline-original
collect_metrics "baseline-original" "n" ""

# 2. baseline-lto-full-feature
collect_metrics "baseline-lto-full-feature" "y" "-flto"

# 3. partial-runtime
collect_metrics "partial-runtime" "y" "-flto -fno-eval -fno-regexp -fno-json -fno-module-loader"

# 4. minimal-runtime
MINIMAL_FLAGS="-flto -fno-eval -fno-regexp -fno-json -fno-proxy -fno-map -fno-typedarray -fno-promise -fno-date -fno-string-normalize -fno-module-loader -fno-weakref"
collect_metrics "minimal-runtime" "y" "$MINIMAL_FLAGS"
