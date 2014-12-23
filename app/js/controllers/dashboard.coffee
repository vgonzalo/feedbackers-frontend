#
# Survey Controller
#

app.controller 'DashboardCtrl', [
  '$scope'
  '$http'
  '$log'
  '$timeout'
  (
    $scope
    $http
    $log
    $timeout
  ) ->
    $scope.companies = $scope.companies_data.companies
]