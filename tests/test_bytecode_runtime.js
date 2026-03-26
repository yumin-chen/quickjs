function assert(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message + ": expected " + expected + ", got " + actual);
    }
}

function assert_throws(expected_error, func) {
    try {
        func();
    } catch (e) {
        if (e instanceof expected_error) {
            return;
        }
        throw new Error("Expected " + expected_error.name + " but got " + e);
    }
    throw new Error("Expected " + expected_error.name + " but no error was thrown");
}

console.log("Testing bytecode-only runtime safety and functionality...");

// 1. Ensure core features still work
// BigInt
assert(1n + 2n, 3n, "BigInt addition");

// Closures with mutation
function make_counter() {
    let count = 0;
    return function() {
        return ++count;
    };
}
let counter = make_counter();
assert(counter(), 1, "Counter 1");
assert(counter(), 2, "Counter 2");

// Generators
function* gen() {
    yield 1;
    yield 2;
}
let g = gen();
assert(g.next().value, 1, "Generator 1");
assert(g.next().value, 2, "Generator 2");

// Async/await
async function async_test() {
    return await Promise.resolve(42);
}
async_test().then(val => {
    assert(val, 42, "Async/await");
});

// Map/Set iteration
let m = new Map();
m.set("a", 1);
for (let [k, v] of m) {
    assert(k, "a", "Map key");
    assert(v, 1, "Map value");
}

// 2. Test std functions are absent
import * as std from "std";
import * as os from "os";

assert(std.evalScript, undefined, "std.evalScript should be absent");
assert(std.loadScript, undefined, "std.loadScript should be absent");
assert(std.parseExtJSON, undefined, "std.parseExtJSON should be absent");

// 3. Test os.Worker is absent
assert(os.Worker, undefined, "os.Worker should be absent");

// 4. Test Function.prototype.toString() on a bytecode function
function test_func(a, b) { return a + b; }
let s = test_func.toString();
if (typeof s !== "string" || s.length === 0) {
    throw new Error("Function.prototype.toString() failed");
}
console.log("toString() result: " + s.substring(0, 20) + "...");

// 5. Test import.meta.url
// This depends on how the module is loaded, but it shouldn't crash.
console.log("import.meta.url: " + import.meta.url);

// 6. Test dynamic feature TypeErrors (Behavioral check)
if (typeof eval !== "undefined") {
    assert_throws(TypeError, function() { eval("1+1"); });
}

if (typeof Function !== "undefined") {
    assert_throws(TypeError, function() { new Function("return 1"); });
}

if (typeof JSON !== "undefined") {
    assert_throws(TypeError, function() { JSON.parse("{}"); });
}

console.log("All comprehensive tests passed");
