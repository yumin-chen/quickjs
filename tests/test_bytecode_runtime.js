
console.log("Hello from bytecode runtime!");

function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

console.log("fib(10) =", fib(10));

const obj = {
    a: 1,
    b: [1, 2, 3],
    c: { d: "hello" }
};

console.log("obj.c.d =", obj.c.d);

// test Function.prototype.toString
function testFunc() { return 42; }
console.log("testFunc.toString().length > 0:", testFunc.toString().length > 0);

// test class
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return `(${this.x}, ${this.y})`;
    }
}

const p = new Point(10, 20);
console.log("p.toString() =", p.toString());
