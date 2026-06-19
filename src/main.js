import '@/assets/styles/reset.css'
import '@/assets/styles/global.css'
import '@/assets/fonts/SUIT.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MutationCache, QueryCache, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import { initializeAuthSession } from './services/authSession'
import { handleApiError } from './services/apiErrorHandler'

function handleGlobalError(error, meta, context = {}) {
  const mode =
    meta?.errorMode ?? (context.source === 'query' && context.hasCachedData ? 'silent' : 'page')

  handleApiError(error, { mode })
}

// tanstack query 전역 설정
// 에러 시 handleGlobalError를 실행시키고 자동재요청 등의 설정을 조정
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      handleGlobalError(error, query.meta, {
        source: 'query',
        hasCachedData: query.state.data !== undefined,
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      handleGlobalError(error, mutation.meta, {
        source: 'mutation',
      })
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// MSW 활성화 함수
// .env의 VITE_API_MOCKING 값에 따라 MSW 활성/비활성을 결정
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'true') {
    return
  }

  // MSW를 사용하지 않을때의 불필요한 import를 막기 위한 동적 import
  const { worker } = await import('./mocks/browser')

  // MSW에 등록되지 않은 요청을 실제 네트워크로 전송하는 옵션
  return worker.start({
    onUnhandledRequest(request, print) {
      const { pathname } = new URL(request.url)

      if (pathname.startsWith('/api/')) {
        print.error()
      }
    },
  })
}

async function bootstrap() {
  await enableMocking()

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  await initializeAuthSession()
  app.use(router).use(VueQueryPlugin, {
    queryClient,
  })

  app.mount('#app')
}

bootstrap()
