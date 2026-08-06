<template>
  <div class="evaluations-container">
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
    <header class="evaluations-header">
      <div class="logo-center">
        <img
          :src="getSchoolLogo()"
          :alt="getSchoolName() + ' Logo'"
          class="logo-image"
          @error="handleLogoError"
        />
      </div>

      <div class="header-content">
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <h1 class="page-title">{{ translate('evaluations.title') }}</h1>
        <div class="header-right"></div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ translate('common.loading') }}</p>
    </div>

    <!-- Content -->
    <main v-else class="evaluations-main">
      <!-- No Surveys -->
      <div v-if="surveys.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>{{ translate('evaluations.noSurveys') }}</h3>
        <p>{{ translate('evaluations.noSurveysDesc') }}</p>
      </div>

      <!-- Surveys with Dropdown -->
      <div v-else class="surveys-wrapper">
        <!-- Dropdown Filter -->
        <div class="filter-section">
          <label class="filter-label">{{ translate('evaluations.evaluateAs') }}</label>
          <select v-model="selectedRole" class="role-dropdown">
            <option value="all">{{ translate('evaluations.allRoles') }}</option>
            <option 
              v-for="role in availableRoles" 
              :key="role"
              :value="role"
            >
              {{ translate('evaluations.role') }}: {{ role }}
            </option>
          </select>
        </div>

        <!-- Filtered Surveys List -->
        <div class="surveys-list">
          <div
            v-for="survey in filteredSurveys"
            :key="survey.id"
            class="survey-section"
          >
            <div class="survey-header">
              <div>
                <h2 class="survey-title">{{ survey.title }}</h2>
                <span class="survey-role-badge">
                  {{ translate('evaluations.youAre') }}: 
                  <strong class="role-highlight">{{ survey.evaluator_role }}</strong>
                  {{ translate('evaluations.evaluating') }}
                  <strong class="role-highlight">{{ survey.subject_role }}</strong>
                </span>
              </div>
              <span class="survey-count">
                {{ survey.subjects.length }} {{ translate('evaluations.subjects') }}
              </span>
            </div>

            <div class="subjects-grid">
              <div
                v-for="subject in survey.subjects"
                :key="subject.id"
                class="subject-card"
                :class="{ submitted: subject.status === 'submitted' }"
              >
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

                <div class="subject-info">
                  <h4 class="subject-name">{{ subject.name }}</h4>
                  <span class="subject-class">{{ survey.class.name }}</span>
                </div>

                <button
                  class="subject-status-btn"
                  :class="subject.status === 'submitted' ? 'submitted' : 'pending'"
                  @click="goToEvaluation(survey.id, survey.class.id, subject.id)"
                >
                  <span class="status-dot" :class="subject.status"></span>
                  {{ subject.status === 'submitted' ? translate('evaluations.evaluated') : translate('evaluations.pending') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state for filtered results -->
        <div v-if="filteredSurveys.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>{{ translate('evaluations.noResults') }}</h3>
          <p>{{ translate('evaluations.noResultsDesc') }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLanguage } from '~/composables/useLanguage'
import { useNavigation } from '~/composables/useNavigation'
import { useSchool } from '~/composables/useSchool'
import { useToast } from '~/composables/useToast'
import { useEvaluations } from '~/composables/useEvaluations'
import ToastNotification from '~/components/ToastNotification.vue'

const { t: translate } = useLanguage()
const { goBack, goToEvaluation } = useNavigation()
const { getSchoolLogo, getSchoolName } = useSchool()
const { toasts, removeToast } = useToast()
const { surveys, isLoading, fetchSurveys } = useEvaluations()

// ========== DROPDOWN FILTER ==========
const selectedRole = ref('all')

// Get all unique evaluator roles from surveys
const availableRoles = computed(() => {
  const roles = new Set()
  surveys.value.forEach(survey => {
    if (survey.evaluator_role) {
      roles.add(survey.evaluator_role)
    }
  })
  return Array.from(roles)
})

// Filter surveys based on selected role
const filteredSurveys = computed(() => {
  if (selectedRole.value === 'all') {
    return surveys.value
  }
  return surveys.value.filter(
    survey => survey.evaluator_role === selectedRole.value
  )
})
// ========== END DROPDOWN FILTER ==========

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const handleLogoError = (event) => {
  event.target.src = '/assets/images/logo2-modified.png'
}

onMounted(async () => {
  await fetchSurveys()
})
</script>

<style scoped>
.evaluations-container {
  min-height: 100vh;
  background: #1e3971;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

.evaluations-header {
  background: #1e3971;
  padding: 20px 20px 16px;
  color: white;
}

.logo-center {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.logo-image {
  width: 90px;
  height: 90px;
  object-fit: contain;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.header-content {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 10px;
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

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
  text-align: center;
}

.header-right {
  grid-column: 3;
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

.evaluations-main {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #2b4b8f;
  border-radius: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #a0b3d9;
  font-size: 14px;
  margin: 0;
}

/* ========== SURVEYS WRAPPER ========== */
.surveys-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== DROPDOWN FILTER SECTION ========== */
.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #2b4b8f;
  border-radius: 12px;
  padding: 14px 20px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #a0b3d9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-dropdown {
  flex: 1;
  min-width: 180px;
  padding: 10px 16px;
  background: #1e3971;
  color: white;
  border: 2px solid rgba(255, 193, 37, 0.3);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23FFC125' stroke-width='2' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  transition: all 0.3s ease;
}

.role-dropdown:hover {
  border-color: #FFC125;
}

.role-dropdown:focus {
  outline: none;
  border-color: #FFC125;
  box-shadow: 0 0 0 3px rgba(255, 193, 37, 0.2);
}

.role-dropdown option {
  background: #1e3971;
  color: white;
  padding: 8px;
}

/* ========== SURVEYS LIST ========== */
.surveys-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.survey-section {
  background: #2b4b8f;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.survey-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.survey-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
}

.survey-role-badge {
  font-size: 13px;
  color: #a0b3d9;
}

.survey-role-badge .role-highlight {
  color: #FFC125;
  font-weight: 600;
}

.survey-count {
  font-size: 13px;
  color: #a0b3d9;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* ========== SUBJECT CARDS ========== */
.subject-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.subject-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.subject-card.submitted {
  opacity: 0.8;
}

.subject-avatar {
  width: 40px;
  height: 40px;
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
  font-size: 14px;
}

.subject-info {
  flex: 1;
  min-width: 0;
}

.subject-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subject-class {
  font-size: 11px;
  color: #a0b3d9;
  display: block;
}

/* ========== STATUS BUTTONS ========== */
.subject-status-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

/* PENDING - Yellow */
.subject-status-btn.pending {
  background: #FFC125;
  color: #1e3971;
}

.subject-status-btn.pending:hover {
  background: #ffd54f;
  transform: scale(1.02);
}

/* SUBMITTED - Solid Green */
.subject-status-btn.submitted {
  background: #4cd964;
  color: #1e3971;
  cursor: default;
}

.subject-status-btn.submitted:hover {
  transform: none;
  background: #4cd964;
}

/* Status dots */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.pending {
  background: #1e3971;
}

.status-dot.submitted {
  background: #1e3971;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }

  .survey-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 20px;
  }

  .logo-image {
    width: 70px;
    height: 70px;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .role-dropdown {
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .evaluations-main {
    padding: 12px;
  }

  .survey-section {
    padding: 14px;
  }

  .subject-card {
    padding: 10px 12px;
  }

  .subject-status-btn {
    font-size: 11px;
    padding: 4px 10px;
  }

  .survey-title {
    font-size: 16px;
  }
}
</style>