<template>
  <div class="magic-orb-container" :class="{ 'has-easter-egg': showEasterEgg }">
    <svg class="magic-orb" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glass">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glass" />
          <feComposite in="SourceGraphic" in2="glass" operator="atop" />
        </filter>
        
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :stop-color="primaryColor" />
          <stop offset="100%" :stop-color="primaryLightColor" />
        </linearGradient>
        
        <clipPath id="circleClip">
          <circle cx="100" cy="100" r="90" />
        </clipPath>
      </defs>
      
      <circle cx="100" cy="100" r="90" fill="rgba(255, 255, 255, 0.3)" filter="url(#glass)" />
      <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255, 255, 255, 0.5)" stroke-width="2" />
      
      <g clip-path="url(#circleClip)">
        <path 
          class="wave wave-1" 
          :d="wavePath1" 
          fill="url(#waveGradient)" 
          opacity="0.8" 
        />
        <path 
          class="wave wave-2" 
          :d="wavePath2" 
          fill="url(#waveGradient)" 
          opacity="0.5" 
        />
      </g>
      
      <g v-if="showEasterEgg" class="easter-egg">
        <circle cx="160" cy="40" r="15" fill="#FFD700" />
        <circle cx="155" cy="37" r="3" fill="#333" />
        <circle cx="165" cy="37" r="3" fill="#333" />
        <path d="M155 45 Q160 50 165 45" stroke="#333" stroke-width="2" fill="none" />
      </g>
    </svg>
    
    <div class="orb-content">
      <span class="orb-percentage">{{ displayProgress }}%</span>
      <span class="orb-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'accumulation',
    validator: (v) => ['accumulation', 'cycle', 'trend'].includes(v)
  },
  currentValue: {
    type: Number,
    default: 0
  },
  targetValue: {
    type: Number,
    default: 100
  }
});

const displayProgress = ref(0);
const showEasterEgg = ref(false);
const waveOffset1 = ref(0);
const waveOffset2 = ref(0);

const primaryColor = '#8F9C82';
const primaryLightColor = '#B5C1A8';

const normalizedProgress = computed(() => {
  let p = props.progress;
  if (props.type === 'trend') {
    if (props.currentValue <= props.targetValue) {
      p = 100;
    } else {
      const totalChange = props.currentValue - props.targetValue;
      const startValue = props.currentValue;
      p = Math.max(0, Math.min(100, ((startValue - props.currentValue) / (startValue - props.targetValue || 1)) * 100));
    }
  }
  return Math.max(0, Math.min(100, p));
});

const wavePath1 = computed(() => {
  const y = 100 + (1 - normalizedProgress.value / 100) * 180;
  return `M 0 ${y} 
          Q 50 ${y - 20 + waveOffset1.value}, 100 ${y} 
          T 200 ${y} 
          L 200 200 L 0 200 Z`;
});

const wavePath2 = computed(() => {
  const y = 100 + (1 - normalizedProgress.value / 100) * 180 - 10;
  return `M 0 ${y} 
          Q 50 ${y + 15 + waveOffset2.value}, 100 ${y} 
          T 200 ${y} 
          L 200 200 L 0 200 Z`;
});

let animationId;

const animateWaves = () => {
  waveOffset1.value = Math.sin(Date.now() / 1000) * 10;
  waveOffset2.value = Math.cos(Date.now() / 800) * 8;
  animationId = requestAnimationFrame(animateWaves);
};

const animateProgress = (target) => {
  const start = displayProgress.value;
  const duration = 1000;
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    displayProgress.value = Math.round(start + (target - start) * easeOut);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

watch(() => props.progress, (newVal) => {
  const target = normalizedProgress.value;
  animateProgress(target);
  
  if (target >= 50 && target < 100 && !showEasterEgg.value) {
    showEasterEgg.value = true;
    setTimeout(() => {
      showEasterEgg.value = false;
    }, 3000);
  }
  
  if (target >= 100) {
    showEasterEgg.value = true;
  }
}, { immediate: true });

onMounted(() => {
  animateWaves();
});

defineExpose({
  displayProgress
});
</script>

<style scoped>
.magic-orb-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.magic-orb {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.wave {
  animation: none;
}

.orb-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.orb-percentage {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text-primary);
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
}

.orb-label {
  display: block;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.easter-egg {
  animation: bounce 0.5s ease-in-out infinite alternate;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-5px);
  }
}

.has-easter-egg .magic-orb {
  animation: glow 1s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 5px rgba(143, 156, 130, 0.3));
  }
  to {
    filter: drop-shadow(0 0 20px rgba(143, 156, 130, 0.6));
  }
}
</style>
