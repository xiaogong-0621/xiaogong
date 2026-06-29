import { ref } from 'vue'

const message = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function show(msg: string, duration = 3000) {
    message.value = msg
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { message.value = '' }, duration)
  }

  return { toastMsg: message, showToast: show }
}
