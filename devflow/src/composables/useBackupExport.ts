import { downloadBackup } from '@/lib/backup'
import { toast } from '@/lib/toast'
import { useDatabase } from '@/stores/db'
import { markExported } from '@/stores/backup'

export function useBackupExport() {
  const db = useDatabase()

  function exportData(): void {
    downloadBackup(db)
    markExported()
    toast.add({
      title: '已导出备份',
      description: '文件已保存到下载目录',
      status: 'success',
      duration: 3000,
    })
  }

  return { exportData }
}
