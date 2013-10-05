!function(factory) {
  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    Slash = factory();
  }
}(function() {

  function trim(str, base) {
    str = str.replace(/^[\s]+|[\s\/]+$/g, '');

    if (str.indexOf(base) === 0) {
      str = str.substring(base.length);
    }

    return str;
  }

  function bind(el, e, fn) {
    el.addEventListener(e, fn, false);
  }

  function unbind(el, e, fn) {
    el.removeEventListener(e, fn);
  }

  function hashbang(uri) {
    var id = uri.replace(/^#/, '')
      , node = document.getElementById(id)
      , x = window.pageXOffset ? window.pageXOffset : document.body.scrollLeft
      , y = window.pageYOffset ? window.pageYOffset : document.body.scrollTop
      , dummy = document.createElement('div');

    if (node) {
      node.id = '';
    }

    dummy.id = id || '_';
    dummy.style.position = 'absolute';
    dummy.style.width = 0;
    dummy.style.height = 0;
    dummy.style.left = x + 'px';
    dummy.style.top = y + 'px';
    dummy.style.padding = 0;
    dummy.style.margin = 0;

    document.body.appendChild(dummy);
    window.location.hash = '#' + dummy.id;
    document.body.removeChild(dummy);

    if (node) {
      node.id = id;
    }
  }


  var Slash = function(def) {
    if (this === window) {
      return new Slash(def);
    }

    var that = this;

    this.base = this.constructor.base;
    this.context = false;
    this.events = { route: [], match: [], done: [] }
    this.routes = [];
    this.usePopstate = this.constructor.usePopstate && this.constructor.supportsPopstate;

    this.routeHashchange = function() {
      that.routeHashchange();
    };

    this.routePopstate = function() {
      that.routePopstate();
    };

    if (typeof dev === 'function') {
      def(this);
    }
  };

  Slash.base = '/';
  Slash.usePopstate = false;
  Slash.supportsPopstate = 'onpopstate' in window;

  Slash.prototype = {
    constructor: Slash,

    listen: function() {
      bind(window, 'popstate', this.routePopstate);
      bind(window, 'hashchange', this.routeHashchange);
      this.route();
      return this;
    },

    deafen: function() {
      unbind(window, 'popstate', this.routePopstate);
      unbind(window, 'hashchange', this.routeHashchange);
      return this;
    },

    on: function(e, fn) {
      this.events[e].push(fn);
      return this;
    },

    when: function(expr) {
      var params = expr.match(/(:[^\/]*)|(\*[^\/]*)/g) || []
        , regex
        , route = new Slash.Route;

      // Escape all special characters except "*".
      regex = expr.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&');

      // Format parameters and modify regex to match them.
      params.forEach(function(param, index) {
        regex = regex.replace(param, param.charAt(0) === ':' ? '([^/]*)' : '(.*?)');
        params[index] = param.substring(1);
      });

      // Apply formatted parameters and regular expression to the route.
      route.params = params;
      route.regex = new RegExp('^' + regex + '$');

      this.routes.push(route);

      return route;
    },

    route: function(uri) {
      var that = this
        , uri = uri ? trim(uri, this.base) : this.uri();

      if (fireRoute() === false) {
        return this;
      }

      if (doRoute(uri) === false) {
        return this;
      }

      fireDone();

      return this;


      function doRoute(uri) {
        for (var a = 0; a < that.routes.length; a++) {
          if (that.routes[a].exec(uri)) {
            if (fireMatch(that.routes[a]) === false) {
              return false;
            }

            return;
          }
        }

        return false;
      }

      function fireDone() {
        for (var a = 0; a < that.events.done.length; a++) {
          that.events.done[a](that, uri)
        }
      }

      function fireMatch(route) {
        for (var a = 0; a < that.events.match.length; a++) {
          if (that.events.match[a](that, uri, route) === false) {
            return false;
          }
        }
      }

      function fireRoute() {
        for (var a = 0; a < that.events.route.length; a++) {
          if (that.events.route[a](that, uri) === false) {
            return false;
          }
        }
      }
    },

    routePopstate: function() {
      if (this.usePopstate && this.constructor.supportsPopstate) {
        this.route();
      }

      return this;
    },

    routeHashchange: function() {
      if (!this.usePopstate || !this.constructor.supportsPopstate) {
        this.route();
      }

      return this;
    },

    uri: function(uri) {
      if (arguments.length) {
        uri = this.base + uri;

        if (this.usePopstate && window.history.pushState) {
          window.history.pushState({}, '', uri);
        } else {
          hashbang(uri);
        }

        return this;
      }

      if (this.usePopstate && window.history.pushState) {
        uri = window.location.href.replace(/http(s)?\:\/\/[^\/]+/, '');
      } else {
        uri = window.location.hash.substring(1);
      }

      return trim(uri, this.base);
    }
  };


  Slash.Route = function(opts) {
    this.regex = /^$/;
    this.params = {};
    this.matched = {};
    this.executed = false;
    this.err = false;
    this.thens = [];
    this.fails = [];
  };

  Slash.Route.prototype = {
    exec: function(uri) {
      var args = uri.match(this.regex);

      if (args) {
        args.shift();

        for (var a = 0; a < this.params.length; a++) {
          var param = this.params[a];

          if (param) {
            this.matched[param] = args[a];
          } else {
            this.matched[a] = args[a];
          }
        }

        for (var a = 0; a < this.thens.length; a++) {
          var then = this.thens[a];
          try {
            then.call(then, this.matched);
          } catch (e) {
            for (var a = 0; a < this.fails.length; a++) {
              var fail = this.fails[b];
              fail.call(fail, this.matched);
            }
          }
        }

        return true;
      }

      return false;
    },

    then: function(fn) {
      if (this.executed) {
        if (!this.err) {
          fn(this.matched);
        }
      } else {
        this.thens.push(fn);
      }

      return this;
    },

    fail: function(fn) {
      if (this.executed) {
        if (this.err) {
          fn(this.err);
        }
      } else {
        this.fails.push(fn);
      }

      return this;
    }
  };


  return Slash;

});