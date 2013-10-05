describe('Events', function() {
  it('Should trigger `route` events.', function(done) {
    var sl = new Slash;

    sl.on('route', function(route, uri) {
      uri.should.equal('test');
      done();
    });

    sl.when('*');
    sl.route('test');
  });

  it('Should trigger `match` events.', function(done) {
    var sl = new Slash;

    sl.on('match', function(route, uri) {
      uri.should.equal('test');
      done();
    });

    sl.when('*');
    sl.route('test');
  });

  it('Should trigger `done` events.', function(done) {
    var sl = new Slash;

    sl.on('done', function(route, uri) {
      uri.should.equal('test');
      done();
    });

    sl.when('*');
    sl.route('test');
  });
});

describe('Routing', function() {
  it('Should support splats.', function(done) {
    var sl = new Slash;

    sl.when('*uri').then(function(params) {
      params.uri.should.equal('my/test/uri');
      done();
    });

    sl.route('my/test/uri');
  });

  it('Should support parameters.', function(done) {
    var sl = new Slash;

    sl.when('my/:test/:uri').then(function(params) {
      params.test.should.equal('test');
      params.uri.should.equal('uri');
      done();
    });

    sl.route('my/test/uri');
  });

  it('Should support both splats and parameters.', function(done) {
    var sl = new Slash;

    sl.when('my/*test/:uri').then(function(params) {
      params.test.should.equal('test1/test2');
      params.uri.should.equal('uri');
      done();
    });

    sl.route('my/test1/test2/uri');
  });

  it('Should work with both `history.pushState` and URI fragments.', function() {
    var sl = new Slash;

    sl.uri('test');
    window.location.hash.should.equal('#/test');
    sl.uri('');

    sl.usePopstate = true;

    sl.uri('test');
    window.location.pathname.should.equal('/test');
    sl.uri('tests/');
  });

  it('Should cancel routing if a match event returns false.', function() {
    var sl = new Slash
      , resMatch = false
      , resDone = false
      , fnMatch = function() {
          resMatch = true;
          return false;
        }
      , fnDone = function() {
          resRoute = true;
        };

    sl.on('match', fnMatch);
    sl.on('done', fnDone);
    sl.when('*');
    sl.route();

    resMatch.should.equal(true);
    resDone.should.equal(false);
  });

  it('Should match routes.', function(done) {
    var sl = new Slash
      , matched = false;

    sl.when('*').then(function() {
      matched = true;
    });

    sl.on('done', function() {
      matched.should.equal(true);
      done();
    });

    sl.route();
  });
});