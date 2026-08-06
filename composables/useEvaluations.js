import { ref } from 'vue'
import { apiService } from '~/services/api.service'
import { useToast } from './useToast'

export const useEvaluations = () => {
  const { success, error } = useToast()
  
  const surveys = ref([])
  const isLoading = ref(false)
  const currentSurvey = ref(null)
  const currentSubject = ref(null)
  const savedAnswers = ref(null)

  const fetchSurveys = async () => {
    try {
      isLoading.value = true
      const response = await apiService.getEvaluations()
      surveys.value = response || []
      return surveys.value
    } catch (err) {
      error('Failed to load evaluations: ' + err.message, 4000)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchAnswers = async (surveyId, classId, subjectId) => {
    try {
      isLoading.value = true
      const response = await apiService.getEvaluationAnswers(surveyId, classId, subjectId)
      savedAnswers.value = response
      return response
    } catch (err) {
      error('Failed to load saved answers: ' + err.message, 4000)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const saveAnswers = async (surveyId, classId, subjectId, answers) => {
    try {
      isLoading.value = true
      const response = await apiService.saveEvaluationAnswers(surveyId, classId, subjectId, answers)
      success('Evaluation saved successfully!', 3000)
      return response
    } catch (err) {
      error('Failed to save evaluation: ' + err.message, 4000)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getSurveyForSubject = (surveyId) => {
    return surveys.value.find(s => s.id === surveyId)
  }

  const getSubjectStatus = (surveyId, subjectId) => {
    const survey = getSurveyForSubject(surveyId)
    if (!survey) return 'pending'
    const subject = survey.subjects.find(s => s.id === subjectId)
    return subject ? subject.status : 'pending'
  }

  return {
    surveys,
    isLoading,
    currentSurvey,
    currentSubject,
    savedAnswers,
    fetchSurveys,
    fetchAnswers,
    saveAnswers,
    getSurveyForSubject,
    getSubjectStatus
  }
}