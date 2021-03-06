
#
# App = feedbackers
#

app = angular.module 'feedbackers', [
  'ngCookies'
  'ngResource'
  'ngSanitize'
  'ngAnimate'
  'ui.utils'
  'ui.bootstrap'
  'ui.router'
  'ngGrid'
  'angular-flash.service'
  'angular-flash.flash-alert-directive'
  'ui.bootstrap.showErrors'
  'config'
  'toaster'
  'gettext'
]

app.config [
  '$stateProvider'
  '$urlRouterProvider'
  '$httpProvider'
  'flashProvider'
  'ENV'
  (
    $stateProvider
    $urlRouterProvider
    $httpProvider
    flashProvider
    ENV
  ) ->
    'use strict'
    app.api = ENV.baseUrl + ENV.apiPath
    
    # Support bootstrap 3.0 'alert-danger' class with error flash types
    flashProvider.errorClassnames.push 'alert-danger'
    
    # This is required for Browser Sync to work poperly
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
    
    # Default route
    $urlRouterProvider.otherwise '/dashboard'
    
    # Routes using states
    $stateProvider
    .state 'app',
      abstract: true
      url: ''
      templateUrl: 'templates/app.html'
    .state 'app.survey',
      url: '/survey/:code'
      templateUrl: 'templates/survey.html'
      resolve:
        survey_request: [
          '$http'
          '$stateParams'
          ($http, $stateParams) ->
            return $http.get "#{app.api}surveys/code/#{$stateParams.code}"
        ]
      controller: [
        '$scope'
        'survey_request',
        ($scope, survey_request) ->
          $scope.survey_data = survey_request.data
      ]
    .state 'app.dashboard',
      url: '/dashboard'
      templateUrl: 'templates/dashboard.html'
      resolve:
        companies_request: [
          '$http'
          ($http) ->
            return $http.get "#{app.api}companies"
        ]
      controller: [
        '$scope'
        'companies_request',
        ($scope, companies_request) ->
          $scope.companies_data = companies_request.data
      ]
]

#
# feedbackers App Run()
#
app.run [
  '$rootScope'
  'gettextCatalog'
  '$log'
  (
    $rootScope
    gettextCatalog
    $log
  ) ->
    gettextCatalog.setCurrentLanguage 'en'
]

# ---> Do not delete this comment (Values) <---
# ---> Do not delete this comment (Constants) <---