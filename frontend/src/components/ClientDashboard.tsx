import { Box, Typography, Button, Card, CardContent, Tabs, Tab, List, ListItem, ListItemText, Chip } from '@mui/material';
import { LogOut as LogOutIcon, Calendar as CalendarIcon } from 'lucide-react';

interface ClientDashboardProps {
    history: { guestName: string; bookings: any[]; orders: any[] };
    historyTab: number;
    setHistoryTab: (value: number) => void;
    onNewBooking: () => void;
    onLogout: () => void;
}

const statusTranslations: { [key: string]: string } = {
    'open': 'Активен',
    'preparing': 'Готовится',
    'ready': 'Готов',
    'served': 'Подано',
    'closed': 'Завершен',
    'cancelled': 'Отменен',
    'pending': 'Ожидает'
};

export const ClientDashboard = ({ history, historyTab, setHistoryTab, onNewBooking, onLogout }: ClientDashboardProps) => (
    <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h5" fontWeight="bold">
                Личный кабинет {history.guestName ? `(${history.guestName})` : ''}
            </Typography>
            <Button startIcon={<LogOutIcon size={20} />} color="inherit" onClick={onLogout}>
                Выйти
            </Button>
        </Box>

        <Button 
            variant="contained" 
            size="large" 
            onClick={onNewBooking}
            sx={{ mb: 4 }}
        >
            Новое бронирование
        </Button>

        <Card elevation={2}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={historyTab} onChange={(_, v) => setHistoryTab(v)} variant="fullWidth">
                    <Tab label="Мои бронирования" />
                    <Tab label="Мои заказы" />
                </Tabs>
            </Box>
            <CardContent>
                {historyTab === 0 && (
                    history.bookings.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={4}>У вас пока нет бронирований</Typography>
                    ) : (
                        <List>
                            {history.bookings.map(b => (
                                <ListItem key={b.id} divider>
                                    <ListItemText 
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <CalendarIcon size={18} />
                                                <Typography fontWeight="bold">{b.booking_date}</Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box mt={1}>
                                                <Typography variant="body2">Стол: {b.table_number} • Гостей: {b.pax}</Typography>
                                                <Box display="flex" gap={0.5} mt={0.5}>
                                                    {b.slots.map((s: any) => (
                                                        <Chip key={s.id} label={s.time} size="small" variant="outlined" />
                                                    ))}
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )
                )}

                {historyTab === 1 && (
                    history.orders.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={4}>У вас пока нет заказов</Typography>
                    ) : (
                        <List>
                            {history.orders.map(o => (
                                <ListItem key={o.id} divider sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                                        <Typography fontWeight="bold">
                                            Заказ #{o.id} (Стол {o.table_number})
                                        </Typography>
                                        <Chip 
                                            label={statusTranslations[o.status] || o.status} 
                                            color={['open', 'preparing', 'ready', 'served'].includes(o.status) ? 'primary' : 'default'}
                                            size="small" 
                                        />
                                    </Box>
                                    <Box width="100%" mb={1}>
                                        {o.items?.map((item: any) => (
                                            <Typography key={item.id} variant="body2" color="text.secondary">
                                                {item.quantity}x {item.name} - {item.price * item.quantity} ₽
                                            </Typography>
                                        ))}
                                    </Box>
                                    <Typography variant="subtitle2" fontWeight="bold" alignSelf="flex-end">
                                        Итого: {o.total} ₽
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    )
                )}
            </CardContent>
        </Card>
    </Box>
);
