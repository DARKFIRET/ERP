import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Grid, Card, CardContent, CardMedia, Chip, TextField, IconButton, useTheme, useMediaQuery, Badge, Fab, Drawer } from '@mui/material';
import { Plus, Minus, ShoppingCart, ImageOff, ArrowLeft, X } from 'lucide-react';
import type { MenuItemData, OrderData } from '../types';
import { fetchMenu, fetchActiveOrder, createOrder } from '../api';

interface WaiterMenuProps {
  tableId: number;
  onBack: () => void;
}

const WaiterMenu = ({ tableId, onBack }: WaiterMenuProps) => {
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Все');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchMenu().then(setMenuItems).catch(console.error);
    fetchActiveOrder(tableId).then(setActiveOrder).catch(console.error);
  }, [tableId]);

  const categories = ['Все', ...new Set(menuItems.map(i => i.category).filter(Boolean))];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'Все' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (itemId: number) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const newCount = (prev[itemId] || 0) - 1;
      if (newCount <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newCount };
    });
  };

  const handlePlaceOrder = async () => {
    const itemsToOrder = Object.entries(cart).map(([id, quantity]) => {
        const item = menuItems.find(i => i.id === Number(id));
        return {
            menu_item_id: Number(id),
            quantity,
            price: item?.price || 0
        };
    });

    if (itemsToOrder.length === 0) return;

    try {
        await createOrder(tableId, itemsToOrder);
        // In a real app, show a snackbar here
        setCart({});
        fetchActiveOrder(tableId).then(setActiveOrder);
        if (isMobile) setIsCartOpen(false);
    } catch (e) {
        alert('Ошибка при отправке заказа');
    }
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menuItems.find(i => i.id === Number(id));
      return sum + (item ? item.price * qty : 0);
  }, 0);

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const CartContent = () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                <ShoppingCart size={20} /> Корзина
            </Typography>
            {isMobile && (
                <IconButton onClick={() => setIsCartOpen(false)}>
                    <X size={24} />
                </IconButton>
            )}
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
            {Object.keys(cart).length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                    Корзина пуста
                </Typography>
            ) : (
                Object.entries(cart).map(([id, qty]) => {
                    const item = menuItems.find(i => i.id === Number(id));
                    if (!item) return null;
                    return (
                        <Box key={id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Box sx={{ overflow: 'hidden', mr: 1 }}>
                                <Typography variant="body2" fontWeight="500" noWrap>{item.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.price} ₽</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, bgcolor: 'white', borderRadius: 1, px: 0.5 }}>
                                <IconButton size="small" onClick={() => removeFromCart(item.id)}><Minus size={14} /></IconButton>
                                <Typography variant="body2" fontWeight="bold">{qty}</Typography>
                                <IconButton size="small" onClick={() => addToCart(item.id)}><Plus size={14} /></IconButton>
                            </Box>
                        </Box>
                    );
                })
            )}
        </Box>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">Итого:</Typography>
                <Typography variant="h6" color="primary.main">{cartTotal} ₽</Typography>
            </Box>
            <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={cartTotal === 0}
                onClick={handlePlaceOrder}
                sx={{ borderRadius: 2 }}
            >
                Отправить заказ
            </Button>
        </Box>

        {activeOrder && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '2px dashed #ccc' }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">Активный заказ:</Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {activeOrder.items?.map((item, idx) => (
                        <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" sx={{ flexGrow: 1 }}>
                                {item.name}
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                                {item.quantity} x {item.price}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Typography variant="subtitle2" align="right" sx={{ mt: 1 }}>
                    Сумма: {activeOrder.total} ₽
                </Typography>
            </Box>
        )}
      </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 0, display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
        <Button onClick={onBack} startIcon={<ArrowLeft size={18} />} sx={{ minWidth: 'auto', px: 1 }}>
            {isMobile ? '' : 'Назад'}
        </Button>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Стол {tableId}
        </Typography>
        <TextField
            size="small"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: 150, sm: 250 } }}
        />
      </Box>

      {/* Categories */}
      <Box sx={{ px: 2, py: 2, display: 'flex', gap: 1, overflowX: 'auto', flexShrink: 0, '::-webkit-scrollbar': { display: 'none' } }}>
        {categories.map(cat => (
            <Chip
                key={cat}
                label={cat}
                onClick={() => setCategoryFilter(cat)}
                color={categoryFilter === cat ? 'primary' : 'default'}
                variant={categoryFilter === cat ? 'filled' : 'outlined'}
                clickable
                sx={{ fontWeight: 500 }}
            />
        ))}
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', px: 2, pb: 2, gap: 3 }}>
        {/* Menu Grid */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: { md: 1 } }}>
            <Grid container spacing={2}>
                {filteredItems.map(item => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 } }}>
                            {item.image_url ? (
                                <CardMedia
                                    component="img"
                                    height="160"
                                    image={item.image_url}
                                    alt={item.name}
                                />
                            ) : (
                                <Box sx={{ height: 160, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImageOff size={32} color="#bdbdbd" />
                                </Box>
                            )}
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" noWrap title={item.name} gutterBottom>{item.name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', lineHeight: 1.2 }}>{item.category}</Typography>

                                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" color="primary.main" fontWeight="bold">{item.price} ₽</Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        disableElevation
                                        onClick={() => addToCart(item.id)}
                                        sx={{ minWidth: 'auto', px: 2, borderRadius: 2 }}
                                    >
                                        <Plus size={18} />
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {filteredItems.length === 0 && (
                <Box textAlign="center" py={8} color="text.secondary">
                    <Typography>Блюда не найдены</Typography>
                </Box>
            )}
        </Box>

        {/* Desktop Cart */}
        {!isMobile && (
            <Paper elevation={0} variant="outlined" sx={{ width: 340, display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
                <CartContent />
            </Paper>
        )}
      </Box>

      {/* Mobile Cart FAB */}
      {isMobile && (
        <>
            <Fab
                color="primary"
                aria-label="cart"
                sx={{ position: 'absolute', bottom: 16, right: 16 }}
                onClick={() => setIsCartOpen(true)}
            >
                <Badge badgeContent={cartItemCount} color="error">
                    <ShoppingCart />
                </Badge>
            </Fab>

            <Drawer
                anchor="bottom"
                open={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                PaperProps={{ sx: { height: '80vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
            >
                <CartContent />
            </Drawer>
        </>
      )}
    </Box>
  );
};

export default WaiterMenu;
