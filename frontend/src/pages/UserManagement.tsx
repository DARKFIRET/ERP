import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Select, FormControl, InputLabel, Tabs, Tab, Card, Chip,
    Snackbar, Alert, Grid, InputAdornment
} from '@mui/material';
import { Trash2, Plus, Calendar, User as UserIcon, Clock, Lock, Briefcase, Contact } from 'lucide-react';
import { useAuth } from '../auth';

interface User {
    id: number;
    username: string;
    role: string;
    first_name: string;
    last_name: string;
}

interface Role {
    id: number;
    name: string;
}

interface Shift {
    id: number;
    username: string;
    start_time: string;
    end_time: string;
}

const roleTranslations: Record<string, string> = {
    'admin': 'Администратор',
    'waiter': 'Официант',
    'cook': 'Повар',
    'manager': 'Менеджер'
};

const UserManagement = () => {
    const [tab, setTab] = useState(0);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);

    const [openUser, setOpenUser] = useState(false);
    const [openShift, setOpenShift] = useState(false);

    const [userForm, setUserForm] = useState({ username: '', password: '', role_id: '', first_name: '', last_name: '' });
    const [shiftForm, setShiftForm] = useState({ userId: '', date: '', start: '', end: '' });

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchRoles();
            fetchShifts();
        }
    }, [token]);

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                setUsers(await res.json());
            } else {
                console.error('Failed to fetch users');
            }
        } catch (e) { console.error(e); }
    };

    const fetchRoles = async () => {
        try {
            // Use relative URL if possible or full URL
            const res = await fetch('http://localhost:3000/roles', { 
                headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Roles fetched:', data);
                setRoles(data);
                // alert('Roles loaded: ' + data.length); // Commented out to be less intrusive but can uncomment if needed
            } else {
                console.error('Failed to fetch roles:', res.status);
                showSnackbar('Не удалось загрузить роли: ' + res.status, 'error');
                // Fallback for debugging/demo if backend fails
                setRoles([
                    { id: 1, name: 'admin' },
                    { id: 2, name: 'waiter' },
                    { id: 3, name: 'cook' },
                    { id: 4, name: 'manager' }
                ]);
            }
        } catch (e) { 
            console.error(e); 
            showSnackbar('Ошибка загрузки ролей (сеть)', 'error');
             // Fallback for debugging/demo if backend fails
             setRoles([
                { id: 1, name: 'admin' },
                { id: 2, name: 'waiter' },
                { id: 3, name: 'cook' },
                { id: 4, name: 'manager' }
            ]);
        }
    };

    const fetchShifts = async () => {
        try {
            const res = await fetch('http://localhost:3000/shifts', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setShifts(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (openUser && roles.length === 0) {
            fetchRoles();
        }
    }, [openUser]);

    const handleCreateUser = async () => {
        if (!userForm.username || !userForm.password || !userForm.role_id) {
            showSnackbar('Заполните обязательные поля', 'error');
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(userForm)
            });
            if (res.ok) {
                setOpenUser(false);
                setUserForm({ username: '', password: '', role_id: '', first_name: '', last_name: '' });
                fetchUsers();
                showSnackbar('Сотрудник добавлен', 'success');
            } else {
                showSnackbar('Ошибка создания пользователя', 'error');
            }
        } catch (e) { console.error(e); showSnackbar('Ошибка сети', 'error'); }
    };

    const handleCreateShift = async () => {
        if (!shiftForm.userId || !shiftForm.date || !shiftForm.start || !shiftForm.end) {
            showSnackbar('Заполните все поля смены', 'error');
            return;
        }
        try {
            const start = new Date(`${shiftForm.date}T${shiftForm.start}`).toISOString();
            const end = new Date(`${shiftForm.date}T${shiftForm.end}`).toISOString();

            const res = await fetch('http://localhost:3000/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: shiftForm.userId, start, end })
            });
            if (res.ok) {
                setOpenShift(false);
                setShiftForm({ userId: '', date: '', start: '', end: '' });
                fetchShifts();
                showSnackbar('Смена добавлена', 'success');
            } else {
                showSnackbar('Ошибка добавления смены', 'error');
            }
        } catch (e) { console.error(e); showSnackbar('Ошибка сети', 'error'); }
    };

    const handleDeleteUser = async (id: number) => {
        if (window.confirm('Уволить сотрудника?')) {
            try {
                await fetch(`http://localhost:3000/users/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchUsers();
                showSnackbar('Сотрудник удален', 'success');
            } catch (e) {
                console.error(e);
                showSnackbar('Ошибка удаления', 'error');
            }
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'error';
            case 'manager': return 'primary';
            case 'waiter': return 'success';
            case 'cook': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>Управление персоналом</Typography>
                <Typography variant="body1" color="text.secondary">Администрирование сотрудников и графиков смен</Typography>
            </Box>

            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab label="Сотрудники" icon={<UserIcon size={18} />} iconPosition="start" />
                        <Tab label="График смен" icon={<Calendar size={18} />} iconPosition="start" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    {tab === 0 && (
                        <>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6">Список сотрудников</Typography>
                                <Button variant="contained" startIcon={<Plus />} onClick={() => setOpenUser(true)}>
                                    Новый сотрудник
                                </Button>
                            </Box>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: 'background.default' }}>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>ФИО</TableCell>
                                            <TableCell>Логин</TableCell>
                                            <TableCell>Роль</TableCell>
                                            <TableCell align="right">Действия</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id} hover>
                                                <TableCell>{user.id}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{user.first_name} {user.last_name}</TableCell>
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={roleTranslations[user.role] || user.role}
                                                        size="small"
                                                        color={getRoleColor(user.role) as any}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        size="small"
                                                        sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    {tab === 1 && (
                        <>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6">Расписание смен</Typography>
                                <Button variant="contained" startIcon={<Calendar />} onClick={() => setOpenShift(true)}>
                                    Добавить смену
                                </Button>
                            </Box>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: 'background.default' }}>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Сотрудник</TableCell>
                                            <TableCell>Начало</TableCell>
                                            <TableCell>Конец</TableCell>
                                            <TableCell>Длительность</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {shifts.map((shift) => {
                                            const start = new Date(shift.start_time);
                                            const end = new Date(shift.end_time);
                                            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                            return (
                                                <TableRow key={shift.id} hover>
                                                    <TableCell>{shift.id}</TableCell>
                                                    <TableCell sx={{ fontWeight: 500 }}>{shift.username}</TableCell>
                                                    <TableCell>{start.toLocaleString()}</TableCell>
                                                    <TableCell>{end.toLocaleString()}</TableCell>
                                                    <TableCell>{duration.toFixed(1)} ч.</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Box>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={openUser} onClose={() => setOpenUser(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    Добавить сотрудника
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Логин"
                                fullWidth
                                required
                                value={userForm.username}
                                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><UserIcon size={18} /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Пароль"
                                type="password"
                                fullWidth
                                required
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock size={18} /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Имя"
                                fullWidth
                                value={userForm.first_name}
                                onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Contact size={18} /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Фамилия"
                                fullWidth
                                value={userForm.last_name}
                                onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Contact size={18} /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Роль</InputLabel>
                                <Select
                                    value={userForm.role_id}
                                    label="Роль"
                                    onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                                    startAdornment={<InputAdornment position="start" sx={{ ml: 1, mr: -1 }}><Briefcase size={18} /></InputAdornment>}
                                >
                                    {roles.map(role => (
                                        <MenuItem key={role.id} value={role.id}>{roleTranslations[role.name] || role.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setOpenUser(false)} color="inherit">Отмена</Button>
                    <Button variant="contained" onClick={handleCreateUser}>Создать</Button>
                </DialogActions>
            </Dialog>

            {/* Create Shift Dialog */}
            <Dialog open={openShift} onClose={() => setOpenShift(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>Добавить смену</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Сотрудник</InputLabel>
                                <Select
                                    value={shiftForm.userId}
                                    label="Сотрудник"
                                    onChange={(e) => setShiftForm({ ...shiftForm, userId: e.target.value })}
                                    startAdornment={<InputAdornment position="start" sx={{ ml: 1, mr: -1 }}><UserIcon size={18} /></InputAdornment>}
                                >
                                    {users.map(user => (
                                        <MenuItem key={user.id} value={user.id}>{user.username} ({roleTranslations[user.role] || user.role})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Дата смены"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={shiftForm.date}
                                onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Начало"
                                type="time"
                                InputLabelProps={{ shrink: true }}
                                value={shiftForm.start}
                                onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Clock size={18} /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Конец"
                                type="time"
                                InputLabelProps={{ shrink: true }}
                                value={shiftForm.end}
                                onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Clock size={18} /></InputAdornment>,
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setOpenShift(false)} color="inherit">Отмена</Button>
                    <Button variant="contained" onClick={handleCreateShift}>Сохранить</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserManagement;
