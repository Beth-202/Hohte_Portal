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
      <h1 class="form-title">{{ t('evaluations.evaluating') }}</h1>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
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
        </div>
        <span class="status-badge" :class="subject.status">
          {{ subject.status === 'submitted' ? t('evaluations.evaluated') : t('evaluations.pending') }}
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
            <div class="stars">
              <button
                v-for="i in question.max_rating"
                :key="i"
                type="button"
                class="star-btn"
                @click="setAnswer(question.id, 'rating', i)"
              >
                <svg
                  class="star-icon"
                  :class="{ filled: getAnswer(question.id) >= i }"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
            <span class="rating-value">
              {{ getAnswer(question.id) || 0 }} / {{ question.max_rating }}
            </span>
          </div>

          <!-- Single Choice -->
          <div v-else-if="question.type === 'single_choice'" class="choice-wrapper">
            <div
              v-for="option in question.options"
              :key="option.id"
              class="choice-option"
              @click="setAnswer(question.id, 'option_id', option.id)"
            >
              <div class="radio-circle" :class="{ selected: getAnswer(question.id) === option.id }">
                <div v-if="getAnswer(question.id) === option.id" class="radio-dot"></div>
              </div>
              <span class="choice-label">{{ option.label }}</span>
            </div>
          </div>

          <!-- Text -->
          <div v-else-if="question.type === 'text'" class="text-wrapper">
            <textarea
              :value="getTextAnswer(question.id)"
              @input="setTextAnswer(question.id, $event.target.value)"
              class="text-input"
              :placeholder="t('evaluations.typeHere')"
              rows="3"
            ></textarea>
          </div>

          <div v-if="!isAnswerValid(question)" class="error-message">
            {{ t('evaluations.requiredError') }}
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="submit-section">
        <button type="submit" class="submit-btn" :disabled="isSubmitting || !isFormValid">
          {{ isSubmitting ? t('evaluations.submitting') : t('evaluations.submitEvaluation') }}
        </button>
      </div>
    </form>
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

const route = useRoute()
const router = useRouter()
const { t } = useLanguage()
const { goBack } = useNavigation()
const { toasts, removeToast, success, error } = useToast()
const { surveys, fetchSurveys, fetchAnswers, saveAnswers, isLoading } = useEvaluations()

const subjectId = parseInt(route.params.subjectId)
const surveyId = ref(null)
const classId = ref(null)
const survey = ref(null)
const subject = ref(null)
const answers = ref({})
const isSubmitting = ref(false)

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
  // Clear any previous text for non-text types
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

const submitEvaluation = async () => {
  if (!isFormValid.value) {
    error(t('evaluations.fillAllRequired'), 3000)
    return
  }

  isSubmitting.value = true
  try {
    const payload = buildPayload()
    await saveAnswers(surveyId.value, classId.value, subjectId, payload)
    success(t('evaluations.saveSuccess'), 3000)
    setTimeout(() => {
      router.push('/evaluations')
    }, 1500)
  } catch (err) {
    error(t('evaluations.saveError'), 4000)
  } finally {
    isSubmitting.value = false
  }
}

const loadData = async () => {
  await fetchSurveys()
  
  // Find the survey containing this subject
  for (const s of surveys.value) {
    const subj = s.subjects.find(sub => sub.id === subjectId)
    if (subj) {
      surveyId.value = s.id
      classId.value = s.class.id
      survey.value = s
      subject.value = subj
      break
    }
  }

  if (!survey.value || !subject.value) {
    error(t('evaluations.subjectNotFound'), 4000)
    setTimeout(() => {
      router.push('/evaluations')
    }, 2000)
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 20px;
  padding-bottom: 40px;
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
}

.subject-info-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #2b4b8f;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 24px;
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
}

.subject-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.subject-class {
  font-size: 14px;
  color: #a0b3d9;
  margin: 0;
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

/* Rating */
.rating-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stars {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.1s ease;
}

.star-btn:hover {
  transform: scale(1.1);
}

.star-icon {
  color: #555;
  transition: color 0.2s ease;
}

.star-icon.filled {
  color: #FFC125;
  fill: #FFC125;
}

.rating-value {
  color: #a0b3d9;
  font-size: 14px;
  min-width: 50px;
}

/* Single Choice */
.choice-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.choice-option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease;
  flex-shrink: 0;
}

.radio-circle.selected {
  border-color: #FFC125;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FFC125;
}

.choice-label {
  color: white;
  font-size: 14px;
}

/* Text */
.text-wrapper {
  width: 100%;
}

.text-input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.text-input:focus {
  outline: none;
  border-color: #FFC125;
}

.text-input::placeholder {
  color: #666;
}

.error-message {
  color: #ff3b30;
  font-size: 13px;
  margin-top: 8px;
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  max-width: 400px;
  padding: 16px 40px;
  background: #FFC125;
  color: #1e3971;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(30, 57, 113, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(30, 57, 113, 0.4);
  background: #ffd54f;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .evaluation-form-container {
    padding: 16px;
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
}
</style>