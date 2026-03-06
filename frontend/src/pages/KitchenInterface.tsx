import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Grid, Chip } from '@mui/material';
import { ChefHat, CheckCircle, Bell } from 'lucide-react';
import type { OrderData } from '../types';

interface OrderWithTable extends OrderData {
    table_number: number;
    created_at: string;
}

const KitchenInterface = () => {
  const [orders, setOrders] = useState<OrderWithTable[]>([]);
  const [refresh, setRefresh] = useState(0);

  const fetchOrders = async () => {
    try {
        const res = await fetch('http://localhost:3000/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  const updateStatus = async (orderId: number, status: string) => {
      try {
          await fetch(`http://localhost:3000/orders/${orderId}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status })
          });
          setRefresh(prev => prev + 1);
      } catch (e) {
          console.error(e);
          alert('Ошибка при обновлении статуса');
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
                  <Typography key={idx} variant="body1" sx={{ borderBottom: '1px dashed #eee', py: 0.5 }}>
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

  const openOrders = orders.filter(o => o.status === 'open');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto', bgcolor: '#f0f2f5' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ChefHat size={32} /> Кухонный терминал
        </Typography>

        <Grid container spacing={3}>
            {/* New Orders Column */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#e3f2fd', minHeight: '80vh' }}>
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                        Новые ({openOrders.length})
                    </Typography>
                    {openOrders.map(order => renderOrderCard(order))}
                </Paper>
            </Grid>

            {/* Cooking Column */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0', minHeight: '80vh' }}>
                    <Typography variant="h6" gutterBottom color="warning.main" fontWeight="bold">
                        Готовятся ({cookingOrders.length})
                    </Typography>
                    {cookingOrders.map(order => renderOrderCard(order))}
                </Paper>
            </Grid>

            {/* Ready Column */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e9', minHeight: '80vh' }}>
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
