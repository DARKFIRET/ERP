import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Typography } from '@mui/material';
import type { Ingredient } from '../types';

interface Props {
    open: boolean;
    mode: 'purchase' | 'waste';
    ingredients: Ingredient[];
    preselectedId?: number | null;
    onClose: () => void;
    onSaved: (msg: string) => void;
    onError: (msg: string) => void;
}

const StockAdjustDialog = ({ open, mode, ingredients, preselectedId, onClose, onSaved, onError }: Props) => {
    const [ingredientId, setIngredientId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setIngredientId(preselectedId ?? '');
            setQuantity('');
            setReason('');
        }
    }, [open, preselectedId]);

    const isPurchase = mode === 'purchase';

    const handleSave = async () => {
        if (!ingredientId || !quantity || quantity <= 0) { onError('Выберите ингредиент и введите количество'); return; }
        if (!isPurchase && !reason.trim()) { onError('Причина списания обязательна'); return; }
        setLoading(true);
        try {
            const endpoint = isPurchase ? '/api/stock/purchase' : '/api/stock/waste';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingredient_id: ingredientId, quantity, reason: reason || undefined })
            });
            if (!res.ok) throw new Error();
            onSaved(isPurchase ? 'Приход оприходован' : 'Списание записано');
            onClose();
        } catch {
            onError('Ошибка при сохранении');
        } finally {
            setLoading(false);
        }
    };

    const selected = ingredients.find(i => i.id === ingredientId);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{isPurchase ? 'Приход товара' : 'Списание / отходы'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        select label="Ингредиент" value={ingredientId} onChange={e => setIngredientId(Number(e.target.value))} fullWidth
                    >
                        {ingredients.map(i => (
                            <MenuItem key={i.id} value={i.id}>{i.name} ({i.unit}) — остаток: {i.current_stock}</MenuItem>
                        ))}
                    </TextField>
                    {selected && (
                        <Typography variant="caption" color="text.secondary">
                            Текущий остаток: {selected.current_stock} {selected.unit}
                        </Typography>
                    )}
                    <TextField
                        label={`Количество (${selected?.unit ?? 'ед.'})`}
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(parseFloat(e.target.value) || '')}
                        fullWidth
                        inputProps={{ min: 0.001, step: 0.001 }}
                    />
                    <TextField
                        label={isPurchase ? 'Причина / комментарий (опционально)' : 'Причина (обязательно)'}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        fullWidth
                        required={!isPurchase}
                        multiline
                        rows={2}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Отмена</Button>
                <Button variant="contained" color={isPurchase ? 'primary' : 'warning'} onClick={handleSave} disabled={loading}>
                    {isPurchase ? 'Оприходовать' : 'Списать'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StockAdjustDialog;
