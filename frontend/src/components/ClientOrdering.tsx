import { Box, Typography, Divider, Grid, List, ListItem, ListItemText, ListItemSecondaryAction, Button, IconButton, Card, CardContent } from '@mui/material';
import { Plus as AddIcon, Minus as RemoveIcon, CheckCircle as CheckCircleIcon } from 'lucide-react';
import type { MenuItemData } from '../types';

interface ClientOrderingProps {
    menu: MenuItemData[];
    cart: { [id: number]: number };
    addToCart: (itemId: number) => void;
    removeFromCart: (itemId: number) => void;
    getCartTotal: () => number;
    onSubmit: () => void;
    onSkip: () => void;
}

export const ClientOrdering = ({
    menu, cart, addToCart, removeFromCart, getCartTotal, onSubmit, onSkip
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
                        {menu.map((item) => (
                            <ListItem key={item.id} divider sx={{ px: 0 }}>
                                {item.image_url && <Box component="img" src={`http://localhost:3000${item.image_url}`} sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover', mr: 2 }} />}
                                <ListItemText primary={<Typography fontWeight="medium">{item.name}</Typography>} secondary={<Typography color="primary" fontWeight="bold">{item.price} ₽</Typography>} />
                                <ListItemSecondaryAction>
                                    <Button variant="outlined" size="small" onClick={() => addToCart(item.id)} startIcon={<AddIcon size={16} />}>Добавить</Button>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
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
