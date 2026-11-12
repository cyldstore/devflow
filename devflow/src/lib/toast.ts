import { createToastManager } from 'reka-ui'

export interface ToastExtraAction {
  label: string
  onClick: () => void
}

export interface ToastData {
  secondaryAction?: ToastExtraAction
}

export const toast = createToastManager<ToastData>()
