import type { TaskStatus } from '../types/generator';

const STATUS_LABEL: Record<TaskStatus, string> = {
  idle: '待生成',
  running: '生成中',
  success: '已完成',
  error: '失败',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{STATUS_LABEL[status]}</span>;
}
