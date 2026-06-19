<script setup>
import { computed, ref, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { requestApiTest } from '@/api/test'

const methods = ['get', 'post', 'patch', 'delete']
const method = ref('get')
const path = ref('/api/test/success')
const includeBearer = ref(false)
const bodyText = ref('{\n  \n}')
const inputError = ref('')

const supportsBody = computed(() => method.value !== 'get')

const apiTestMutation = useMutation({
  mutationFn: requestApiTest,
  meta: {
    errorMode: 'local',
  },
})

const result = computed(() => {
  if (inputError.value) {
    return inputError.value
  }

  if (apiTestMutation.data.value !== undefined) {
    return JSON.stringify(apiTestMutation.data.value, null, 2)
  }

  const error = apiTestMutation.error.value

  if (!error) {
    return ''
  }

  return JSON.stringify(
    {
      name: error.name,
      type: error.type,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
    },
    null,
    2,
  )
})

const hasError = computed(() => Boolean(inputError.value) || apiTestMutation.isError.value)

watch([method, path, includeBearer, bodyText], () => {
  inputError.value = ''
})

function parseBody() {
  if (!supportsBody.value || !bodyText.value.trim()) {
    return undefined
  }

  return JSON.parse(bodyText.value)
}

function runApiTest() {
  const requestPath = path.value.trim()

  if (!requestPath) {
    return
  }

  apiTestMutation.reset()
  inputError.value = ''

  let body

  try {
    body = parseBody()
  } catch (error) {
    inputError.value = `Body JSON 문법 오류: ${error.message}`
    return
  }

  const requestInfo = {
    method: method.value,
    path: requestPath,
    body,
    includeBearer: includeBearer.value,
  }

  apiTestMutation.mutate(requestInfo)
}
</script>

<template>
  <main class="path-api-test-view">
    <section class="test-card">
      <header>
        <p class="eyebrow">Development tool</p>
        <h1>API 요청 테스트</h1>
        <p>메서드, 경로, Bearer Token 포함 여부와 JSON body를 설정해 요청합니다.</p>
      </header>

      <form @submit.prevent="runApiTest">
        <div class="request-row">
          <label class="field method-field">
            <span>Method</span>
            <select v-model="method">
              <option v-for="item in methods" :key="item" :value="item">
                {{ item.toUpperCase() }}
              </option>
            </select>
          </label>

          <label class="field path-field">
            <span>API path</span>
            <input
              v-model="path"
              type="text"
              placeholder="/api/test/success"
              autocomplete="off"
            />
          </label>
        </div>

        <label class="bearer-option">
          <input v-model="includeBearer" type="checkbox" />
          <span>Bearer Token 포함</span>
        </label>

        <label class="field">
          <span>JSON Body {{ supportsBody ? '' : '(GET 요청에서는 사용하지 않음)' }}</span>
          <textarea
            v-model="bodyText"
            :disabled="!supportsBody"
            rows="10"
            spellcheck="false"
            placeholder='{"email":"example@example.com"}'
          />
        </label>

        <button type="submit" :disabled="apiTestMutation.isPending.value || !path.trim()">
          {{ apiTestMutation.isPending.value ? '요청 중...' : '테스트 요청' }}
        </button>
      </form>

      <section v-if="result" class="result" :class="{ error: hasError }">
        <h2>{{ hasError ? '에러 결과' : '성공 응답' }}</h2>
        <pre>{{ result }}</pre>
      </section>
    </section>
  </main>
</template>

<style scoped>
.path-api-test-view {
  display: grid;
  min-height: calc(100vh - 8rem);
  padding: 2rem 1rem 7rem;
  place-items: start center;
}

.test-card {
  display: grid;
  width: min(100%, 52rem);
  padding: 1.5rem;
  gap: 1.5rem;
  background: rgba(28, 43, 61, 0.92);
  border: 1px solid rgba(117, 215, 255, 0.16);
  border-radius: 1rem;
}

.eyebrow {
  color: #75d7ff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.4rem;
  font-size: 1.5rem;
}

header p:last-child {
  margin-top: 0.65rem;
  color: #aebdce;
  line-height: 1.6;
}

form,
.field,
.result {
  display: grid;
  gap: 0.65rem;
}

.request-row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: 0.75rem;
}

.field > span,
.result h2 {
  color: #d8f5ff;
  font-size: 0.82rem;
  font-weight: 700;
}

input[type='text'],
select,
textarea {
  width: 100%;
  min-width: 0;
  padding: 0.8rem;
  color: #e1f7ff;
  background: #091522;
  border: 1px solid #365066;
  border-radius: 0.7rem;
}

textarea {
  resize: vertical;
  font-family: monospace;
  line-height: 1.5;
}

textarea:disabled {
  opacity: 0.4;
}

.bearer-option {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: fit-content;
  color: #d8f5ff;
  font-size: 0.86rem;
}

button {
  min-height: 2.8rem;
  padding: 0 1rem;
  color: #06131f;
  background: #83ddff;
  border-radius: 0.7rem;
  font-weight: 700;
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

pre {
  overflow: auto;
  max-height: 28rem;
  padding: 1rem;
  color: #d9f6ff;
  background: #091522;
  border-radius: 0.65rem;
  font-size: 0.78rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.result.error pre {
  color: #ffd7d7;
}

@media (max-width: 560px) {
  .request-row {
    grid-template-columns: 1fr;
  }
}
</style>
