import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Avatar, Tooltip, useTheme } from '@mui/material';
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();

  const loadTables = () => {
    fetchTables().then(setTables).catch(console.error);
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
      await fetch(`http://localhost:3000/tables/${selectedTable.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setRefreshTrigger(prev => prev + 1);
      setSelectedTable(null);
    } catch (err) {
      console.error(err);
      alert('Ошибка при обновлении статуса');
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

  const activeTables = tables.filter(t => t.status === 'occupied' || t.status === 'dirty' || (t.status === 'reserved' && t.id === activeTableId));

  const renderContent = () => {
      if (view === 'menu') {
          if (activeTableId) {
              return <WaiterMenu tableId={activeTableId} onBack={() => setView('map')} />;
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
                bgcolor: '#f5f5f5',
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
                    gap: { xs: 3, sm: 4, md: 6 }, // Increased gap significantly (from 1.5-3 to 3-6)
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
      {/* Sidebar Navigation */}
      <Paper
        elevation={3}
        sx={{
            width: { xs: 60, sm: 72 },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            zIndex: 10,
            borderRight: '1px solid rgba(0,0,0,0.12)'
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
            {selectedTable?.status === 'free' && (
              <Button variant="contained" color="error" size="large" onClick={() => handleStatusChange('occupied')}>
                Посадить гостей
              </Button>
            )}

            {selectedTable?.status === 'reserved' && (
              <Button variant="contained" color="error" size="large" onClick={() => handleStatusChange('occupied')}>
                Посадить гостей (Бронь)
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
                       <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                           <ListItemIcon sx={{ minWidth: 28 }}>
                               <Clock size={16} />
                           </ListItemIcon>
                           <ListItemText
                                primary={booking.time}
                                secondary={booking.guest_name}
                                primaryTypographyProps={{ fontWeight: 'bold' }}
                           />
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
