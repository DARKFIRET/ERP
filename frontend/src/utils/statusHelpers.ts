export const tableStatusColor: Record<string, string> = {
  free: '#43a047',
  occupied: '#e53935',
  reserved: '#fb8c00',
  dirty: '#757575',
};

export const tableStatusLabel: Record<string, string> = {
  free: 'Свободен',
  occupied: 'Занят',
  reserved: 'Забронирован',
  dirty: 'Грязный',
};

export const orderStatusChipColor = (status: string): 'primary' | 'warning' | 'success' | 'default' => {
  switch (status) {
    case 'open': return 'primary';
    case 'cooking': return 'warning';
    case 'ready': return 'success';
    default: return 'default';
  }
};

export const orderStatusLabel: Record<string, string> = {
  open: 'Активен',
  preparing: 'Готовится',
  cooking: 'Готовится',
  ready: 'Готов',
  served: 'Подано',
  closed: 'Завершен',
  cancelled: 'Отменен',
  pending: 'Ожидает',
};
