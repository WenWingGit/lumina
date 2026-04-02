<template>
  <div class="home-view paper-texture">
    <header class="home-header decorative-border">
      <div class="app-title-container">
        <span class="app-icon">🌸</span>
        <h1 class="app-title handwritten">Lumina</h1>
        <span class="app-subtitle cute-tag">治愈系目标管理</span>
      </div>
      <router-link to="/profile" class="profile-link cute-button">
        <span class="profile-icon">👤</span>
      </router-link>
    </header>

    <div class="content-section">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="handwritten">加载中...</p>
      </div>

      <div v-else-if="goals.length === 0" class="empty-state">
        <div class="empty-icon">✨</div>
        <h2 class="handwritten">还没有目标</h2>
        <p class="handwritten">点击下方按钮，开始你的治愈之旅吧</p>
        <div class="decoration" style="top: 20px; right: 20px;">🎨</div>
        <div class="decoration" style="bottom: 20px; left: 20px;">🌈</div>
      </div>

      <div v-else class="goals-list">
        <div 
          v-for="(goal, index) in goals" 
          :key="goal.id" 
          class="goal-card journal-card"
          @click="goToDetail(goal.id)"
        >
          <div class="decoration" :style="{ top: '10px', right: '10px', animationDelay: index * 0.5 + 's' }">
            {{ getGoalIcon(goal.type) }}
          </div>
          <div class="goal-header">
            <h3 class="goal-title handwritten">{{ goal.title }}</h3>
            <span class="goal-type cute-tag" :class="goal.type">
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
              <span class="progress-text cute-tag">{{ formatNumber(goal.current_value) }} / {{ formatNumber(goal.target_value) }} {{ goal.unit }}</span>
              <span class="progress-percent cute-tag">{{ Math.round(goal.progress) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <router-link to="/create" class="fab-button cute-button">
      <span class="fab-icon">+</span>
      <div class="decoration" style="top: -10px; right: -10px; font-size: 16px;">✨</div>
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

const getGoalIcon = (type) => {
  const icons = {
    accumulation: '📈',
    cycle: '🔄',
    trend: '📉'
  };
  return icons[type] || '✨';
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

.app-title-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon {
  font-size: 32px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: 'ZCOOL QingKe HuangYou', cursive;
  letter-spacing: 2px;
  text-shadow: 2px 2px 0 rgba(143, 156, 130, 0.2);
}

.app-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-family: 'ZCOOL KuaiLe', cursive;
  background: var(--color-bg-alt);
  padding: 4px 12px;
  border-radius: var(--radius-xs);
  border: 1px solid #E8E2D5;
}

.profile-link {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  border-radius: 50%;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
  transition: var(--transition-default);
  border: 2px solid #E8E2D5;
}

.profile-link:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.15);
}

.profile-icon {
  font-size: 24px;
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
  padding: 24px;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: var(--transition-default);
  border: 2px solid #E8E2D5;
  position: relative;
  overflow: hidden;
}

.goal-card::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: -8px;
  bottom: -8px;
  background: var(--color-bg-alt);
  border-radius: var(--radius-lg);
  z-index: -1;
}

.goal-card:hover {
  transform: translateY(-4px) rotate(0.5deg);
  box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.15);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.goal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: 'Ma Shan Zheng', cursive;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
  flex: 1;
}

.goal-type {
  font-size: 12px;
  padding: 6px 14px;
  border-radius: var(--radius-xs);
  font-weight: 600;
  font-family: 'ZCOOL KuaiLe', cursive;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid transparent;
}

.goal-type.accumulation {
  background: linear-gradient(135deg, var(--color-primary-light), #C9D6B8);
  color: var(--color-primary-dark);
  border-color: var(--color-primary);
}

.goal-type.cycle {
  background: linear-gradient(135deg, var(--color-secondary), #D8C8B8);
  color: var(--color-text-primary);
  border-color: #B8A898;
}

.goal-type.trend {
  background: linear-gradient(135deg, var(--color-accent), #E4B5B5);
  color: var(--color-white);
  border-color: #C49595;
}

.goal-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-bar {
  height: 12px;
  background: var(--color-bg-alt);
  border-radius: var(--radius-xs);
  overflow: hidden;
  border: 2px solid #E8E2D5;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.05);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light), #C9D6B8);
  border-radius: var(--radius-xs);
  transition: width 0.5s ease-out;
  box-shadow: 2px 0 0 rgba(143, 156, 130, 0.3);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.progress-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-family: 'ZCOOL QingKe HuangYou', cursive;
  background: var(--color-bg);
  padding: 4px 12px;
  border-radius: var(--radius-xs);
  border: 1px solid #E8E2D5;
}

.progress-percent {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: 'ZCOOL KuaiLe', cursive;
  background: linear-gradient(135deg, var(--color-primary-light), #C9D6B8);
  padding: 4px 16px;
  border-radius: var(--radius-xs);
  box-shadow: 2px 2px 0 rgba(143, 156, 130, 0.3);
  border: 1px solid var(--color-primary);
}

.fab-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 5px 5px 0 rgba(107, 122, 94, 0.3);
  transition: var(--transition-default);
  z-index: 100;
  border: 3px solid #E8E2D5;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 5px 5px 0 rgba(107, 122, 94, 0.3);
  }
  50% {
    box-shadow: 8px 8px 0 rgba(107, 122, 94, 0.4);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 5px 5px 0 rgba(107, 122, 94, 0.3);
  }
}

.fab-button:hover {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  transform: scale(1.1) rotate(5deg);
  box-shadow: 6px 6px 0 rgba(107, 122, 94, 0.4);
}

.fab-icon {
  width: 32px;
  height: 32px;
  color: var(--color-white);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
  font-size: 32px;
}
</style>
