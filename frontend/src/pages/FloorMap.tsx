import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, IconButton, Snackbar, Alert } from '@mui/material';
import { RefreshCcw } from 'lucide-react';
import type { TableData, CreateBookingPayload } from '../types';
import { fetchTables, createBooking } from '../api';
import Table from '../components/Table';
import BookingForm from '../components/BookingForm';
import BookingList from '../components/BookingList';

const FloorMap = () => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });

  const loadTables = () => {
    fetchTables().then(setTables).catch(() => {});
  };

  useEffect(() => {
    loadTables();
  }, [refreshTrigger]);

  const handleTableClick = (table: TableData) => {
    if (table.status === 'free' || table.status === 'reserved') {
      setSelectedTable(table);
      setIsBookingFormOpen(true);
    } else {
      setSnackbar({ open: true, message: `Стол ${table.number} ${table.status === 'occupied' ? 'занят' : 'грязный'}`, severity: 'info' });
    }
  };

  const handleAddBookingClick = () => {
    setSelectedTable(null);
    setIsBookingFormOpen(true);
  };

  const handleCreateBooking = async (payload: CreateBookingPayload) => {
    try {
      await createBooking(payload);
      setIsBookingFormOpen(false);
      setSelectedTable(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Ошибка при создании брони', severity: 'error' });
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', p: { xs: 1, md: 3 } }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">Управление залом</Typography>
        <IconButton onClick={() => setRefreshTrigger(p => p + 1)} color="primary">
          <RefreshCcw />
        </IconButton>
      </Box>

      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Column: Floor Map */}
        <Grid item xs={12} md={8} lg={9} sx={{ height: { xs: '50%', md: '100%' }, display: 'flex', flexDirection: 'column' }}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              borderRadius: 2,
              p: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>Карта зала</Typography>

            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                },
                gap: { xs: 2, sm: 4, md: 4 },
                p: { xs: 3, md: 5 }, // Increased padding (from 1 to 5 on md)
                alignContent: 'flex-start'
              }}
            >
              {tables.map(table => (
                <Box key={table.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: '180px' }}>
                    <Table table={table} onClick={handleTableClick} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Booking List */}
        <Grid item xs={12} md={4} lg={3} sx={{ height: { xs: '50%', md: '100%' } }}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <BookingList
              refreshTrigger={refreshTrigger}
              onAddBooking={handleAddBookingClick}
              onRefresh={loadTables}
            />
          </Paper>
        </Grid>
      </Grid>

      <BookingForm
        open={isBookingFormOpen}
        onClose={() => setIsBookingFormOpen(false)}
        onSubmit={handleCreateBooking}
        tableId={selectedTable?.id || null}
        tables={tables}
      />
    </Box>
  );
};

export default FloorMap;
