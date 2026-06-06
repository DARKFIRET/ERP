import { useState, useEffect } from 'react';
import { Container, Typography, Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import { fetchTables, fetchTimeSlots, fetchBookings, createBooking, fetchMenu, createOrder, fetchClientHistory, sendOtp, fetchMenuAvailability } from '../api';
import type { TableData, TimeSlot, BookingData, MenuItemData, MenuAvailability } from '../types';

// Import split components
import { ClientLogin } from '../components/ClientLogin';
import { ClientDashboard } from '../components/ClientDashboard';
import { ClientBooking } from '../components/ClientBooking';
import { ClientOrdering } from '../components/ClientOrdering';
import { OtpDialog } from '../components/OtpDialog';

export default function ClientPortal() {
    const [view, setView] = useState<'login' | 'dashboard' | 'booking' | 'ordering'>('login');
    const [phone, setPhone] = useState('');
    const [guestName, setGuestName] = useState('');
    const [tables, setTables] = useState<TableData[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [menu, setMenu] = useState<MenuItemData[]>([]);
    const [availability, setAvailability] = useState<MenuAvailability>({});
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<{ guestName: string, bookings: any[], orders: any[] }>({ guestName: '', bookings: [], orders: [] });
    const [historyTab, setHistoryTab] = useState(0);

    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [pendingPhone, setPendingPhone] = useState('');

    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [pax, setPax] = useState(2);
    const [selectedTableId, setSelectedTableId] = useState<number | ''>('');
    const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
    const [cart, setCart] = useState<{ [id: number]: number }>({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        const savedPhone = localStorage.getItem('client_phone');
        if (savedPhone) {
            setPhone(savedPhone);
            loadClientHistory(savedPhone);
            setView('dashboard');
        } else {
            setLoading(false);
        }
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [tablesData, slotsData, bookingsData, menuData, availabilityData] = await Promise.all([
                fetchTables(), fetchTimeSlots(), fetchBookings(), fetchMenu(), fetchMenuAvailability()
            ]);
            setTables(tablesData);
            setTimeSlots(slotsData);
            setBookings(bookingsData);
            setMenu(menuData);
            setAvailability(availabilityData);
        } catch (error) {
            showNotification("Ошибка загрузки данных", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadClientHistory = async (phoneNumber: string) => {
        try {
            setLoading(true);
            const data = await fetchClientHistory(phoneNumber);
            setHistory(data);
            if (data.guestName) setGuestName(data.guestName);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (phone.replace(/\D/g, '').length < 11) {
            showNotification("Введите полный номер телефона", "error");
            return;
        }
        try {
            await sendOtp(phone);
            setPendingPhone(phone);
            setOtpDialogOpen(true);
        } catch {
            showNotification("Не удалось отправить код. Попробуйте позже", "error");
        }
    };

    const handleOtpVerified = () => {
        setOtpDialogOpen(false);
        localStorage.setItem('client_phone', pendingPhone);
        loadClientHistory(pendingPhone);
        setView('dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('client_phone');
        setPhone('');
        setGuestName('');
        setView('login');
    };

    const showNotification = (message: string, severity: 'success' | 'error' = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const isSlotOccupied = (slotId: number) => {
        if (!date || selectedTableId === '') return false;
        return bookings.some(booking =>
            booking.table_id === selectedTableId &&
            booking.booking_date === date &&
            booking.slots.some(s => s.id === slotId)
        );
    };

    const handleBookingSubmit = async () => {
        try {
            await createBooking({
                tableId: Number(selectedTableId),
                guestName,
                phone,
                pax,
                date,
                slotIds: selectedSlotIds
            });
            showNotification("Столик успешно забронирован!", "success");
            setView('ordering');
        } catch (error) {
            showNotification("Ошибка при бронировании.", "error");
            fetchBookings().then(setBookings);
        }
    };

    const handleOrderSubmit = async () => {
        const itemsToOrder = Object.entries(cart).map(([id, quantity]) => {
            const item = menu.find(m => m.id === Number(id));
            return { menu_item_id: Number(id), quantity, price: item ? item.price : 0 };
        });
        try {
            await createOrder(Number(selectedTableId), itemsToOrder, phone);
            showNotification("Заказ успешно оформлен!", "success");
            setCart({});
            setTimeout(() => { loadClientHistory(phone); setView('dashboard'); }, 2000);
        } catch (error) {
            showNotification("Ошибка при оформлении заказа.", "error");
        }
    };

    const addToCart = (itemId: number) => setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    const removeFromCart = (itemId: number) => setCart(prev => {
        const next = { ...prev };
        if (next[itemId] > 1) next[itemId] -= 1;
        else delete next[itemId];
        return next;
    });
    const getCartTotal = () => Object.keys(cart).reduce((sum, id) => {
        const item = menu.find(m => m.id === Number(id));
        return sum + (item ? item.price * cart[Number(id)] : 0);
    }, 0);

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box textAlign="center" mb={4}>
                <Typography variant="h3" component="h1" fontWeight="bold" color="primary">ERP</Typography>
                <Typography variant="subtitle1" color="text.secondary">Ресторан & Кафе</Typography>
            </Box>

            {view === 'login' && (
                <ClientLogin phone={phone} setPhone={setPhone} onLogin={handleLogin} />
            )}

            {view === 'dashboard' && (
                <ClientDashboard
                    history={history}
                    historyTab={historyTab}
                    setHistoryTab={setHistoryTab}
                    onNewBooking={() => { setSelectedTableId(''); setSelectedSlotIds([]); setCart({}); setView('booking'); }}
                    onLogout={handleLogout}
                />
            )}

            {view === 'booking' && (
                <ClientBooking
                    guestName={guestName} setGuestName={setGuestName} phone={phone}
                    date={date} setDate={setDate} pax={pax} setPax={setPax}
                    tables={tables} selectedTableId={selectedTableId} setSelectedTableId={setSelectedTableId}
                    timeSlots={timeSlots} selectedSlotIds={selectedSlotIds} setSelectedSlotIds={setSelectedSlotIds}
                    isSlotOccupied={isSlotOccupied} onBack={() => setView('dashboard')} onSubmit={handleBookingSubmit}
                />
            )}

            {view === 'ordering' && (
                <ClientOrdering
                    menu={menu} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart}
                    getCartTotal={getCartTotal} onSubmit={handleOrderSubmit} availability={availability}
                    onSkip={() => { showNotification("Ждем вас в гости!", "success"); setTimeout(() => { loadClientHistory(phone); setView('dashboard'); }, 2000); }}
                />
            )}

            <OtpDialog
                open={otpDialogOpen}
                phone={pendingPhone}
                onVerified={handleOtpVerified}
                onClose={() => setOtpDialogOpen(false)}
            />

            <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={notification.severity} sx={{ width: '100%' }}>{notification.message}</Alert>
            </Snackbar>
        </Container>
    );
}
