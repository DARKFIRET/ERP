import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Box, Typography, IconButton, Divider } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import type { Ingredient, RecipeItem } from '../types';
import { fetchRecipe, saveRecipe, fetchIngredients } from '../api';

interface Props {
    open: boolean;
    menuItemId: number | null;
    menuItemName: string;
    onClose: () => void;
    onSaved: () => void;
    onError: (msg: string) => void;
}

interface RecipeRow {
    ingredient_id: number | '';
    quantity: number | '';
    recipe_unit: string;
}

const RecipeDialog = ({ open, menuItemId, menuItemName, onClose, onSaved, onError }: Props) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [rows, setRows] = useState<RecipeRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && menuItemId) {
            fetchIngredients().then(setIngredients).catch(() => {});
            fetchRecipe(menuItemId).then((recipe: RecipeItem[]) => {
                setRows(recipe.length > 0
                    ? recipe.map(r => ({ ingredient_id: r.ingredient_id, quantity: r.quantity, recipe_unit: r.recipe_unit || 'г' }))
                    : [{ ingredient_id: '', quantity: '', recipe_unit: 'г' }]
                );
            }).catch(() => setRows([{ ingredient_id: '', quantity: '', recipe_unit: 'г' }]));
        }
    }, [open, menuItemId]);

    const addRow = () => setRows(prev => [...prev, { ingredient_id: '', quantity: '', recipe_unit: 'г' }]);

    const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

    const updateRow = (idx: number, field: keyof RecipeRow, value: string | number) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    };

    const handleSave = async () => {
        if (!menuItemId) return;
        const valid = rows.filter(r => r.ingredient_id !== '' && r.quantity !== '' && Number(r.quantity) > 0);
        setLoading(true);
        try {
            const payload = valid.map(r => {
                const ing = ingredients.find(i => i.id === r.ingredient_id);
                return {
                    ingredient_id: Number(r.ingredient_id),
                    quantity: Number(r.quantity),
                    recipe_unit: ing?.unit || 'г'
                };
            });
            await saveRecipe(menuItemId, payload);
            onSaved();
            onClose();
        } catch {
            onError('Ошибка при сохранении рецептуры');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Рецептура: {menuItemName}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Укажите ингредиенты и количество на 1 порцию
                </Typography>
                <Stack spacing={1.5}>
                    {rows.map((row, idx) => {
                        const ing = ingredients.find(i => i.id === row.ingredient_id);
                        return (
                            <Box key={idx} display="flex" gap={1} alignItems="center">
                                <TextField
                                    select label="Ингредиент" value={row.ingredient_id} size="small"
                                    onChange={e => updateRow(idx, 'ingredient_id', Number(e.target.value))}
                                    sx={{ flexGrow: 1 }}
                                >
                                    {ingredients.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                                </TextField>
                                <TextField
                                    label={ing ? ing.unit : 'Кол-во'} type="number" value={row.quantity} size="small"
                                    onChange={e => updateRow(idx, 'quantity', parseFloat(e.target.value) || '')}
                                    sx={{ width: 110 }}
                                    inputProps={{ min: 0.001, step: 0.001 }}
                                />
                                <IconButton size="small" color="error" onClick={() => removeRow(idx)} disabled={rows.length === 1}>
                                    <Trash2 size={16} />
                                </IconButton>
                            </Box>
                        );
                    })}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Button startIcon={<Plus size={16} />} onClick={addRow} size="small">Добавить ингредиент</Button>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Отмена</Button>
                <Button variant="contained" onClick={handleSave} disabled={loading}>Сохранить рецептуру</Button>
            </DialogActions>
        </Dialog>
    );
};

export default RecipeDialog;
