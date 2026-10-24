import { createRouter, createWebHistory } from 'vue-router'
import OverviewView from '@/pages/OverviewView.vue'
import TasksView from '@/pages/TasksView.vue'
import KnowledgeView from '@/pages/KnowledgeView.vue'
import JobsView from '@/pages/JobsView.vue'
import InsightsView from '@/pages/InsightsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: OverviewView,
      meta: { title: '概览' },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TasksView,
      meta: { title: '任务' },
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: KnowledgeView,
      meta: { title: '知识库' },
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: JobsView,
      meta: { title: '求职' },
    },
    {
      path: '/insights',
      name: 'insights',
      component: InsightsView,
      meta: { title: '复盘' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'DevFlow'
  document.title = `${title} · DevFlow`
})

export default router
