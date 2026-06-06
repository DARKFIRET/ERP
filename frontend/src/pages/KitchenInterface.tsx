import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Button, Grid, Chip, Snackbar, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChefHat, CheckCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { OrderData } from '../types';
import { fetchLowStock } from '../api';

interface OrderWithTable extends OrderData {
    table_number: number;
    created_at: string;
}

const KitchenInterface = () => {
  const [orders, setOrders] = useState<OrderWithTable[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'error' });
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
    } catch {
      // silent: orders will show stale until next poll
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    fetchLowStock().then(items => setLowStockCount(items.length)).catch(() => {});
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
      try {
          await fetch(`/api/orders/${orderId}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status })
          });
          setRefresh(prev => prev + 1);
      } catch {
          setSnackbar({ open: true, message: 'Ошибка при обновлении статуса', severity: 'error' });
      }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'open': return 'primary';
          case 'cooking': return 'warning';
          case 'ready': return 'success';
          default: return 'default';
      }
  };

  const renderOrderCard = (order: OrderWithTable) => (
      <Paper key={order.id} sx={{ p: 2, mb: 2, borderLeft: 6, borderColor: `${getStatusColor(order.status)}.main` }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Стол {order.table_number}</Typography>
              <Chip label={`#${order.id}`} size="small" />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              {new Date(order.created_at).toLocaleTimeString()}
          </Typography>

          <Box mb={2}>
              {order.items?.map((item, idx) => (
                  <Typography key={idx} variant="body1" sx={{ borderBottom: '1px dashed', borderColor: 'divider', py: 0.5 }}>
                      <b>{item.quantity}x</b> {item.name}
                  </Typography>
              ))}
          </Box>

          <Box display="flex" gap={1} justifyContent="flex-end">
              {order.status === 'open' && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<ChefHat size={16} />}
                    onClick={() => updateStatus(order.id, 'cooking')}
                    fullWidth
                  >
                      Готовить
                  </Button>
              )}
              {order.status === 'cooking' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle size={16} />}
                    onClick={() => updateStatus(order.id, 'ready')}
                    fullWidth
                  >
                      Готово
                  </Button>
              )}
               {order.status === 'ready' && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Bell size={16} />}
                    onClick={() => updateStatus(order.id, 'served')} // or 'closed'
                    fullWidth
                  >
                      Отдано
                  </Button>
              )}
          </Box>
      </Paper>
  );

  const openOrders = useMemo(() => orders.filter(o => o.status === 'open'), [orders]);
  const cookingOrders = useMemo(() => orders.filter(o => o.status === 'cooking'), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => o.status === 'ready'), [orders]);

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto', bgcolor: 'background.default' }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
        <Typography variant="h4" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ChefHat size={32} /> Кухонный терминал
        </Typography>
        {lowStockCount > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }} action={
                <Button color="inherit" size="small" onClick={() => navigate('/management/inventory')}>Перейти</Button>
            }>
                {lowStockCount} ингредиент(ов) на складе ниже минимального остатка
            </Alert>
        )}

        <Grid container spacing={3}>
            {/* New Orders Column */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), minHeight: '80vh' }}>
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                        Новые ({openOrders.length})
                    </Typography>
                    {openOrders.map(order => renderOrderCard(order))}
                </Paper>
            </Grid>

            {/* Cooking Column */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: (t) => alpha(t.palette.warning.main, 0.1), minHeight: '80vh' }}>
                    <Typography variant="h6" gutterBottom color="warning.main" fontWeight="bold">
                        Готовятся ({cookingOrders.length})
                    </Typography>
                    {cookingOrders.map(order => renderOrderCard(order))}
                </Paper>
            </Grid>

            {/* Ready Column */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.1), minHeight: '80vh' }}>
                    <Typography variant="h6" gutterBottom color="success.main" fontWeight="bold">
                        Готовы к выдаче ({readyOrders.length})
                    </Typography>
                    {readyOrders.map(order => renderOrderCard(order))}
                </Paper>
            </Grid>
        </Grid>
    </Box>
  );
};

export default KitchenInterface;
