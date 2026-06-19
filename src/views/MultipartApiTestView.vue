<script setup>
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { requestMultipartApiTest } from '@/api/test'
import { useAuthStore } from '@/stores/auth'

const methods = ['post', 'put', 'patch', 'delete']
let nextFieldId = 0

function createFieldId() {
  nextFieldId += 1
  return nextFieldId
}

const method = ref('patch')
const path = ref('/api/users/me')
const textFields = ref([{ id: createFieldId(), name: 'nickname', value: '새닉네임' }])
const fileFields = ref([{ id: createFieldId(), name: 'profileImage', file: null }])
const inputError = ref('')
const authStore = useAuthStore()

const multipartMutation = useMutation({
  mutationFn: requestMultipartApiTest,
  meta: {
    errorMode: 'local',
  },
})

const result = computed(() => {
  if (inputError.value) {
    return inputError.value
  }

  if (multipartMutation.data.value !== undefined) {
    return JSON.stringify(multipartMutation.data.value, null, 2)
  }

  const error = multipartMutation.error.value

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

const hasError = computed(() => Boolean(inputError.value) || multipartMutation.isError.value)

function addTextField() {
  textFields.value.push({ id: createFieldId(), name: '', value: '' })
}

function addFileField() {
  fileFields.value.push({ id: createFieldId(), name: '', file: null })
}

function removeField(fields, id) {
  const index = fields.findIndex((field) => field.id === id)

  if (index !== -1) {
    fields.splice(index, 1)
  }
}

function selectFile(field, event) {
  field.file = event.target.files?.[0] ?? null
}

function buildFormData() {
  const formData = new FormData()

  for (const field of textFields.value) {
    const name = field.name.trim()

    if (name) {
      formData.append(name, field.value)
    }
  }

  for (const field of fileFields.value) {
    const name = field.name.trim()

    if (name && field.file) {
      formData.append(name, field.file)
    }
  }

  return formData
}

function runMultipartTest() {
  const requestPath = path.value.trim()

  if (!requestPath) {
    inputError.value = 'API path를 입력해주세요.'
    return
  }

  const formData = buildFormData()

  if ([...formData.keys()].length === 0) {
    inputError.value = '전송할 multipart 필드를 하나 이상 입력해주세요.'
    return
  }

  multipartMutation.reset()
  inputError.value = ''
  multipartMutation.mutate({
    method: method.value,
    path: requestPath,
    formData,
  })
}
</script>

<template>
  <main class="multipart-api-test-view">
    <section class="test-card">
      <header>
        <p class="eyebrow">Development tool</p>
        <h1>Multipart API 요청 테스트</h1>
        <p>
          텍스트와 이미지 등의 파일을 multipart/form-data로 전송합니다. 요청에는 Pinia의 Access
          Token이 항상 포함됩니다.
        </p>
      </header>

      <div class="token-state">
        <span>Authorization</span>
        <strong>{{ authStore.accessToken ? 'Bearer Token 준비됨' : '토큰 없음 - 재발급 시도' }}</strong>
      </div>

      <form @submit.prevent="runMultipartTest">
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
            <input v-model="path" type="text" placeholder="/api/users/me" autocomplete="off" />
          </label>
        </div>

        <section class="fields-section">
          <div class="section-heading">
            <div>
              <h2>Text fields</h2>
              <p>문자열로 전송할 필드를 입력합니다.</p>
            </div>
            <button type="button" class="secondary-button" @click="addTextField">필드 추가</button>
          </div>

          <div v-for="field in textFields" :key="field.id" class="field-row">
            <label class="field">
              <span>Field name</span>
              <input v-model="field.name" type="text" placeholder="nickname" />
            </label>
            <label class="field">
              <span>Value</span>
              <input v-model="field.value" type="text" placeholder="새닉네임" />
            </label>
            <button
              type="button"
              class="remove-button"
              aria-label="텍스트 필드 삭제"
              @click="removeField(textFields, field.id)"
            >
              삭제
            </button>
          </div>
        </section>

        <section class="fields-section">
          <div class="section-heading">
            <div>
              <h2>File fields</h2>
              <p>이미지 등 실제 파일을 선택해 전송합니다.</p>
            </div>
            <button type="button" class="secondary-button" @click="addFileField">파일 추가</button>
          </div>

          <div v-for="field in fileFields" :key="field.id" class="field-row">
            <label class="field">
              <span>Field name</span>
              <input v-model="field.name" type="text" placeholder="profileImage" />
            </label>
            <label class="field">
              <span>File</span>
              <input type="file" @change="selectFile(field, $event)" />
            </label>
            <button
              type="button"
              class="remove-button"
              aria-label="파일 필드 삭제"
              @click="removeField(fileFields, field.id)"
            >
              삭제
            </button>
          </div>
        </section>

        <button
          type="submit"
          class="submit-button"
          :disabled="multipartMutation.isPending.value || !path.trim()"
        >
          {{ multipartMutation.isPending.value ? '요청 중...' : 'Multipart 요청 전송' }}
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
.multipart-api-test-view {
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

header p:last-child,
.section-heading p {
  margin-top: 0.65rem;
  color: #aebdce;
  line-height: 1.6;
}

form,
.field,
.fields-section,
.result {
  display: grid;
  gap: 0.75rem;
}

.request-row,
.field-row {
  display: grid;
  grid-template-columns: 8rem 1fr auto;
  align-items: end;
  gap: 0.75rem;
}

.request-row {
  grid-template-columns: 8rem 1fr;
}

.field > span,
.result h2,
.section-heading h2,
.token-state span {
  color: #d8f5ff;
  font-size: 0.82rem;
  font-weight: 700;
}

input,
select {
  width: 100%;
  min-width: 0;
  padding: 0.8rem;
  color: #e1f7ff;
  background: #091522;
  border: 1px solid #365066;
  border-radius: 0.7rem;
}

input[type='file']::file-selector-button {
  margin-right: 0.75rem;
  padding: 0.4rem 0.65rem;
  color: #d8f5ff;
  background: #263e52;
  border: 0;
  border-radius: 0.45rem;
}

.token-state,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.token-state {
  padding: 0.9rem;
  background: #0c1927;
  border-radius: 0.7rem;
}

.token-state strong {
  color: #83ddff;
  font-size: 0.82rem;
}

.fields-section {
  padding: 1rem;
  background: rgba(9, 21, 34, 0.55);
  border-radius: 0.8rem;
}

button {
  min-height: 2.8rem;
  padding: 0 1rem;
  border-radius: 0.7rem;
  font-weight: 700;
}

.submit-button {
  color: #06131f;
  background: #83ddff;
}

.secondary-button,
.remove-button {
  color: #d8f5ff;
  background: #263e52;
}

.remove-button {
  color: #ffd7d7;
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

@media (max-width: 640px) {
  .request-row,
  .field-row {
    grid-template-columns: 1fr;
  }

  .section-heading,
  .token-state {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
