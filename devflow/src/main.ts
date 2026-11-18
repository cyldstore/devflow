import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/base.css'
import './styles/forms.css'
import { persistAiSession } from '@/stores/ai/persist'

const pinia = createPinia()
pinia.use(persistAiSession)

createApp(App).use(pinia).use(router).mount('#app')
