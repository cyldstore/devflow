import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/base.css'
import './styles/forms.css'
import { persistAiSession } from '@/stores/ai/persist'
import { initPerfMonitoring } from '@/lib/perf'
import { sendPerfReport } from '@/lib/perf-reporter'

initPerfMonitoring({ onReport: sendPerfReport })

const pinia = createPinia()
pinia.use(persistAiSession)

createApp(App).use(pinia).use(router).mount('#app')
