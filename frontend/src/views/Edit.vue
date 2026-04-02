<template>
  <div class="edit-view paper-texture">
    <header class="edit-header decorative-border">
      <button class="back-button cute-button" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="page-title-container">
        <span class="title-icon">💖</span>
        <h1 class="page-title handwritten">编辑目标</h1>
      </div>
      <div style="width: 44px;"></div>
    </header>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="handwritten">加载中...</p>
    </div>

    <div v-else class="form-container">
      <div class="journal-form journal-card">
        <p class="journal-text handwritten">
          我想要在未来完成
          <input 
            v-model="form.title" 
            type="text" 
            class="journal-input" 
            placeholder="你的目标"
          />
          ，总共需要
          <input 
            v-model.number="form.target_value" 
            type="number" 
            class="journal-input journal-input-small" 
            placeholder="数值"
          />
          <input 
            v-model="form.unit" 
            type="text" 
            class="journal-input journal-input-tiny" 
            placeholder="单位"
          />
        </p>
        <div class="decoration" style="top: 10px; right: 10px;">💝</div>
      </div>

      <div class="form-section">
        <label class="form-label handwritten">目标类型</label>
        <div class="type-selector">
          <button 
            v-for="type in goalTypes" 
            :key="type.value"
            class="type-button cute-button"
            :class="{ active: form.type === type.value }"
            @click="form.type = type.value"
          >
            <span class="type-icon">{{ type.icon }}</span>
            <span class="type-label handwritten">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <div class="form-section">
        <label class="form-label handwritten">当前进度</label>
        <input 
          v-model.number="form.current_value" 
          type="number" 
          class="input-field journal-input"
          placeholder="从多少开始？"
        />
      </div>

      <div class="form-section">
        <button class="milestone-toggle cute-button" @click="showMilestones = !showMilestones">
          <span class="toggle-icon">{{ showMilestones ? '▼' : '+' }}</span>
          <span class="handwritten">添加沿途风景</span>
        </button>

        <div v-if="showMilestones" class="milestones-section journal-card">
          <div class="decoration" style="top: 10px; right: 10px;">🎁</div>
          <div v-for="(milestone, index) in form.milestones" :key="index" class="milestone-item">
            <div class="milestone-inputs">
              <input 
                v-model.number="milestone.value" 
                type="number" 
                class="input-field milestone-value journal-input"
                placeholder="数值"
              />
              <input 
                v-model="milestone.reward_text" 
                type="text" 
                class="input-field milestone-reward journal-input"
                placeholder="奖励文案"
              />
            </div>
            <button class="remove-button cute-button" @click="removeMilestone(index)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <button class="add-milestone-button cute-button" @click="addMilestone">
            <span class="handwritten">+ 添加里程碑</span>
          </button>
        </div>
      </div>

      <button 
        class="submit-button btn-primary cute-button" 
        :disabled="!canSubmit || loading"
        @click="handleSubmit"
      >
        <span class="handwritten">{{ loading ? '保存中...' : '保存修改 ✨' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '@/utils/request';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const showMilestones = ref(false);

const goalTypes = [
  { value: 'accumulation', label: '累积', icon: '💪' },
  { value: 'trend', label: '趋势', icon: '📈' },
  { value: 'cycle', label: '周期', icon: '🔄' }
];

const form = ref({
  title: '',
  type: 'accumulation',
  target_value: null,
  current_value: 0,
  unit: '',
  milestones: []
});

const canSubmit = computed(() => {
  return form.value.title && 
         form.value.target_value !== null && 
         form.value.target_value > 0 && 
         form.value.unit;
});

const fetchGoal = async () => {
  try {
    loading.value = true;
    const goals = await api.getGoals();
    const goal = goals.find(g => g.id === parseInt(route.params.id));
    
    if (goal) {
      form.value = {
        title: goal.title,
        type: goal.type,
        target_value: goal.target_value,
        current_value: goal.current_value,
        unit: goal.unit,
        milestones: []
      };
      
      const milestones = await api.getMilestones(goal.id);
      form.value.milestones = milestones.map(m => ({
        value: m.value,
        reward_text: m.reward_text
      }));
    }
  } catch (error) {
    console.error('获取目标失败:', error);
    alert('获取目标失败，请重试');
  } finally {
    loading.value = false;
  }
};

const addMilestone = () => {
  form.value.milestones.push({
    value: null,
    reward_text: ''
  });
};

const removeMilestone = (index) => {
  form.value.milestones.splice(index, 1);
};

const handleSubmit = async () => {
  if (!canSubmit.value || loading.value) return;

  try {
    loading.value = true;
    
    await api.updateGoal(route.params.id, {
      title: form.value.title,
      type: form.value.type,
      target_value: form.value.target_value,
      current_value: form.value.current_value,
      unit: form.value.unit
    });
    
    router.push(`/detail/${route.params.id}`);
  } catch (error) {
    console.error('更新目标失败:', error);
    alert('更新失败，请重试');
  } finally {
    loading.value = false;
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
.edit-view {
  min-height: calc(100vh - 40px);
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.back-button {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  border-radius: 50%;
  color: var(--color-text-primary);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
  border: 2px solid #E8E2D5;
  transition: var(--transition-default);
}

.back-button:hover {
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.15);
}

.back-icon {
  font-size: 24px;
  font-weight: bold;
}

.page-title-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 28px;
  animation: bounce 2s ease-in-out infinite;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary-dark);
  font-family: 'ZCOOL QingKe HuangYou', cursive;
  text-shadow: 2px 2px 0 rgba(255, 182, 193, 0.4);
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

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.journal-form {
  background: linear-gradient(145deg, #FFFFFF, #FFF5F8);
  border-radius: var(--radius-lg);
  padding: 32px 28px;
  box-shadow: 4px 4px 0 rgba(255, 182, 193, 0.2);
  border: 2px solid #FFD1DC;
  position: relative;
}

.journal-form::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: -8px;
  bottom: -8px;
  background: linear-gradient(145deg, #FFE6EF, #FFD1DC);
  border-radius: var(--radius-lg);
  z-index: -1;
}

.journal-text {
  font-size: 20px;
  line-height: 2.2;
  color: var(--color-text-primary);
  font-family: 'Ma Shan Zheng', cursive;
  background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNNTAgMzBDNTAgMjcuNzE1NzMgNDguMjg0MjcgMjYgNDYgMjZDNDYuOTYxNTQgMjUgNDcuNDg3MzIgMjQgNDggMjRDNDguNTEyNjggMjQgNDkuMDM4NDYgMjUgNTAgMjZDNTAgMjUuMTAxNTYgNTAgMjQuNTcyODggNTAgMjRDMzAgMjQgMzAgMzAgNTAgMzBaIiBmaWxsPSIjZmZkMWRjIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==');
  background-size: 60px 60px;
  padding: 20px;
  border-radius: var(--radius-md);
  border: 2px dashed #FFD1DC;
}

.journal-input {
  display: inline-block;
  min-width: 100px;
  padding: 6px 12px;
  border-bottom: 3px solid var(--color-primary);
  text-align: center;
  font-size: 20px;
  color: var(--color-primary-dark);
  font-weight: 600;
  font-family: 'Ma Shan Zheng', cursive;
  background: rgba(255, 255, 255, 0.9);
  margin: 0 4px;
  border-radius: 4px 4px 0 0;
  box-shadow: 0 2px 0 rgba(255, 182, 193, 0.3);
}

.journal-input::placeholder {
  color: var(--color-text-muted);
  font-style: italic;
}

.journal-input-small {
  min-width: 80px;
}

.journal-input-tiny {
  min-width: 60px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-family: 'ZCOOL QingKe HuangYou', cursive;
  margin-bottom: 8px;
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
  transition: var(--transition-default);
  border: 2px solid #E8E2D5;
  position: relative;
}

.type-button::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: -4px;
  bottom: -4px;
  background: var(--color-bg-alt);
  border-radius: var(--radius-lg);
  z-index: -1;
}

.type-button:hover {
  transform: translateY(-4px) rotate(1deg);
  box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.15);
}

.type-button.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  box-shadow: 5px 5px 0 rgba(107, 122, 94, 0.3);
  border-color: var(--color-primary);
}

.type-icon {
  font-size: 36px;
  animation: bounce 2s ease-in-out infinite;
}

.type-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: 'ZCOOL KuaiLe', cursive;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
}

.type-button.active .type-label {
  color: var(--color-white);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
}

.milestone-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
  font-family: 'ZCOOL KuaiLe', cursive;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
  border: 2px solid #E8E2D5;
  transition: var(--transition-default);
}

.milestone-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.15);
}

.toggle-icon {
  font-size: 20px;
  color: var(--color-primary);
  font-weight: bold;
}

.milestones-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
  border: 2px solid #E8E2D5;
  position: relative;
}

.milestones-section::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: -4px;
  bottom: -4px;
  background: var(--color-bg-alt);
  border-radius: var(--radius-lg);
  z-index: -1;
}

.milestone-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid #E8E2D5;
}

.milestone-inputs {
  display: flex;
  gap: 16px;
  flex: 1;
}

.milestone-value {
  flex: 0 0 120px;
  border: 2px solid #E8E2D5;
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 16px;
}

.milestone-reward {
  flex: 1;
  border: 2px solid #E8E2D5;
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 16px;
}

.remove-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-error), #E4B5B5);
  color: var(--color-white);
  border-radius: var(--radius-xs);
  box-shadow: 2px 2px 0 rgba(212, 165, 165, 0.5);
  border: 1px solid #C49595;
  transition: var(--transition-default);
}

.remove-button:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 3px 3px 0 rgba(212, 165, 165, 0.6);
}

.remove-button svg {
  width: 20px;
  height: 20px;
}

.add-milestone-button {
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--color-primary-light), #C9D6B8);
  color: var(--color-primary-dark);
  font-size: 16px;
  font-weight: 600;
  font-family: 'ZCOOL KuaiLe', cursive;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  box-shadow: 3px 3px 0 rgba(143, 156, 130, 0.3);
  transition: var(--transition-default);
}

.add-milestone-button:hover {
  transform: translateY(-2px);
  box-shadow: 4px 4px 0 rgba(143, 156, 130, 0.4);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: var(--color-white);
}

.submit-button {
  width: 100%;
  margin-top: 16px;
  padding: 18px 32px;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  box-shadow: 5px 5px 0 rgba(107, 122, 94, 0.3);
  border: 3px solid #E8E2D5;
  border-radius: var(--radius-lg);
  color: var(--color-white);
  font-family: 'ZCOOL KuaiLe', cursive;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
  transition: var(--transition-default);
  position: relative;
  overflow: hidden;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-4px) rotate(1deg);
  box-shadow: 8px 8px 0 rgba(107, 122, 94, 0.4);
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: 3px 3px 0 rgba(107, 122, 94, 0.2);
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
</style>
