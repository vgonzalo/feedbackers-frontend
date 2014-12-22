#
# Survey Controller
#

app.controller 'SurveyCtrl', [
  '$scope'
  '$http'
  '$log'
  '$timeout'
  'gettextCatalog'
  'toaster'
  (
    $scope
    $http
    $log
    $timeout
    gettextCatalog
    toaster
  ) ->

    $scope.scores = [
      number: 0
      style: 'circle-0'
    ,
      number: 25
      style: 'circle-25'
    ,
      number: 50
      style: 'circle-50'
    ,
      number: 75
      style: 'circle-75'
    ,
      number: 100
      style: 'circle-100'
    ]

    $scope.default_score = 50

    $scope.questions = [
      title: 'Overall Satisfaction of service:'
      score: $scope.default_score
    ,
      title: 'Professionalism and Courtesy of employee'
      score: $scope.default_score
    ,
      title: 'How satisfied were you with the wait time at this store?'
      score: $scope.default_score
    ,
      title: 'How satisfied were you with the in-store setup of your phone?'
      score: $scope.default_score
    ]

    
]