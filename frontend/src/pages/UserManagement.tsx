import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton,
    Tabs, Tab, Card, Chip, Snackbar, Alert,
} from '@mui/material';
import { Trash2, Plus, Calendar, User as UserIcon } from 'lucide-react';
import { useAuth } from '../auth';
import { useSnackbar } from '../hooks/useSnackbar';
import { roleTranslations } from '../utils/constants';
import UserDialog from '../components/UserDialog';
import ShiftDialog from '../components/ShiftDialog';

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

const getRoleColor = (role: string): 'error' | 'primary' | 'success' | 'warning' | 'default' => {
    switch (role) {
        case 'admin': return 'error';
        case 'manager': return 'primary';
        case 'waiter': return 'success';
        case 'cook': return 'warning';
        default: return 'default';
    }
};

const UserManagement = () => {
    const [tab, setTab] = useState(0);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [openUser, setOpenUser] = useState(false);
    const [openShift, setOpenShift] = useState(false);
    const { token } = useAuth();
    const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchRoles();
            fetchShifts();
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setUsers(await res.json());
            else showSnackbar('Не удалось загрузить пользователей', 'error');
        } catch { showSnackbar('Ошибка сети', 'error'); }
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/roles', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            if (res.ok) {
                setRoles(await res.json());
            } else {
                showSnackbar('Не удалось загрузить роли: ' + res.status, 'error');
                setRoles([
                    { id: 1, name: 'admin' }, { id: 2, name: 'waiter' },
                    { id: 3, name: 'cook' }, { id: 4, name: 'manager' }
                ]);
            }
        } catch {
            showSnackbar('Ошибка загрузки ролей (сеть)', 'error');
            setRoles([
                { id: 1, name: 'admin' }, { id: 2, name: 'waiter' },
                { id: 3, name: 'cook' }, { id: 4, name: 'manager' }
            ]);
        }
    };

    const fetchShifts = async () => {
        try {
            const res = await fetch('/api/shifts', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setShifts(await res.json());
        } catch { /* shifts simply won't show */ }
    };

    const handleDeleteUser = async (id: number) => {
        if (window.confirm('Уволить сотрудника?')) {
            try {
                await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                fetchUsers();
                showSnackbar('Сотрудник удален', 'success');
            } catch {
                showSnackbar('Ошибка удаления', 'error');
            }
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
                                                    <Chip label={roleTranslations[user.role] || user.role} size="small"
                                                        color={getRoleColor(user.role)} variant="outlined" />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton color="error" onClick={() => handleDeleteUser(user.id)} size="small"
                                                        sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}>
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

            <UserDialog
                open={openUser}
                roles={roles}
                token={token}
                onClose={() => setOpenUser(false)}
                onSaved={() => { fetchUsers(); showSnackbar('Сотрудник добавлен', 'success'); }}
                onError={(msg) => showSnackbar(msg, 'error')}
            />

            <ShiftDialog
                open={openShift}
                users={users}
                token={token}
                onClose={() => setOpenShift(false)}
                onSaved={() => { fetchShifts(); showSnackbar('Смена добавлена', 'success'); }}
                onError={(msg) => showSnackbar(msg, 'error')}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={hideSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={hideSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserManagement;
