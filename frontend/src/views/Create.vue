<template>
  <div class="create-view">
    <header class="create-header">
      <button class="back-button" @click="goBack">
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">新目标</h1>
      <div style="width: 44px;"></div>
    </header>

    <div class="form-container">
      <div class="journal-form">
        <p class="journal-text">
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
      </div>

      <div class="form-section">
        <label class="form-label">目标类型</label>
        <div class="type-selector">
          <button 
            v-for="type in goalTypes" 
            :key="type.value"
            class="type-button"
            :class="{ active: form.type === type.value }"
            @click="form.type = type.value"
          >
            <span class="type-icon">{{ type.icon }}</span>
            <span class="type-label">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <div class="form-section">
        <label class="form-label">当前进度</label>
        <input 
          v-model.number="form.current_value" 
          type="number" 
          class="input-field"
          placeholder="从多少开始？"
        />
      </div>

      <div class="form-section">
        <button class="milestone-toggle" @click="showMilestones = !showMilestones">
          <span class="toggle-icon">{{ showMilestones ? '▼' : '+' }}</span>
          <span>添加沿途风景</span>
        </button>

        <div v-if="showMilestones" class="milestones-section">
          <div v-for="(milestone, index) in form.milestones" :key="index" class="milestone-item">
            <div class="milestone-inputs">
              <input 
                v-model.number="milestone.value" 
                type="number" 
                class="input-field milestone-value"
                placeholder="数值"
              />
              <input 
                v-model="milestone.reward_text" 
                type="text" 
                class="input-field milestone-reward"
                placeholder="奖励文案"
              />
            </div>
            <button class="remove-button" @click="removeMilestone(index)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <button class="add-milestone-button" @click="addMilestone">
            + 添加里程碑
          </button>
        </div>
      </div>

      <button 
        class="submit-button btn-primary" 
        :disabled="!canSubmit || loading"
        @click="handleSubmit"
      >
        {{ loading ? '保存中...' : '开始这段旅程 ✨' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/utils/request';

const router = useRouter();
const loading = ref(false);
const showMilestones = ref(false);

const goalTypes = [
  { value: 'accumulation', label: '累积', icon: '📈' },
  { value: 'trend', label: '趋势', icon: '📉' },
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
    
    const data = { ...form.value };
    data.milestones = data.milestones.filter(m => m.value && m.reward_text);
    if (data.milestones.length === 0) {
      delete data.milestones;
    }

    await api.createGoal(data);
    router.push('/');
  } catch (error) {
    console.error('创建目标失败:', error);
    alert('创建失败，请重试');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.create-view {
  min-height: calc(100vh - 40px);
}

.create-header {
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

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.journal-form {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  box-shadow: var(--shadow-soft);
}

.journal-text {
  font-size: 18px;
  line-height: 2;
  color: var(--color-text-primary);
}

.journal-input {
  display: inline-block;
  min-width: 80px;
  padding: 4px 8px;
  border-bottom: 2px solid var(--color-primary);
  text-align: center;
  font-size: 18px;
  color: var(--color-primary);
  font-weight: 500;
}

.journal-input::placeholder {
  color: var(--color-text-muted);
}

.journal-input-small {
  min-width: 60px;
}

.journal-input-tiny {
  min-width: 40px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  transition: var(--transition-default);
}

.type-button:hover {
  transform: translateY(-2px);
}

.type-button.active {
  background: var(--color-primary);
  box-shadow: var(--shadow-medium);
}

.type-icon {
  font-size: 28px;
}

.type-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.type-button.active .type-label {
  color: var(--color-white);
}

.milestone-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-alt);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 500;
}

.toggle-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.milestones-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
}

.milestone-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.milestone-inputs {
  display: flex;
  gap: 12px;
  flex: 1;
}

.milestone-value {
  flex: 0 0 100px;
}

.milestone-reward {
  flex: 1;
}

.remove-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-error);
  color: var(--color-white);
  border-radius: var(--radius-xs);
  opacity: 0.8;
}

.remove-button:hover {
  opacity: 1;
}

.remove-button svg {
  width: 18px;
  height: 18px;
}

.add-milestone-button {
  padding: 10px 16px;
  background: transparent;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
  border: 1px dashed var(--color-primary-light);
  border-radius: var(--radius-md);
}

.add-milestone-button:hover {
  background: var(--color-bg-alt);
}

.submit-button {
  width: 100%;
  margin-top: 8px;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
