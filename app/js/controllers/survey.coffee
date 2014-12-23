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

    $scope.vars = {}
    $scope.change_language_text = 'Español'

    $scope.default_score = 50
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

    if $scope.survey_data.survey
      $scope.vars.current_step = 1

      $scope.survey    = $scope.survey_data.survey
      $scope.customer  = $scope.survey_data.survey.customer
      $scope.company   = $scope.survey_data.survey.company
      $scope.questions = $scope.survey_data.survey.company.questions
      $scope.feedback  = {}
      
      $scope.feedback.id      = $scope.survey.id
      $scope.feedback.user_id = null
      $scope.feedback.message = ""
      $scope.feedback.answers = []

      for question in $scope.questions
        answer = {}
        answer.question_id = question.id
        if question.question_type == 'quality'
          answer.value = $scope.default_score
        else if question.question_type == 'select'
          answer.value = question.question_items[0].id
        else if question.question_type == 'checkbox'
          answer.items = {}
          for item in question.question_items
            answer.items[item.id] = false
        $scope.feedback.answers.push answer

      $log.info $scope.feedback.answers
    else if $scope.survey_data.message
      $scope.vars.current_step = 0
      $scope.vars.message = $scope.survey_data.message

    $scope.finish = () ->
      $http.put "#{app.api}surveys", $scope.feedback
        .success (data) ->
          toaster.pop 'success', 'Success', 'Survey saved'
          $scope.vars.current_step = 4
        .error (data) ->
          toaster.pop 'error', 'Error', 'Please try again later'

    $scope.updateChangeLanguageText = () ->
      if gettextCatalog.currentLanguage == 'en'
        $scope.change_language_text = 'Español'
      else if gettextCatalog.currentLanguage == 'es'
        $scope.change_language_text = 'English'

    $scope.changeLanguage = () ->
      if gettextCatalog.currentLanguage == 'es'
        gettextCatalog.setCurrentLanguage 'en'
      else if gettextCatalog.currentLanguage == 'en'
        gettextCatalog.setCurrentLanguage 'es'
      $scope.updateChangeLanguageText()

    $scope.updateChangeLanguageText()
]