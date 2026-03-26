import * as std from "std";
import { importMetaUrl } from "./test_bytecode_import_meta_helper.js";

function assert(actual, expected, message) {
    if (arguments.length === 1)
        expected = true;

    if (Object.is(actual, expected))
        return;

    throw Error("assertion failed: got |" + actual + "|" +
                ", expected |" + expected + "|" +
                (message ? " (" + message + ")" : ""));
}

function testBigIntAndClosures() {
    let total = 5n;

    function mutate(delta) {
        total = total * 10n + delta;
        return total;
    }

    assert(mutate(4n), 54n, "closure mutation #1");
    assert(mutate(3n), 543n, "closure mutation #2");
    return total.toString();
}

function testGenerators() {
    function *series() {
        yield 3;
        yield 5;
        yield 8;
        yield 13;
    }

    return Array.from(series()).join(",");
}

function testMapAndSetIteration() {
    const map = new Map([
        ["alpha", 1],
        ["beta", 2],
        ["gamma", 3],
    ]);
    const set = new Set(["x", "y", "x", "z"]);
    const parts = [];

    for (const [key, value] of map)
        parts.push(key + ":" + value);
    for (const value of set)
        parts.push(value);

    return parts.join(",");
}

function testFunctionToString() {
    function bytecodeFunction(value) {
        return value + 1;
    }

    const source = bytecodeFunction.toString();

    assert(typeof source, "string", "toString type");
    assert(source.length > 0, true, "toString non-empty");

    if (source.indexOf("bytecodeFunction") >= 0)
        return "source";
    assert(source.indexOf("[native code]") >= 0, true, "toString placeholder");
    return "placeholder";
}

async function testAsyncAwait() {
    const first = await Promise.resolve(21);
    const second = await (async value => value * 2)(first);
    return second;
}

async function main() {
    const parts = [];
    const metaPath = (() => {
        const url = importMetaUrl.startsWith("file://") ?
            importMetaUrl.slice("file://".length) : importMetaUrl;
        const marker = "tests/test_bytecode_import_meta_helper.js";
        const index = url.indexOf(marker);
        return index >= 0 ? url.slice(index) : url;
    })();

    parts.push("bigint=" + testBigIntAndClosures());
    parts.push("generator=" + testGenerators());
    parts.push("iter=" + testMapAndSetIteration());
    parts.push("tostring=" + testFunctionToString());
    parts.push("meta=" + metaPath);
    parts.push("async=" + (await testAsyncAwait()));

    print(parts.join("|"));
}

main().catch(error => {
    print(String(error));
    std.exit(1);
});
