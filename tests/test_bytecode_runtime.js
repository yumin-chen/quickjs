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

console.log("Testing bytecode-only runtime safety...");

// Test eval
if (typeof eval !== "undefined") {
    assert_throws(TypeError, function() {
        eval("1 + 1");
    });
} else {
    console.log("eval is undefined");
}

// Test new Function
if (typeof Function !== "undefined") {
    assert_throws(TypeError, function() {
        new Function("return 1");
    });
} else {
    console.log("Function is undefined");
}

// Test JSON.parse
if (typeof JSON !== "undefined") {
    assert_throws(TypeError, function() {
        JSON.parse('{"a": 1}');
    });
} else {
    console.log("JSON is undefined");
}

// Test RegExp compilation
if (typeof RegExp !== "undefined") {
    assert_throws(TypeError, function() {
        new RegExp("abc["); // Compilation triggered at runtime
    });

    // Note: literal RegExps /abc/ are pre-compiled by qjsc, so they should work.
    var re = /abc/;
    if (re.exec("abc") === null) {
        throw new Error("Pre-compiled RegExp failed");
    }
} else {
    console.log("RegExp is undefined");
}

console.log("All tests passed (TypeErrors thrown as expected)");
