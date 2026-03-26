import * as std from "std";
import * as os from "os";

function assert(actual, expected, message) {
    if (arguments.length === 1)
        expected = true;

    if (Object.is(actual, expected))
        return;

    throw Error("assertion failed: got |" + actual + "|" +
                ", expected |" + expected + "|" +
                (message ? " (" + message + ")" : ""));
}

assert(typeof std.evalScript, "undefined", "std.evalScript");
assert(typeof std.loadScript, "undefined", "std.loadScript");
assert(typeof std.parseExtJSON, "undefined", "std.parseExtJSON");
assert(typeof os.Worker, "undefined", "os.Worker");

print("restrictions=ok");
