<template>
  <div class="detail-view">
    <header class="detail-header">
      <button class="back-button" @click="goBack">
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">{{ goal?.title || '加载中...' }}</h1>
      <div class="menu-button" @click="showMenu = !showMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
        <div v-if="showMenu" class="menu-dropdown">
          <button class="menu-item" @click="handleEdit">编辑</button>
          <button class="menu-item menu-item-danger" @click="handleDelete">放弃目标</button>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="goal" class="content-section">
      <div class="orb-section card">
        <MagicOrb 
          :progress="progress" 
          :label="`${formatNumber(goal.current_value)} / ${formatNumber(goal.target_value)} ${goal.unit}`"
          :type="goal.type"
          :current-value="goal.current_value"
          :target-value="goal.target_value"
        />
      </div>

      <div v-if="milestones.length > 0" class="milestones-section card">
        <h3 class="section-title">心愿地图</h3>
        <div class="milestone-track">
          <div 
            v-for="(milestone, index) in milestones" 
            :key="milestone.id"
            class="milestone-node"
            :class="{ reached: milestone.is_reached }"
          >
            <div class="milestone-dot"></div>
            <div class="milestone-label">{{ milestone.reward_text }}</div>
            <div class="milestone-value">{{ milestone.value }}{{ goal.unit }}</div>
          </div>
        </div>
      </div>

      <div class="checkin-section card">
        <h3 class="section-title">充能打卡</h3>
        <div class="checkin-form">
          <div class="form-row">
            <input 
              v-model.number="checkinForm.change_value" 
              type="number" 
              class="input-field checkin-value"
              placeholder="变化值"
              :step="goal.type === 'trend' ? '-any' : 'any'"
            />
            <span class="unit-display">{{ goal.unit }}</span>
          </div>
          <textarea 
            v-model="checkinForm.reflection" 
            class="input-field reflection-input"
            placeholder="今日碎碎念..."
            rows="3"
          ></textarea>
          <button 
            class="btn-primary checkin-button"
            :disabled="!canCheckin || submitting"
            @click="handleCheckin"
          >
            {{ submitting ? '打卡中...' : '注入能量 ✨' }}
          </button>
        </div>
      </div>

      <div class="records-section card">
        <h3 class="section-title">历史轨迹</h3>
        <div v-if="records.length === 0" class="empty-records">
          <p>还没有打卡记录</p>
        </div>
        <div v-else class="records-list">
          <div 
            v-for="record in records" 
            :key="record.id"
            class="record-item"
          >
            <div class="record-main">
              <div class="record-value">
                <span :class="{ positive: record.change_value > 0, negative: record.change_value < 0 }">
                  {{ record.change_value > 0 ? '+' : '' }}{{ record.change_value }}
                </span>
                <span class="record-unit">{{ goal.unit }}</span>
              </div>
              <div class="record-date">{{ formatDate(record.created_at) }}</div>
            </div>
            <p v-if="record.reflection" class="record-reflection">{{ record.reflection }}</p>
            <button class="delete-record-btn" @click="handleDeleteRecord(record.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showMilestoneModal" class="modal-overlay" @click="showMilestoneModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-icon">🎉</div>
        <h2>里程碑达成！</h2>
        <p class="milestone-reward-text">{{ unlockedMilestone?.reward_text }}</p>
        <button class="btn-primary modal-button" @click="showMilestoneModal = false">太棒了！</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MagicOrb from '@/components/MagicOrb.vue';
import { api } from '@/utils/request';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const showMenu = ref(false);
const showMilestoneModal = ref(false);
const submitting = ref(false);

const goal = ref(null);
const records = ref([]);
const milestones = ref([]);
const unlockedMilestone = ref(null);

const checkinForm = ref({
  change_value: null,
  reflection: ''
});

const progress = computed(() => {
  if (!goal.value) return 0;
  
  let p = 0;
  if (goal.value.type === 'trend') {
    if (goal.value.current_value <= goal.value.target_value) {
      p = 100;
    } else {
      const startValue = goal.value.current_value;
      p = Math.max(0, Math.min(100, ((startValue - goal.value.current_value) / (startValue - goal.value.target_value || 1)) * 100));
    }
  } else {
    p = (goal.value.current_value / goal.value.target_value) * 100;
  }
  return Math.max(0, Math.min(100, p));
});

const canCheckin = computed(() => {
  return checkinForm.value.change_value !== null && checkinForm.value.change_value !== 0;
});

const fetchGoal = async () => {
  try {
    loading.value = true;
    
    const [goalData, recordsData, milestonesData] = await Promise.all([
      api.getGoals(),
      api.getRecords(route.params.id),
      api.getMilestones(route.params.id)
    ]);
    
    goal.value = goalData.find(g => g.id === parseInt(route.params.id));
    records.value = recordsData;
    milestones.value = milestonesData;
  } catch (error) {
    console.error('获取目标详情失败:', error);
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const handleCheckin = async () => {
  if (!canCheckin.value || submitting.value) return;

  try {
    submitting.value = true;
    
    const response = await api.createRecord({
      goal_id: goal.value.id,
      change_value: checkinForm.value.change_value,
      reflection: checkinForm.value.reflection
    });
    
    goal.value = response.goal;
    records.value.unshift(response.record);
    
    if (response.unlocked_milestone) {
      unlockedMilestone.value = response.unlocked_milestone;
      const milestoneIndex = milestones.value.findIndex(m => m.id === response.unlocked_milestone.id);
      if (milestoneIndex !== -1) {
        milestones.value[milestoneIndex] = response.unlocked_milestone;
      }
      showMilestoneModal.value = true;
    }
    
    checkinForm.value = {
      change_value: null,
      reflection: ''
    };
  } catch (error) {
    console.error('打卡失败:', error);
    alert('打卡失败，请重试');
  } finally {
    submitting.value = false;
  }
};

const handleDeleteRecord = async (recordId) => {
  if (!confirm('确定要撤销这条记录吗？')) return;

  try {
    await api.deleteRecord(recordId);
    await fetchGoal();
  } catch (error) {
    console.error('删除记录失败:', error);
    alert('删除失败，请重试');
  }
};

const handleEdit = () => {
  showMenu.value = false;
  router.push(`/edit/${goal.value.id}`);
};

const handleDelete = async () => {
  showMenu.value = false;
  if (!confirm('确定要放弃这个目标吗？这将删除所有相关记录。')) return;

  try {
    await api.deleteGoal(goal.value.id);
    router.push('/');
  } catch (error) {
    console.error('删除目标失败:', error);
    alert('删除失败，请重试');
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchGoal();
});
</script>

<style scoped>
.detail-view {
  position: relative;
  min-height: calc(100vh - 40px);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  flex: 1;
  margin: 0 16px;
}

.menu-button {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text-primary);
}

.menu-button svg {
  width: 24px;
  height: 24px;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-medium);
  min-width: 140px;
  overflow: hidden;
  z-index: 10;
}

.menu-item {
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
}

.menu-item:hover {
  background: var(--color-bg-alt);
}

.menu-item-danger {
  color: var(--color-error);
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
  padding-bottom: 24px;
}

.card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-soft);
}

.orb-section {
  text-align: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.milestones-section {
  overflow-x: auto;
}

.milestone-track {
  display: flex;
  gap: 24px;
  padding-bottom: 8px;
}

.milestone-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  opacity: 0.4;
}

.milestone-node.reached {
  opacity: 1;
}

.milestone-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-bg-alt);
  border: 2px solid var(--color-secondary);
}

.milestone-node.reached .milestone-dot {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.milestone-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

.milestone-node.reached .milestone-label {
  color: var(--color-primary);
  font-weight: 500;
}

.milestone-value {
  font-size: 11px;
  color: var(--color-text-muted);
}

.checkin-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkin-value {
  flex: 1;
}

.unit-display {
  font-size: 16px;
  color: var(--color-text-secondary);
  padding-right: 8px;
}

.reflection-input {
  resize: none;
}

.checkin-button {
  width: 100%;
}

.checkin-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.records-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.empty-records {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  position: relative;
  padding: 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-value {
  font-size: 18px;
  font-weight: 600;
}

.record-value .positive {
  color: var(--color-primary);
}

.record-value .negative {
  color: var(--color-accent);
}

.record-unit {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-left: 4px;
}

.record-date {
  font-size: 13px;
  color: var(--color-text-muted);
}

.record-reflection {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-style: italic;
  line-height: 1.5;
}

.delete-record-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text-muted);
  opacity: 0;
  transition: var(--transition-fast);
}

.record-item:hover .delete-record-btn {
  opacity: 1;
}

.delete-record-btn:hover {
  color: var(--color-error);
}

.delete-record-btn svg {
  width: 16px;
  height: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  text-align: center;
  max-width: 320px;
  width: 100%;
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.modal-content h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.milestone-reward-text {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.modal-button {
  width: 100%;
}
</style>
