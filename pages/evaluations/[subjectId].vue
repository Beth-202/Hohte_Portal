<template>
  <div class="evaluation-form-container">
    <!-- Toast Container -->
    <div class="toast-container">
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="removeToast(toast.id)"
      />
    </div>

    <!-- Header -->
    <header class="form-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <h1 class="form-title">{{ translate('evaluations.evaluating') }}</h1>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ translate('common.loading') }}</p>
    </div>

    <!-- Form -->
    <form v-else-if="survey && subject" class="evaluation-form" @submit.prevent="submitEvaluation">
      <!-- Subject Info -->
      <div class="subject-info-bar">
        <div class="subject-avatar">
          <img
            v-if="subject.photo_url"
            :src="subject.photo_url"
            :alt="subject.name"
            class="subject-photo"
            @error="handleImageError"
          />
          <span v-else class="subject-initials">
            {{ getInitials(subject.name) }}
          </span>
        </div>
        <div class="subject-details">
          <h2 class="subject-name">{{ subject.name }}</h2>
          <p class="subject-class">{{ survey.class.name }}</p>
          <p class="subject-role-small">
            {{ translate('evaluations.role') }}: 
            <strong>{{ survey.evaluator_role }}</strong>
            → {{ translate('evaluations.evaluating') }} 
            <strong>{{ survey.subject_role }}</strong>
          </p>
        </div>
        <span class="status-badge" :class="subject.status">
          {{ subject.status === 'submitted' ? translate('evaluations.evaluated') : translate('evaluations.pending') }}
        </span>
      </div>

      <!-- Questions -->
      <div class="questions-section">
        <div
          v-for="question in survey.questions"
          :key="question.id"
          class="question-card"
        >
          <div class="question-header">
            <span class="question-label">{{ question.label }}</span>
            <span v-if="question.is_required" class="required-asterisk">*</span>
          </div>

          <!-- Rating -->
          <div v-if="question.type === 'rating'" class="rating-wrapper">
            <QuestionRating
              :value="getAnswer(question.id)"
              :max-rating="question.max_rating"
              @update="(val) => setAnswer(question.id, 'rating', val)"
            />
          </div>

          <!-- Single Choice -->
          <div v-else-if="question.type === 'single_choice'" class="choice-wrapper">
            <QuestionChoice
              :value="getAnswer(question.id)"
              :options="question.options"
              @update="(val) => setAnswer(question.id, 'option_id', val)"
            />
          </div>

          <!-- Text -->
          <div v-else-if="question.type === 'text'" class="text-wrapper">
            <QuestionText
              :value="getTextAnswer(question.id)"
              :placeholder="translate('evaluations.typeHere')"
              @update="(val) => setTextAnswer(question.id, val)"
            />
          </div>

          <div v-if="!isAnswerValid(question)" class="error-message">
            {{ translate('evaluations.requiredError') }}
          </div>
        </div>
      </div>

      <!-- ========== SUBMIT BUTTON WITH SINGLE CLICK ========== -->
      <div class="submit-section">
        <div class="submit-spacer"></div>
        
        <!-- Edit button for submitted evaluations -->
        <button 
          v-if="subject?.status === 'submitted' && !isEditing"
          type="button"
          class="submit-btn edit-mode"
          @click="enableEdit"
        >
          {{ translate('evaluations.editEvaluation') }}
        </button>
        
        <!-- Submit/Update button -->
        <button 
          v-else
          type="submit" 
          class="submit-btn" 
          :disabled="isSubmitting || !isFormValid"
        >
          {{ isSubmitting ? translate('evaluations.submitting') : (isEditing ? translate('evaluations.updateEvaluation') : translate('evaluations.submitEvaluation')) }}
        </button>
        
        <div class="submit-bottom-spacer"></div>
      </div>
    </form>

    <!-- Error State -->
    <div v-else-if="!isLoading && !survey" class="error-state-full">
      <div class="error-icon">⚠️</div>
      <h3>{{ translate('evaluations.subjectNotFound') }}</h3>
      <button class="retry-button" @click="goToEvaluations">
        {{ translate('common.back') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import { useLanguage } from '~/composables/useLanguage'
import { useNavigation } from '~/composables/useNavigation'
import { useToast } from '~/composables/useToast'
import { useEvaluations } from '~/composables/useEvaluations'
import ToastNotification from '~/components/ToastNotification.vue'
import QuestionRating from '~/components/evaluations/QuestionRating.vue'
import QuestionChoice from '~/components/evaluations/QuestionChoice.vue'
import QuestionText from '~/components/evaluations/QuestionText.vue'

const route = useRoute()
const router = useRouter()
const { t: translate } = useLanguage()
const { goBack, goToEvaluations } = useNavigation()
const { toasts, removeToast, success, error } = useToast()
const { surveys, fetchSurveys, fetchAnswers, saveAnswers, isLoading } = useEvaluations()

const subjectId = parseInt(route.params.subjectId)
const surveyId = ref(null)
const classId = ref(null)
const survey = ref(null)
const subject = ref(null)
const answers = ref({})
const isSubmitting = ref(false)
const isEditing = ref(false)

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getAnswer = (questionId) => {
  return answers.value[questionId]?.value || null
}

const getTextAnswer = (questionId) => {
  return answers.value[questionId]?.text || ''
}

const setAnswer = (questionId, type, value) => {
  if (!answers.value[questionId]) {
    answers.value[questionId] = {}
  }
  answers.value[questionId].type = type
  answers.value[questionId].value = value
  if (type !== 'text') {
    answers.value[questionId].text = null
  }
}

const setTextAnswer = (questionId, text) => {
  if (!answers.value[questionId]) {
    answers.value[questionId] = {}
  }
  answers.value[questionId].type = 'text'
  answers.value[questionId].text = text
  answers.value[questionId].value = null
}

const isAnswerValid = (question) => {
  if (!question.is_required) return true
  const answer = answers.value[question.id]
  if (!answer) return false
  if (question.type === 'rating') return answer.value !== null && answer.value > 0
  if (question.type === 'single_choice') return answer.value !== null
  if (question.type === 'text') return answer.text && answer.text.trim().length > 0
  return false
}

const isFormValid = computed(() => {
  if (!survey.value) return false
  return survey.value.questions.every(q => isAnswerValid(q))
})

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const buildPayload = () => {
  const payload = []
  for (const [questionId, answer] of Object.entries(answers.value)) {
    const item = { question_id: parseInt(questionId) }
    if (answer.type === 'rating') {
      item.rating = answer.value
    } else if (answer.type === 'option_id') {
      item.option_id = answer.value
    } else if (answer.type === 'text') {
      item.text = answer.text || ''
    }
    payload.push(item)
  }
  return payload
}

const enableEdit = () => {
  isEditing.value = true
}

const submitEvaluation = async () => {
  if (!isFormValid.value) {
    error(translate('evaluations.fillAllRequired'), 3000)
    return
  }

  isSubmitting.value = true
  try {
    const payload = buildPayload()
    await saveAnswers(surveyId.value, classId.value, subjectId, payload)
    
    if (isEditing.value) {
      success(translate('evaluations.updateSuccess'), 3000)
    } else {
      success(translate('evaluations.saveSuccess'), 3000)
    }
    
    // Update local subject status to 'submitted'
    subject.value.status = 'submitted'
    isEditing.value = false
    
    setTimeout(() => {
      router.push('/evaluations')
    }, 1500)
  } catch (err) {
    console.error('Submit error:', err)
    error(translate('evaluations.saveError'), 4000)
  } finally {
    isSubmitting.value = false
  }
}

const loadData = async () => {
  await fetchSurveys()
  
  // Find the survey containing this subject
  let found = false
  for (const s of surveys.value) {
    const subj = s.subjects.find(sub => sub.id === subjectId)
    if (subj) {
      surveyId.value = s.id
      classId.value = s.class.id
      survey.value = s
      subject.value = subj
      found = true
      break
    }
  }

  if (!found) {
    console.warn('Subject not found:', subjectId)
    return
  }

  // If already submitted, fetch saved answers
  if (subject.value.status === 'submitted') {
    try {
      const saved = await fetchAnswers(surveyId.value, classId.value, subjectId)
      if (saved && saved.answers) {
        for (const ans of saved.answers) {
          if (ans.rating !== null) {
            answers.value[ans.question_id] = { type: 'rating', value: ans.rating, text: null }
          } else if (ans.option_id !== null) {
            answers.value[ans.question_id] = { type: 'option_id', value: ans.option_id, text: null }
          } else if (ans.text !== null) {
            answers.value[ans.question_id] = { type: 'text', value: null, text: ans.text }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load saved answers:', err)
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
.evaluation-form-container {
  min-height: 100vh;
  background: #1e3971;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 20px;
  padding-bottom: 160px;
}

.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  color: white;
}

.back-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background 0.2s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #FFC125;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.evaluation-form {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.subject-info-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #2b4b8f;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.subject-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: #1e3971;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.subject-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.subject-initials {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.subject-details {
  flex: 1;
  min-width: 150px;
}

.subject-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.subject-class {
  font-size: 13px;
  color: #a0b3d9;
  margin: 2px 0 0;
}

.subject-role-small {
  font-size: 12px;
  color: #FFC125;
  margin: 4px 0 0;
}

.subject-role-small strong {
  color: white;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: rgba(255, 193, 37, 0.2);
  color: #FFC125;
}

.status-badge.submitted {
  background: rgba(76, 217, 100, 0.2);
  color: #4cd964;
}

.questions-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: #2b4b8f;
  border-radius: 12px;
  padding: 16px 20px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.question-label {
  font-size: 16px;
  font-weight: 500;
  color: white;
}

.required-asterisk {
  color: #ff3b30;
  font-weight: 700;
}

.rating-wrapper,
.choice-wrapper,
.text-wrapper {
  width: 100%;
}

.error-message {
  color: #ff3b30;
  font-size: 13px;
  margin-top: 8px;
}

/* ========== SUBMIT SECTION WITH BREATHING ROOM ========== */
.submit-section {
  margin-top: 50px;
  text-align: center;
  padding: 10px 0;
}

.submit-spacer {
  height: 30px;
}

.submit-btn {
  width: 100%;
  max-width: 400px;
  padding: 20px 40px;
  background: #FFC125;
  color: #1e3971;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(255, 193, 37, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  z-index: 10;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 193, 37, 0.4);
  background: #ffd54f;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* Edit mode button */
.submit-btn.edit-mode {
  background: #4a6fc1;
  color: white;
  box-shadow: 0 4px 20px rgba(74, 111, 193, 0.3);
}

.submit-btn.edit-mode:hover:not(:disabled) {
  background: #5a7fd1;
  box-shadow: 0 8px 30px rgba(74, 111, 193, 0.4);
}

.submit-bottom-spacer {
  height: 60px;
}

.error-state-full {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-state-full h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
}

.retry-button {
  background: #FFC125;
  color: #1e3971;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 480px) {
  .evaluation-form-container {
    padding: 16px;
    padding-bottom: 140px;
  }

  .subject-info-bar {
    flex-wrap: wrap;
  }

  .form-title {
    font-size: 20px;
  }

  .question-card {
    padding: 14px 16px;
  }

  .submit-btn {
    font-size: 16px;
    padding: 18px 20px;
  }

  .submit-section {
    margin-top: 35px;
    padding: 5px 0;
  }

  .submit-spacer {
    height: 20px;
  }

  .submit-bottom-spacer {
    height: 40px;
  }
}
</style>