#include "../quickjs-libc.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

extern const uint8_t test_bytecode_corrupt_bc[];
extern const uint32_t test_bytecode_corrupt_bc_size;

static int expect_valid_execution(JSContext *ctx)
{
    JSValue obj, ret, global_obj, result;
    const char *str;
    int status;

    obj = JS_ReadObject(ctx, test_bytecode_corrupt_bc,
                        test_bytecode_corrupt_bc_size,
                        JS_READ_OBJ_BYTECODE);
    if (JS_IsException(obj)) {
        JS_FreeValue(ctx, JS_GetException(ctx));
        fprintf(stderr, "valid bytecode failed to decode\n");
        return 1;
    }

    ret = JS_EvalFunction(ctx, obj);
    if (JS_IsException(ret)) {
        JS_FreeValue(ctx, JS_GetException(ctx));
        fprintf(stderr, "valid bytecode failed to execute\n");
        return 1;
    }
    JS_FreeValue(ctx, ret);

    global_obj = JS_GetGlobalObject(ctx);
    result = JS_GetPropertyStr(ctx, global_obj, "__bytecode_exec_result");
    JS_FreeValue(ctx, global_obj);
    if (JS_IsException(result)) {
        JS_FreeValue(ctx, JS_GetException(ctx));
        fprintf(stderr, "could not read execution result\n");
        return 1;
    }

    str = JS_ToCString(ctx, result);
    JS_FreeValue(ctx, result);
    if (!str) {
        JS_FreeValue(ctx, JS_GetException(ctx));
        fprintf(stderr, "execution result was not a string\n");
        return 1;
    }

    status = strcmp(str, "3:6");
    JS_FreeCString(ctx, str);
    if (status != 0) {
        fprintf(stderr, "unexpected execution result\n");
        return 1;
    }
    return 0;
}

static int expect_read_failure(JSContext *ctx, const uint8_t *buf, size_t len,
                               const char *label)
{
    JSValue obj;

    obj = JS_ReadObject(ctx, buf, len, JS_READ_OBJ_BYTECODE);
    if (!JS_IsException(obj)) {
        JS_FreeValue(ctx, obj);
        fprintf(stderr, "%s unexpectedly decoded\n", label);
        return 1;
    }

    JS_FreeValue(ctx, JS_GetException(ctx));
    return 0;
}

int main(void)
{
    JSRuntime *rt;
    JSContext *ctx;
    uint8_t *corrupt_buf;
    int ret;

    rt = JS_NewRuntime();
    if (!rt) {
        fprintf(stderr, "JS_NewRuntime failed\n");
        return 1;
    }
    ctx = JS_NewContext(rt);
    if (!ctx) {
        fprintf(stderr, "JS_NewContext failed\n");
        JS_FreeRuntime(rt);
        return 1;
    }

    ret = 0;
    ret |= expect_valid_execution(ctx);
    ret |= expect_read_failure(ctx, test_bytecode_corrupt_bc,
                               test_bytecode_corrupt_bc_size / 2,
                               "truncated bytecode");

    corrupt_buf = malloc(test_bytecode_corrupt_bc_size);
    if (!corrupt_buf) {
        fprintf(stderr, "malloc failed\n");
        ret = 1;
        goto done;
    }

    memcpy(corrupt_buf, test_bytecode_corrupt_bc, test_bytecode_corrupt_bc_size);
    corrupt_buf[0] ^= 0xff;
    ret |= expect_read_failure(ctx, corrupt_buf, test_bytecode_corrupt_bc_size,
                               "corrupted bytecode");
    free(corrupt_buf);

done:
    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
    return ret;
}
