import { Box, Typography, Divider, Grid, List, ListItem, ListItemText, Button, Card, CardContent, IconButton, Chip } from '@mui/material';
import { Plus as AddIcon, Minus as RemoveIcon, CheckCircle as CheckCircleIcon } from 'lucide-react';
import type { MenuItemData, MenuAvailability } from '../types';

interface ClientOrderingProps {
    menu: MenuItemData[];
    availability: MenuAvailability;
    cart: { [id: number]: number };
    addToCart: (itemId: number) => void;
    removeFromCart: (itemId: number) => void;
    getCartTotal: () => number;
    onSubmit: () => void;
    onSkip: () => void;
}

export const ClientOrdering = ({
    menu, availability, cart, addToCart, removeFromCart, getCartTotal, onSubmit, onSkip
}: ClientOrderingProps) => (
    <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={2}>
                <CheckCircleIcon color="#2e7d32" size={40} style={{ marginRight: 16 }} />
                <Box>
                    <Typography variant="h5" fontWeight="bold">Столик забронирован!</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Сделайте предварительный заказ блюд или пропустите этот шаг.</Typography>
                </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                    <Typography variant="h6" gutterBottom>Меню</Typography>
                    <List>
                        {menu.map((item) => {
                            const avail = availability[item.id];
                            const canOrder = avail === undefined || avail.can_order;
                            return (
                                <ListItem key={item.id} divider sx={{ px: 0, gap: 2, alignItems: 'center', opacity: canOrder ? 1 : 0.6 }}>
                                    {item.image_url && <Box component="img" src={`${item.image_url}`} sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }} />}
                                    <ListItemText 
                                        primary={<Typography fontWeight="medium">{item.name}</Typography>} 
                                        secondary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography color="primary" fontWeight="bold">{item.price} ₽</Typography>
                                                {!canOrder && <Chip label="Временно недоступно" color="error" size="small" />}
                                            </Box>
                                        } 
                                        sx={{ m: 0 }} 
                                    />
                                    <Button variant="outlined" size="small" disabled={!canOrder} onClick={() => addToCart(item.id)} startIcon={<AddIcon size={16} />} sx={{ flexShrink: 0 }}>Добавить</Button>
                                </ListItem>
                            );
                        })}
                    </List>
                </Grid>
                
                <Grid item xs={12} md={5}>
                    <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>Ваш заказ</Typography>
                        {Object.keys(cart).length === 0 ? (
                            <Typography color="text.secondary" sx={{ py: 2 }}>Корзина пуста.</Typography>
                        ) : (
                            <>
                                <List disablePadding>
                                    {Object.entries(cart).map(([id, quantity]) => {
                                        const item = menu.find(m => m.id === Number(id));
                                        if (!item) return null;
                                        return (
                                            <ListItem key={id} disableGutters>
                                                <ListItemText primary={item.name} secondary={`${item.price} ₽ x ${quantity}`} />
                                                <Box display="flex" alignItems="center">
                                                    <IconButton size="small" onClick={() => removeFromCart(item.id)}><RemoveIcon size={18} /></IconButton>
                                                    <Typography sx={{ mx: 1 }}>{quantity}</Typography>
                                                    <IconButton size="small" onClick={() => addToCart(item.id)}><AddIcon size={18} /></IconButton>
                                                </Box>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" justifyContent="space-between" mb={3}>
                                    <Typography variant="h6">Итого:</Typography>
                                    <Typography variant="h6" fontWeight="bold">{getCartTotal()} ₽</Typography>
                                </Box>
                                <Button variant="contained" fullWidth size="large" onClick={onSubmit} sx={{ py: 1.5 }}>
                                    Подтвердить заказ
                                </Button>
                            </>
                        )}
                    </Box>
                    <Button fullWidth sx={{ mt: 2 }} color="inherit" onClick={onSkip}>
                        Пропустить заказ
                    </Button>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);
