import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack } from '@mui/material';
import type { Ingredient } from '../types';

const UNITS = ['кг', 'г', 'л', 'мл', 'шт'];

interface Props {
    open: boolean;
    editingItem: Ingredient | null;
    onClose: () => void;
    onSaved: (msg: string) => void;
    onError: (msg: string) => void;
}

const empty = { name: '', unit: 'кг', cost_price: 0, current_stock: 0, min_stock: 0 };

const IngredientDialog = ({ open, editingItem, onClose, onSaved, onError }: Props) => {
    const [form, setForm] = useState(empty);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(editingItem
                ? { name: editingItem.name, unit: editingItem.unit, cost_price: editingItem.cost_price, current_stock: editingItem.current_stock, min_stock: editingItem.min_stock }
                : empty
            );
        }
    }, [open, editingItem]);

    const handleSave = async () => {
        if (!form.name.trim()) { onError('Название обязательно'); return; }
        setLoading(true);
        try {
            const url = editingItem ? `/api/ingredients/${editingItem.id}` : '/api/ingredients';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error();
            onSaved(editingItem ? 'Ингредиент обновлён' : 'Ингредиент добавлен');
            onClose();
        } catch {
            onError('Ошибка при сохранении');
        } finally {
            setLoading(false);
        }
    };

    const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{editingItem ? 'Редактировать ингредиент' : 'Добавить ингредиент'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="Название" value={form.name} onChange={e => set('name', e.target.value)} fullWidth required />
                    <TextField select label="Единица измерения" value={form.unit} onChange={e => set('unit', e.target.value)} fullWidth>
                        {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </TextField>
                    <TextField label="Цена за ед. (₽)" type="number" value={form.cost_price} onChange={e => set('cost_price', parseFloat(e.target.value) || 0)} fullWidth inputProps={{ min: 0, step: 0.01 }} />
                    <TextField label="Текущий остаток" type="number" value={form.current_stock} onChange={e => set('current_stock', parseFloat(e.target.value) || 0)} fullWidth inputProps={{ min: 0, step: 0.001 }} />
                    <TextField label="Минимальный остаток (порог)" type="number" value={form.min_stock} onChange={e => set('min_stock', parseFloat(e.target.value) || 0)} fullWidth inputProps={{ min: 0, step: 0.001 }} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Отмена</Button>
                <Button variant="contained" onClick={handleSave} disabled={loading}>Сохранить</Button>
            </DialogActions>
        </Dialog>
    );
};

export default IngredientDialog;
