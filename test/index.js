var tape = require("tape"),
    fs = require("fs"),
    cp = require("child_process"),
    net = require("net"),
    endOfStream = require("..");


tape("endOfStream(stream: WriteStream [, options], callback) premature close", function(assert) {
    var ws = fs.createWriteStream("/dev/null");
    endOfStream(ws, function onDone(error) {
        assert.equal(!!error, true);
        assert.end();
    });
    ws.close();
});
tape("endOfStream(stream: ReadStream [, options], callback) premature close", function(assert) {
    var rs = fs.createReadStream("/dev/random");
    endOfStream(rs, function onDone(error) {
        assert.equal(!!error, true);
        assert.end();
    });
    rs.close();
});

tape("endOfStream(stream: ReadStream [, options], callback)", function(assert) {
    var rs = fs.createReadStream(__filename);
    endOfStream(rs, function onDone(error) {
        assert.equal(!error, true);
        assert.end();
    });
    rs.pipe(fs.createWriteStream("/dev/null"));
});

tape("endOfStream(stream: ChildProcess [, options], callback)", function(assert) {
    var exec = cp.exec("echo hello world");
    endOfStream(exec, function onDone(error) {
        assert.equal(!error, true);
        assert.end();
    });
});
tape("endOfStream(stream: ChildProcess [, options], callback) spawn task", function(assert) {
    var spawn = cp.spawn("echo", ["hello world"]);
    endOfStream(spawn, function onDone(error) {
        assert.equal(!error, true);
        assert.end();
    });
});

tape("endOfStream(stream: Socket [, options], callback)", function(assert) {
    var socket = net.connect(50000);
    endOfStream(socket, function onDone(error) {
        assert.equal(!!error, true);
        assert.end();
    });
});
tape("endOfStream(stream: ServerSocket [, options], callback)", function(assert) {
    var called = false,
        server = net.createServer(function(socket) {
            endOfStream(socket, function(error) {
                assert.equal(!!error, true);
                if (called === false) {
                    called = true;
                    server.close();
                    assert.end();
                }
            });
            socket.destroy();
        }).listen(30000, function() {
            var socket = net.connect(30000);

            endOfStream(socket, function(error) {
                assert.equal(!error, true);
                if (called === false) {
                    called = true;
                    server.close();
                    assert.end();
                }
            });
        });
});
