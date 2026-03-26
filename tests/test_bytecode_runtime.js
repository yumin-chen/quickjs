function test_closure() {
    let x = 10;
    return function(y) {
        return x + y;
    };
}

let f = test_closure();
if (f(5) !== 15) throw new Error("Closure failed");

let arr = [1, 2, 3].map(x => x * 2);
if (arr[0] !== 2 || arr[1] !== 4 || arr[2] !== 6) throw new Error("Array map failed");

let p = Promise.resolve(42);
p.then(v => {
    if (v !== 42) throw new Error("Promise failed");
    console.log("Bytecode runtime test passed");
});
