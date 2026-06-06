import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Avatar, Tooltip, useTheme, Snackbar, Alert } from '@mui/material';
import { Map, Utensils, Clock, LogOut } from 'lucide-react';
import type { TableData } from '../types';
import { fetchTables } from '../api';
import Table from '../components/Table';
import WaiterMenu from '../components/WaiterMenu';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

const WaiterInterface = () => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [view, setView] = useState<'map' | 'menu'>('map');
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'error' });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();

  const loadTables = () => {
    fetchTables().then(setTables).catch(() => {});
  };

  useEffect(() => {
    loadTables();
  }, [refreshTrigger]);

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTable) return;

    if (newStatus === 'occupied' && selectedTable.upcoming_booking) {
      const confirmMessage = `Внимание! На этот стол есть бронь в ${selectedTable.upcoming_booking.time} (${selectedTable.upcoming_booking.guest_name}). Вы уверены, что хотите посадить гостей?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      await fetch(`/api/tables/${selectedTable.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (newStatus !== 'occupied') {
        setActiveBookingId(null);
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedTable(null);
    } catch {
      setSnackbar({ open: true, message: 'Ошибка при обновлении статуса', severity: 'error' });
    }
  };

  const handleSeatBooking = async (bookingId: number) => {
    if (!selectedTable) return;
    try {
      await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           tableId: selectedTable.id,
           items: [],
           bookingId: bookingId
        })
      });

      await fetch(`/api/tables/${selectedTable.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'occupied' })
      });
      setActiveTableId(selectedTable.id);
      setActiveBookingId(bookingId);
      setView('menu');
      setSelectedTable(null);
      setRefreshTrigger(p => p + 1);
    } catch {
      setSnackbar({ open: true, message: 'Ошибка при обновлении статуса', severity: 'error' });
    }
  };

  const handleOpenMenu = () => {
    if (selectedTable) {
      setActiveTableId(selectedTable.id);
      setView('menu');
      setSelectedTable(null);
    }
  };



  const handleActiveOrderClick = (tableId: number) => {
    setActiveTableId(tableId);
    setView('menu');
  };

  const activeTables = useMemo(
    () => tables.filter(t => t.status === 'occupied' || t.status === 'dirty' || (t.status === 'reserved' && t.id === activeTableId)),
    [tables, activeTableId]
  );

  const renderContent = () => {
    if (view === 'menu') {
      if (activeTableId) {
        return <WaiterMenu tableId={activeTableId} bookingId={activeBookingId} onBack={() => { setView('map'); setActiveBookingId(null); }} />;
      } else {
        return (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center' }}>
            <Utensils size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
            <Typography color="text.secondary" variant="h6">Выберите стол на карте</Typography>
            <Typography color="text.secondary" variant="body2">или из активных заказов слева</Typography>
            <Button variant="outlined" onClick={() => setView('map')} sx={{ mt: 2 }}>Вернуться к карте</Button>
          </Box>
        );
      }
    }

    return (
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          overflowY: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 4, sm: 6, md: 8 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: { xs: 3, sm: 4, md: 6 },
            width: '100%',
            maxWidth: '1200px'
          }}
        >
          {tables.map(table => (
            <Box key={table.id} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: '100%', maxWidth: '200px' }}>
                <Table table={table} onClick={handleTableClick} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <Paper
        elevation={3}
        sx={{
          width: { xs: 60, sm: 72 },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          zIndex: 10,
          borderRight: '1px solid',
          borderColor: 'divider'
        }}
      >
        <List sx={{ pt: 2 }}>
          <ListItem disablePadding sx={{ display: 'block', mb: 1 }}>
            <Tooltip title="Карта столов" placement="right">
              <ListItemButton
                selected={view === 'map'}
                onClick={() => setView('map')}
                sx={{ justifyContent: 'center', px: 0, minHeight: 48 }}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: view === 'map' ? 'primary.main' : 'inherit' }}>
                  <Map size={24} />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip title="Меню (нужен активный стол)" placement="right">
              <ListItemButton
                selected={view === 'menu'}
                onClick={() => view === 'menu' && setView('map')}
                sx={{ justifyContent: 'center', px: 0, minHeight: 48 }}
                disabled={!activeTableId}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: view === 'menu' ? 'primary.main' : 'inherit' }}>
                  <Utensils size={24} />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>

        <Divider sx={{ my: 1, mx: 2 }} />

        {/* Active Orders List */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 2 }}>
          {activeTables.map(table => (
            <Tooltip key={table.id} title={`Стол ${table.number}`} placement="right">
              <Avatar
                sx={{
                  bgcolor: table.id === activeTableId ? 'primary.main' : 'action.selected',
                  color: table.id === activeTableId ? 'white' : 'text.primary',
                  cursor: 'pointer',
                  width: 36,
                  height: 36,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  border: table.id === activeTableId ? '2px solid white' : '1px solid transparent',
                  boxShadow: table.id === activeTableId ? 3 : 0,
                  transition: 'all 0.2s'
                }}
                onClick={() => handleActiveOrderClick(table.id)}
              >
                {table.number}
              </Avatar>
            </Tooltip>
          ))}
        </Box>

        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Tooltip title="Выйти" placement="right">
            <ListItemButton onClick={() => { logout(); navigate('/login'); }} sx={{ justifyContent: 'center', borderRadius: 1 }}>
              <ListItemIcon sx={{ minWidth: 0, color: 'error.main' }}>
                <LogOut size={20} />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {renderContent()}
      </Box>

      {/* Table Status Dialog */}
      <Dialog
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2, m: 2 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>
          Стол {selectedTable?.number}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>Текущий статус</Typography>
            <Typography variant="h5" fontWeight="bold" color={
              selectedTable?.status === 'free' ? 'success.main' :
                selectedTable?.status === 'occupied' ? 'error.main' :
                  selectedTable?.status === 'reserved' ? 'warning.main' : 'text.secondary'
            }>
              {selectedTable?.status === 'free' ? 'Свободен' :
                selectedTable?.status === 'occupied' ? 'Занят' :
                  selectedTable?.status === 'reserved' ? 'Забронирован' : 'Грязный'}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            {(selectedTable?.status === 'free' || selectedTable?.status === 'reserved') && (
              <Button variant="contained" color="error" size="large" onClick={() => handleStatusChange('occupied')}>
                Посадить гостей (без брони)
              </Button>
            )}

            {selectedTable?.status === 'occupied' && (
              <>
                <Button variant="contained" size="large" startIcon={<Utensils />} onClick={handleOpenMenu}>
                  Открыть меню
                </Button>
                <Button variant="outlined" color="warning" size="large" onClick={() => handleStatusChange('dirty')}>
                  Освободить стол
                </Button>
              </>
            )}

            {selectedTable?.status === 'dirty' && (
              <Button variant="contained" color="success" size="large" onClick={() => handleStatusChange('free')}>
                Стол убран
              </Button>
            )}
          </Box>

          {selectedTable?.today_bookings && selectedTable.today_bookings.length > 0 && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Брони на сегодня:</Typography>
              <List dense disablePadding>
                {selectedTable.today_bookings.map((booking, idx) => (
                  <ListItem 
                    key={idx} 
                    disablePadding 
                    sx={{ py: 0.5 }}
                  >
                    <ListItemButton 
                      onClick={() => {
                        if (selectedTable?.status === 'free' || selectedTable?.status === 'reserved') {
                          handleSeatBooking(booking.booking_id);
                        }
                      }}
                      sx={{ borderRadius: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', mb: 0.5 }}
                      disabled={selectedTable?.status === 'occupied'}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Clock size={18} />
                      </ListItemIcon>
                      <ListItemText
                        primary={booking.guest_name}
                        secondary={`Сегодня на ${booking.time}`}
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                      <Box sx={{ ml: 2 }}>
                        {(selectedTable?.status === 'free' || selectedTable?.status === 'reserved') && (
                          <Button variant="contained" color="primary" size="small">Посадить</Button>
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setSelectedTable(null)} fullWidth>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaiterInterface;
