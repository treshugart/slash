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
    this.fails = [];
    this.usePopstate = this.constructor.usePopstate && this.constructor.supportsPopstate;

    this.routePopstate = function() {
      if (that.usePopstate && that.constructor.supportsPopstate) {
        that.route();
      }
    };

    this.routeHashchange = function() {
      if (!that.usePopstate || !that.constructor.supportsPopstate) {
        that.route();
      }
    };

    if (typeof def === 'function') {
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

    when: function(expr, callback) {
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
      route.callback = callback;
      route.params = params;
      route.regex = new RegExp('^' + regex + '$');

      this.routes.push(route);

      return route;
    },

    fail: function(callback) {
      this.fails.push(callback);
      return this;
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
          try {
            var matched = that.routes[a].exec(uri);
          } catch (e) {
            doFail(e, uri, that.routes[a]);
          }

          if (matched) {
            if (fireMatch(that.routes[a]) === false) {
              return false;
            }

            return;
          }
        }

        return false;
      }

      function doFail(e, uri, route) {
        if (!that.fails.length) {
          throw e;
        }

        for (var a = 0; a < that.fails.length; a++) {
          that.fails[a](e, uri, route);
        }
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
    opts = opts || {};
    this.callback = opts.callback || function(){};
    this.regex = opts.regex || /^$/;
    this.params = opts.params || {};
  };

  Slash.Route.prototype = {
    exec: function(uri) {
      var args = uri.match(this.regex);

      if (args) {
        args.shift();

        var temp = {};

        for (var a = 0; a < this.params.length; a++) {
          var param = this.params[a];

          if (param) {
            temp[param] = args[a];
          } else {
            temp[a] = args[a];
          }
        }

        this.callback(this.callback, temp);

        return true;
      }

      return false;
    }
  };


  return Slash;

});