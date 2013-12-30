var macros     = require('./macros')
  , statsd     = require('statsd-parser')
  , Lynx       = macros.lynx
  , test       = macros.test
  , udpServer  = macros.udpServer
  , connection = macros.connection
  , count      = 0
  ;

test('MTU', function (t) {

  var message, packet;
  var fixtures = [ 'five:1|c', 'eight:-1|c', 'nine:1|c', 'a:1|c\nb:1|c', 'c:1|c', 'd:1|c' ];

  var server = udpServer(function (message, remote) {
    var str = message.toString('utf8');
    t.ok(fixtures.indexOf(str) > -1, 'found `' + str + '` in expected send list');

    count++;
    if (count == 6) {
      wrapUp();
    }
  });

  function skip_error(e) {
    t.equal(e.message, 'Stat is larger than configured datagram MTU; skipping', 'Skipped single stat too large for packet');
  }

  t.equal(connection.MTU, 1500, 'MTU size should default to 1500');

  var tinyMTU = new Lynx('localhost', macros.udpServerPort, { MTU: 10, on_error: skip_error });
  t.equal(tinyMTU.MTU, 10, 'MTU size option respected');
  tinyMTU.increment('thirteenchars');
  tinyMTU.increment(['nine', 'five']);
  tinyMTU.decrement('eight');
  connection.increment(['a', 'b']);
  tinyMTU.increment(['c', 'd']); // should be split, 11 char with newline

  function wrapUp() {
    server.close();
    t.end();
  }
});
