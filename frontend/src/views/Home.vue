<template>
  <div class="home-view">
    <header class="home-header">
      <h1 class="app-title">Lumina</h1>
      <router-link to="/profile" class="profile-link">
        <svg class="profile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </router-link>
    </header>

    <div class="content-section">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="goals.length === 0" class="empty-state">
        <div class="empty-icon">✨</div>
        <h2>还没有目标</h2>
        <p>点击下方按钮，开始你的治愈之旅吧</p>
      </div>

      <div v-else class="goals-list">
        <div 
          v-for="goal in goals" 
          :key="goal.id" 
          class="goal-card"
          @click="goToDetail(goal.id)"
        >
          <div class="goal-header">
            <h3 class="goal-title">{{ goal.title }}</h3>
            <span class="goal-type" :class="goal.type">
              {{ getTypeLabel(goal.type) }}
            </span>
          </div>
          
          <div class="goal-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: Math.min(100, goal.progress) + '%' }"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-text">{{ formatNumber(goal.current_value) }} / {{ formatNumber(goal.target_value) }} {{ goal.unit }}</span>
              <span class="progress-percent">{{ Math.round(goal.progress) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <router-link to="/create" class="fab-button">
      <svg class="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/utils/request';

const router = useRouter();
const goals = ref([]);
const loading = ref(true);

const fetchGoals = async () => {
  try {
    loading.value = true;
    goals.value = await api.getGoals('active');
  } catch (error) {
    console.error('获取目标失败:', error);
  } finally {
    loading.value = false;
  }
};

const getTypeLabel = (type) => {
  const labels = {
    accumulation: '累积',
    cycle: '周期',
    trend: '趋势'
  };
  return labels[type] || type;
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

const goToDetail = (id) => {
  router.push(`/detail/${id}`);
};

onMounted(() => {
  fetchGoals();
});
</script>

<style scoped>
.home-view {
  position: relative;
  min-height: calc(100vh - 40px);
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 2px;
}

.profile-link {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  border-radius: 50%;
  box-shadow: var(--shadow-soft);
  transition: var(--transition-default);
}

.profile-link:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-medium);
}

.profile-icon {
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary);
}

.content-section {
  padding-bottom: 100px;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-bg-alt);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.empty-state h2 {
  font-size: 24px;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: var(--transition-default);
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.goal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.goal-type {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-xs);
  font-weight: 500;
}

.goal-type.accumulation {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.goal-type.cycle {
  background: var(--color-secondary);
  color: var(--color-text-primary);
}

.goal-type.trend {
  background: var(--color-accent);
  color: var(--color-white);
}

.goal-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-alt);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.progress-percent {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.fab-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-medium);
  transition: var(--transition-default);
  z-index: 100;
}

.fab-button:hover {
  background: var(--color-primary-dark);
  transform: scale(1.1);
}

.fab-icon {
  width: 28px;
  height: 28px;
  color: var(--color-white);
}
</style>
