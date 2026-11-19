import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: () => import('@/pages/OverviewView.vue'),
      meta: { title: '概览' },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/pages/TasksView.vue'),
      meta: { title: '任务' },
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('@/pages/KnowledgeView.vue'),
      meta: { title: '知识库' },
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: () => import('@/pages/JobsView.vue'),
      meta: { title: '求职' },
    },
    {
      path: '/insights',
      name: 'insights',
      component: () => import('@/pages/InsightsView.vue'),
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
