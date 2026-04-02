<template>
  <div class="profile-view">
    <header class="profile-header">
      <button class="back-button" @click="goBack">
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">个人主页</h1>
      <div style="width: 44px;"></div>
    </header>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="content-section">
      <div class="honor-section card">
        <h2 class="section-title">荣誉墙 🏆</h2>
        
        <div v-if="completedGoals.length === 0" class="empty-honor">
          <div class="empty-icon">🌟</div>
          <p>还没有完成的目标</p>
          <p class="empty-subtitle">继续努力，第一个荣誉在等着你！</p>
        </div>
        
        <div v-else class="honor-grid">
          <div 
            v-for="goal in completedGoals" 
            :key="goal.id"
            class="honor-card"
          >
            <div class="honor-orb">
              <svg viewBox="0 0 100 100" class="honor-svg">
                <defs>
                  <linearGradient id="honor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" :stop-color="primaryColor" />
                    <stop offset="100%" :stop-color="primaryLightColor" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#honor-gradient)" />
                <text x="50" y="55" text-anchor="middle" fill="white" font-size="20" font-weight="bold">100%</text>
              </svg>
            </div>
            <h3 class="honor-title">{{ goal.title }}</h3>
            <p class="honor-info">{{ formatNumber(goal.target_value) }} {{ goal.unit }}</p>
          </div>
        </div>
      </div>

      <div class="actions-section card">
        <h2 class="section-title">数据管理</h2>
        <button class="action-button" @click="handleExport" :disabled="exporting">
          <span class="action-icon">📄</span>
          <span>{{ exporting ? '导出中...' : '导出我的日记' }}</span>
        </button>
      </div>

      <div class="stats-section card">
        <h2 class="section-title">统计概览</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ totalGoals }}</div>
            <div class="stat-label">总目标</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ activeGoals }}</div>
            <div class="stat-label">进行中</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ completedGoals.length }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/utils/request';

const router = useRouter();

const loading = ref(true);
const exporting = ref(false);
const allGoals = ref([]);

const primaryColor = '#8F9C82';
const primaryLightColor = '#B5C1A8';

const completedGoals = computed(() => {
  return allGoals.value.filter(g => g.status === 'completed');
});

const activeGoals = computed(() => {
  return allGoals.value.filter(g => g.status === 'active').length;
});

const totalGoals = computed(() => {
  return allGoals.value.length;
});

const fetchGoals = async () => {
  try {
    loading.value = true;
    allGoals.value = await api.getGoals();
  } catch (error) {
    console.error('获取目标失败:', error);
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

const handleExport = async () => {
  try {
    exporting.value = true;
    const data = await api.exportData();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试');
  } finally {
    exporting.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchGoals();
});
</script>

<style scoped>
.profile-view {
  min-height: calc(100vh - 40px);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.back-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text-primary);
}

.back-icon {
  width: 24px;
  height: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
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

.content-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-soft);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 20px;
}

.empty-honor {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-honor p {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 14px !important;
  color: var(--color-text-muted) !important;
}

.honor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.honor-card {
  text-align: center;
  padding: 20px 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  transition: var(--transition-default);
}

.honor-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.honor-orb {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
}

.honor-svg {
  width: 100%;
  height: 100%;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 5px rgba(143, 156, 130, 0.3));
  }
  to {
    filter: drop-shadow(0 0 15px rgba(143, 156, 130, 0.6));
  }
}

.honor-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.honor-info {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.action-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--color-bg-alt);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 500;
  transition: var(--transition-default);
}

.action-button:hover:not(:disabled) {
  background: var(--color-secondary);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 20px;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
