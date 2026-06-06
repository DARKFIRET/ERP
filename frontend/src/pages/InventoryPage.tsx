import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tabs, Tab, Card,
    Chip, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Package } from 'lucide-react';
import type { Ingredient, StockMovement } from '../types';
import { fetchIngredients, deleteIngredient, fetchStockMovements } from '../api';
import { useSnackbar } from '../hooks/useSnackbar';
import IngredientDialog from '../components/IngredientDialog';
import StockAdjustDialog from '../components/StockAdjustDialog';

const movementTypeLabel: Record<string, string> = {
    purchase: 'Приход',
    usage: 'Списание (заказ)',
    waste: 'Отходы',
    adjustment: 'Корректировка',
};

const movementTypeColor = (type: string): 'success' | 'error' | 'warning' | 'default' => {
    if (type === 'purchase') return 'success';
    if (type === 'waste') return 'warning';
    if (type === 'usage') return 'error';
    return 'default';
};

const InventoryPage = () => {
    const [tab, setTab] = useState(0);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [openIngredient, setOpenIngredient] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [adjustMode, setAdjustMode] = useState<'purchase' | 'waste'>('purchase');
    const [openAdjust, setOpenAdjust] = useState(false);
    const [preselectedId, setPreselectedId] = useState<number | null>(null);
    const [movTypeFilter, setMovTypeFilter] = useState('');
    const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

    const load = () => {
        fetchIngredients().then(setIngredients).catch(() => showSnackbar('Ошибка загрузки', 'error'));
    };

    const loadMovements = () => {
        fetchStockMovements({ type: movTypeFilter || undefined, limit: 100 })
            .then(setMovements)
            .catch(() => {});
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { if (tab === 1) loadMovements(); }, [tab, movTypeFilter]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить ингредиент?')) return;
        try {
            await deleteIngredient(id);
            showSnackbar('Ингредиент удалён', 'success');
            load();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Ошибка удаления';
            showSnackbar(msg, 'error');
        }
    };

    const openPurchase = (ing?: Ingredient) => {
        setAdjustMode('purchase');
        setPreselectedId(ing?.id ?? null);
        setOpenAdjust(true);
    };

    const openWaste = (ing?: Ingredient) => {
        setAdjustMode('waste');
        setPreselectedId(ing?.id ?? null);
        setOpenAdjust(true);
    };

    const totalStockValue = useMemo(
        () => ingredients.reduce((s, i) => s + i.current_stock * i.cost_price, 0),
        [ingredients]
    );

    const lowCount = useMemo(() => ingredients.filter(i => i.low_stock).length, [ingredients]);

    return (
        <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Склад</Typography>
                    <Typography variant="body1" color="text.secondary">Управление ингредиентами и движениями</Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button variant="outlined" color="success" startIcon={<TrendingUp size={18} />} onClick={() => openPurchase()}>Приход</Button>
                    <Button variant="outlined" color="warning" startIcon={<TrendingDown size={18} />} onClick={() => openWaste()}>Списание</Button>
                    <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { setEditingIngredient(null); setOpenIngredient(true); }}>Добавить</Button>
                </Box>
            </Box>

            {/* Summary cards */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2, minWidth: 180 }}>
                    <Typography variant="caption" color="text.secondary">Позиций на складе</Typography>
                    <Typography variant="h5" fontWeight="bold">{ingredients.length}</Typography>
                </Card>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: lowCount > 0 ? 'error.main' : 'divider', p: 2, minWidth: 180 }}>
                    <Typography variant="caption" color={lowCount > 0 ? 'error' : 'text.secondary'}>Ниже минимума</Typography>
                    <Typography variant="h5" fontWeight="bold" color={lowCount > 0 ? 'error.main' : 'text.primary'}>{lowCount}</Typography>
                </Card>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2, minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">Стоимость остатков</Typography>
                    <Typography variant="h5" fontWeight="bold">{totalStockValue.toFixed(0)} ₽</Typography>
                </Card>
            </Box>

            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab label="Остатки" icon={<Package size={18} />} iconPosition="start" />
                        <Tab label="История движений" icon={<TrendingDown size={18} />} iconPosition="start" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    {tab === 0 && (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                    <TableRow>
                                        <TableCell>Название</TableCell>
                                        <TableCell>Ед.</TableCell>
                                        <TableCell align="right">Остаток</TableCell>
                                        <TableCell align="right">Минимум</TableCell>
                                        <TableCell align="right">Цена / ед. ₽</TableCell>
                                        <TableCell align="right">Сумма ₽</TableCell>
                                        <TableCell align="right">Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ingredients.map(ing => (
                                        <TableRow
                                            key={ing.id}
                                            hover
                                            sx={{ bgcolor: ing.low_stock ? 'error.50' : 'inherit' }}
                                        >
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                {ing.name}
                                                {ing.low_stock && <Chip label="Мало" size="small" color="error" sx={{ ml: 1 }} />}
                                            </TableCell>
                                            <TableCell>{ing.unit}</TableCell>
                                            <TableCell align="right" sx={{ color: ing.low_stock ? 'error.main' : 'inherit', fontWeight: ing.low_stock ? 'bold' : 'normal' }}>
                                                {Number(ing.current_stock).toFixed(3)}
                                            </TableCell>
                                            <TableCell align="right">{Number(ing.min_stock).toFixed(3)}</TableCell>
                                            <TableCell align="right">{Number(ing.cost_price).toFixed(2)}</TableCell>
                                            <TableCell align="right">{(ing.current_stock * ing.cost_price).toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" gap={0.5} justifyContent="flex-end">
                                                    <IconButton size="small" color="success" title="Приход" onClick={() => openPurchase(ing)}><TrendingUp size={16} /></IconButton>
                                                    <IconButton size="small" color="warning" title="Списание" onClick={() => openWaste(ing)}><TrendingDown size={16} /></IconButton>
                                                    <IconButton size="small" color="primary" title="Редактировать" onClick={() => { setEditingIngredient(ing); setOpenIngredient(true); }}><Edit2 size={16} /></IconButton>
                                                    <IconButton size="small" color="error" title="Удалить" onClick={() => handleDelete(ing.id)}><Trash2 size={16} /></IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {ingredients.length === 0 && (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Нет ингредиентов</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {tab === 1 && (
                        <>
                            <Box mb={2}>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Тип движения</InputLabel>
                                    <Select value={movTypeFilter} label="Тип движения" onChange={e => setMovTypeFilter(e.target.value)}>
                                        <MenuItem value="">Все</MenuItem>
                                        {Object.entries(movementTypeLabel).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: 'background.default' }}>
                                        <TableRow>
                                            <TableCell>Дата</TableCell>
                                            <TableCell>Тип</TableCell>
                                            <TableCell>Ингредиент</TableCell>
                                            <TableCell align="right">Количество</TableCell>
                                            <TableCell>Причина</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {movements.map(m => (
                                            <TableRow key={m.id} hover>
                                                <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Chip label={movementTypeLabel[m.type] ?? m.type} size="small" color={movementTypeColor(m.type)} variant="outlined" />
                                                </TableCell>
                                                <TableCell>{m.ingredient_name}</TableCell>
                                                <TableCell align="right" sx={{ color: Number(m.quantity) >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                                                    {Number(m.quantity) >= 0 ? '+' : ''}{Number(m.quantity).toFixed(3)} {m.unit}
                                                </TableCell>
                                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{m.reason ?? '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                        {movements.length === 0 && (
                                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Нет записей</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Box>
            </Card>

            <IngredientDialog
                open={openIngredient}
                editingItem={editingIngredient}
                onClose={() => setOpenIngredient(false)}
                onSaved={(msg) => { load(); showSnackbar(msg, 'success'); }}
                onError={(msg) => showSnackbar(msg, 'error')}
            />

            <StockAdjustDialog
                open={openAdjust}
                mode={adjustMode}
                ingredients={ingredients}
                preselectedId={preselectedId}
                onClose={() => setOpenAdjust(false)}
                onSaved={(msg) => { load(); if (tab === 1) loadMovements(); showSnackbar(msg, 'success'); }}
                onError={(msg) => showSnackbar(msg, 'error')}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={hideSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={hideSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default InventoryPage;
