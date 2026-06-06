import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Select, FormControl, InputLabel, Grid, InputAdornment,
} from '@mui/material';
import { useState } from 'react';
import { User as UserIcon, Lock, Briefcase, Contact } from 'lucide-react';
import { roleTranslations } from '../utils/constants';

interface Role {
  id: number;
  name: string;
}

interface UserDialogProps {
  open: boolean;
  roles: Role[];
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

const UserDialog = ({ open, roles, token, onClose, onSaved, onError }: UserDialogProps) => {
  const [form, setForm] = useState({ username: '', password: '', role_id: '', first_name: '', last_name: '' });

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.role_id) {
      onError('Заполните обязательные поля');
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ username: '', password: '', role_id: '', first_name: '', last_name: '' });
        onClose();
        onSaved();
      } else {
        onError('Ошибка создания пользователя');
      }
    } catch {
      onError('Ошибка сети');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>Добавить сотрудника</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Логин" fullWidth required value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><UserIcon size={18} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Пароль" type="password" fullWidth required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock size={18} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Имя" fullWidth value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Contact size={18} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Фамилия" fullWidth value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Contact size={18} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Роль</InputLabel>
              <Select value={form.role_id} label="Роль" onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                startAdornment={<InputAdornment position="start" sx={{ ml: 1, mr: 1 }}><Briefcase size={18} /></InputAdornment>}>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>{roleTranslations[role.name] || role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">Отмена</Button>
        <Button variant="contained" onClick={handleCreate}>Создать</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog;
