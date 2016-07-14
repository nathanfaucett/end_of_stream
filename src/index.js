var once = require("@nathanfaucett/once"),
    isArray = require("@nathanfaucett/is_array"),
    isFunction = require("@nathanfaucett/is_function");


module.exports = endOfStream;


function endOfStream(stream, options, callback) {
    var cb, ws, rs, readable, writable;

    if (isFunction(options)) {
        callback = options;
        options = {};
    }

    cb = once(callback);
    ws = stream._writableState;
    rs = stream._readableState;
    readable = options.readable || (options.readable !== false && stream.readable);
    writable = options.writable || (options.writable !== false && stream.writable);

    function onFinish() {
        writable = false;
        if (!readable) {
            cb();
        }
    }

    function onEnd() {
        readable = false;
        if (!writable) {
            cb();
        }
    }

    function onExit(exitCode) {
        if (exitCode) {
            cb(new Error("exited with error code: " + exitCode));
        } else {
            cb();
        }
    }

    function onClose() {
        if (readable && !(rs && rs.ended)) {
            return cb(new Error("premature close"));
        }
        if (writable && !(ws && ws.ended)) {
            return cb(new Error("premature close"));
        }
    }

    function onRequest() {
        stream.req.on("finish", onFinish);
    }

    function onLegacyFinish() {
        if (!stream.writable) {
            onFinish();
        }
    }

    if (isRequest(stream)) {
        stream.on("complete", onFinish);
        stream.on("abort", onClose);
        if (stream.req) {
            onRequest();
        } else {
            stream.on("request", onRequest);
        }
    } else if (writable && !ws) {
        stream.on("end", onLegacyFinish);
        stream.on("close", onLegacyFinish);
    }

    if (isChildProcess(stream)) {
        stream.on("exit", onExit);
    }

    stream.on("end", onEnd);
    stream.on("finish", onFinish);
    if (options.error !== false) {
        stream.on("error", cb);
    }
    stream.on("close", onClose);

    return function removeListeners() {
        stream.removeListener("complete", onFinish);
        stream.removeListener("abort", onClose);
        stream.removeListener("request", onRequest);
        if (stream.req) {
            stream.req.removeListener("finish", onFinish);
        }
        stream.removeListener("end", onLegacyFinish);
        stream.removeListener("close", onLegacyFinish);
        stream.removeListener("finish", onFinish);
        stream.removeListener("exit", onExit);
        stream.removeListener("end", onEnd);
        stream.removeListener("error", cb);
        stream.removeListener("close", onClose);
    };
}

function isRequest(stream) {
    return stream.setHeader && isFunction(stream.abort);
}

function isChildProcess(stream) {
    return stream.stdio && isArray(stream.stdio) && stream.stdio.length === 3;
}
