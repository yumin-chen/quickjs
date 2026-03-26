(function() {
    function makeCounter(seed) {
        let value = seed;
        return function(step) {
            value += step;
            return value;
        };
    }

    const counter = makeCounter(1);
    globalThis.__bytecode_exec_result = counter(2) + ":" + counter(3);
})();
