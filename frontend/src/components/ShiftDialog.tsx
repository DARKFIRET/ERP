import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Select, FormControl, InputLabel, Grid, InputAdornment,
} from '@mui/material';
import { useState } from 'react';
import { User as UserIcon, Calendar, Clock } from 'lucide-react';
import { roleTranslations } from '../utils/constants';

interface User {
  id: number;
  username: string;
  role: string;
}

interface ShiftDialogProps {
  open: boolean;
  users: User[];
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

const ShiftDialog = ({ open, users, token, onClose, onSaved, onError }: ShiftDialogProps) => {
  const [form, setForm] = useState({ userId: '', date: '', start: '', end: '' });

  const handleCreate = async () => {
    if (!form.userId || !form.date || !form.start || !form.end) {
      onError('Заполните все поля смены');
      return;
    }
    try {
      const start = new Date(`${form.date}T${form.start}`).toISOString();
      const end = new Date(`${form.date}T${form.end}`).toISOString();
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: form.userId, start, end }),
      });
      if (res.ok) {
        setForm({ userId: '', date: '', start: '', end: '' });
        onClose();
        onSaved();
      } else {
        onError('Ошибка добавления смены');
      }
    } catch {
      onError('Ошибка сети');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>Добавить смену</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Сотрудник</InputLabel>
              <Select value={form.userId} label="Сотрудник" onChange={(e) => setForm({ ...form, userId: e.target.value })}
                startAdornment={<InputAdornment position="start" sx={{ ml: 1, mr: 1 }}><UserIcon size={18} /></InputAdornment>}>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>{user.username} ({roleTranslations[user.role] || user.role})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Дата смены" type="date" InputLabelProps={{ shrink: true }} fullWidth
              value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Начало" type="time" InputLabelProps={{ shrink: true }} fullWidth
              value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Clock size={18} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Конец" type="time" InputLabelProps={{ shrink: true }} fullWidth
              value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Clock size={18} /></InputAdornment> }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">Отмена</Button>
        <Button variant="contained" onClick={handleCreate}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftDialog;
