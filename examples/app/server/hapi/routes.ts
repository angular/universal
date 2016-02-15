
module.exports = function(ROOT) {

  var universalPath = `${ROOT}/dist/examples/app/universal`;

  var appPage = require(`${universalPath}/test_page/app`);
  var todoApp = require(`${universalPath}/todo/app`);
  var routerApp = require(`${universalPath}/test_router/app`);

  var {provide} = require('angular2/core');
  var {ROUTER_PROVIDERS, APP_BASE_HREF} = require('angular2/router');

  var {
    HTTP_PROVIDERS,
    SERVER_LOCATION_PROVIDERS,
    REQUEST_URL,
    PRIME_CACHE,
    queryParamsToBoolean
  } = require('angular2-universal-preview');
  // require('angular2-universal')

  function static(path, route) {
    console.log(`${ROOT + route}`)
    return {
      method: 'GET',
      path,
      handler: {
        directory: {
          path: `${ROOT + route}`
        }
      }
    }
  }

  function ngRouter(request, reply) {
    let baseUrl = '/examples/router';
    let url = request.originalUrl.replace(baseUrl, '') || '/';
    let queryParams = queryParamsToBoolean(request.query);

    let options = Object.assign(queryParams, {
      // client url for systemjs
      componentUrl: 'examples/app/universal/test_router/browser',
      // ensure that we test only server routes
      client: false,

      App: routerApp.App,
      providers: [
        // HTTP_PROVIDERS,
        provide(APP_BASE_HREF, { useValue: baseUrl }),
        provide(REQUEST_URL, { useValue: url }),
        ROUTER_PROVIDERS,
        SERVER_LOCATION_PROVIDERS,
      ],
      data: {},

      preboot: queryParams.preboot === false ? null : true

    });

    reply.view('app/universal/test_router/index', options);
  }

  function get(path, route) {
    return {
      method: 'GET',
      path,
      handler: route
    };
  }

  var router = [{
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    path:'/{param*}',
    handler: (request, reply) => {
      reply({
        'route': 'Sorry this page does not exist!'
      })
    }
  },{
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      let queryParams = queryParamsToBoolean(request.query);
      console.log('queryParams', queryParams);
      let options = Object.assign(queryParams, {
        // client url for systemjs
        componentUrl: 'examples/app/universal/test_page/browser',

        App: appPage.App,
        providers: [
          // HTTP_PROVIDERS,
          // SERVER_LOCATION_PROVIDERS,
          // provide(BASE_URL, {useExisting: req.originalUrl}),
          // provide(PRIME_CACHE, {useExisting: true})
        ],
        data: {},

        preboot: queryParams.preboot === false ? null : {
          start: true,
          appRoot: 'app',         // selector for root element
          freeze: 'spinner',     // show spinner w button click & freeze page
          replay: 'rerender',    // rerender replay strategy
          buffer: true,          // client app will write to hidden div until bootstrap complete
          debug: false,
          uglify: true,
          presets: ['keyPress', 'buttonPress', 'focus']
        }

      });

      reply.view('app/universal/test_page/index', options);
    }
  }, {
    method: 'GET',
    path: '/examples/falcor_todo',
    handler: (request, reply) => {
      let queryParams = queryParamsToBoolean(request.query);
      let options = Object.assign(queryParams, {
        // client url for systemjs
        componentUrl: 'examples/app/universal/falcor_todo/client',

        App: todoApp.TodoApp,
        providers: [
          // HTTP_PROVIDERS,
          // SERVER_LOCATION_PROVIDERS,
          // provide(REQUEST_URL, {useExisting: req.originalUrl}),
          // provide(PRIME_CACHE, {useExisting: true})
        ],
        data: {},

        preboot: queryParams.preboot === false ? null : true

      });

      reply.view('app/universal/falcor_todo/index', options);
    }
  }, {
    method: 'GET',
    path: '/examples/todo',
    handler: (request, reply) => {
      let queryParams = queryParamsToBoolean(request.query);
      let options = Object.assign(queryParams, {
        // client url for systemjs
        componentUrl: 'examples/app/universal/todo/browser',

        App: todoApp.TodoApp,
        providers: [
          // HTTP_PROVIDERS,
          // SERVER_LOCATION_PROVIDERS,
          // provide(BASE_URL, {useExisting: req.originalUrl}),
          // provide(PRIME_CACHE, {useExisting: true})
        ],
        data: {},

        preboot: queryParams.preboot === false ? null : true

      });

      reply.view('app/universal/todo/index', options);

    }
  }];

  // router.use(historyApiFallback({
  //   // verbose: true
  // }));
  //


  var staticRoutes = [
    static('/src/{param*}', '/src'),
    static('/angular2/{param*}', '/node_modules/angular2'),
    static('/rxjs/{param*}', '/node_modules/rxjs'),
    static('/node_modules/{param*}', '/node_modules'),
    static('/examples/app/{param*}', '/dist/examples/app'),
    static('/css/{param*}', '/examples/app/public/css')
  ];

  var ngRoutes = [
    get('/examples/router', ngRouter),
    get('/examples/router/home', ngRouter),
    get('/examples/router/about', ngRouter)
  ];

  return router.concat(staticRoutes).concat(ngRoutes);
};
