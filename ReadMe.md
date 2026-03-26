# static-quickjs

A fork of [QuickJS](https://bellard.org/quickjs/) by Fabrice Bellard and Charlie Gordon, extended with a bytecode-only runtime build mode that executes only pre-compiled static bytecode and prohibits all dynamic parsing or evaluation — producing smaller embedded binaries and a safer, more predictable runtime.

## What is this?

QuickJS is a small, embeddable JavaScript engine that supports the full ES2023 specification. It includes a compiler (`qjsc`) that compiles JavaScript source files to C bytecode arrays, which can then be linked into a standalone executable.

**static-quickjs** builds on this by separating the engine into two distinct stages:

- **Build-time engine** — `qjsc` + `libquickjs.a`. Always full-featured. Parses and compiles JavaScript source to bytecode. Unchanged from upstream.
- **Runtime engine** — `libquickjs-bytecode.a` / `libquickjs-bytecode.lto.a`. A minified variant with the parser and compiler physically stripped out via LTO dead-stripping. This is what gets embedded into the generated executable that ships to end users or embedded targets.

The result: when you compile your JavaScript with `qjsc` and disable all parser-dependent features, the final binary contains only the bytecode interpreter — no parser, no compiler, no source evaluation machinery.

## Why?

QuickJS currently bundles the full engine — including the parser and compiler — into every binary, even when the binary only needs to execute pre-compiled bytecode. For embedded targets, this is unnecessary weight.

The parser and compiler are only needed at build time. At runtime, if you have pre-compiled bytecode, you don't need them. static-quickjs makes this explicit and enforces it at the linker level.

## How it works

When `qjsc` is invoked with all four parser-disabling flags simultaneously:

```sh
qjsc -fno-eval -fno-regexp -fno-json -fno-module-loader -o my_app my_app.js
```

The generated executable is automatically linked against `libquickjs-bytecode.lto.a` instead of `libquickjs.lto.a`. This library is compiled with `-DCONFIG_BYTECODE_ONLY_RUNTIME`, which wraps `__JS_EvalInternal` and its entire parser/compiler call tree in `#ifndef CONFIG_BYTECODE_ONLY_RUNTIME`. LTO then dead-strips all of that code from the final binary.

The four flags are the complete and sufficient condition:

| Flag | What it disables | Parser gate closed |
|---|---|---|
| `-fno-eval` | `eval()`, `new Function()` | `ctx->eval_internal` stays NULL |
| `-fno-regexp` | RegExp compilation | `ctx->compile_regexp` stays NULL |
| `-fno-json` | `JSON.parse`, `JSON.stringify` | JSON global not registered |
| `-fno-module-loader` | dynamic `import()`, source modules | `rt->module_loader_func` stays NULL |

Together these close every runtime path to the parser/compiler. The `CONFIG_BYTECODE_ONLY_RUNTIME` guard then makes the dead code physically absent from the binary, not just behaviorally unreachable.

## Building

```sh
# Build everything including the bytecode-only runtime libraries
make

# Build only the bytecode-only runtime libraries
make libquickjs-bytecode.a
make libquickjs-bytecode.lto.a

# Compile a JS file to a bytecode-only executable
./qjsc -fno-eval -fno-regexp -fno-json -fno-module-loader -o my_app my_app.js

# Run the CI validation (symbol inspection + round-trip test)
make test-bytecode-runtime
```

## Upstream

This project tracks the official QuickJS repository. The upstream source and documentation are available at:

- https://bellard.org/quickjs/
- https://github.com/bellard/quickjs

## License

MIT — same as upstream QuickJS. See [LICENSE](LICENSE) for details.
