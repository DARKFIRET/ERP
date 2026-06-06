import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Autocomplete, Grid, Box, Typography, Stack, useTheme,
  InputAdornment, Divider, IconButton, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Upload, Plus, Trash2 } from 'lucide-react';
import type { MenuItemData, Ingredient, RecipeItem } from '../types';
import { fetchIngredients, fetchRecipe, saveRecipe } from '../api';
import { convertToStockUnit, compatibleUnits } from '../utils/unitConversion';

interface MenuItemDialogProps {
  open: boolean;
  editingItem: MenuItemData | null;
  categories: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

interface RecipeRow {
  ingredient_id: number | '';
  quantity: number | '';
  recipe_unit: string;
}

const emptyForm = { name: '', price: '', category: '', image_url: '' };

const MenuItemDialog = ({ open, editingItem, categories, onClose, onSaved, onError }: MenuItemDialogProps) => {
  const theme = useTheme();
  const [formData, setFormData] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);

  useEffect(() => {
    fetchIngredients().then(setIngredients).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    setFormData(editingItem
      ? { name: editingItem.name, price: editingItem.price.toString(), category: editingItem.category, image_url: editingItem.image_url || '' }
      : emptyForm
    );
    if (editingItem) {
      fetchRecipe(editingItem.id)
        .then((rows: RecipeItem[]) => setRecipeRows(
          rows.length > 0
            ? rows.map(r => ({ ingredient_id: r.ingredient_id, quantity: r.quantity, recipe_unit: r.recipe_unit }))
            : []
        ))
        .catch(() => setRecipeRows([]));
    } else {
      setRecipeRows([]);
    }
  }, [open, editingItem]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const payload = new FormData();
    payload.append('file', e.target.files[0]);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: payload });
      const data = await res.json();
      if (data.url) setFormData(prev => ({ ...prev, image_url: data.url }));
      else onError('Ошибка загрузки');
    } catch {
      onError('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      onError('Заполните обязательные поля');
      return;
    }
    try {
      const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, price: Number(formData.price) }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      const menuItemId: number = editingItem ? editingItem.id : saved.id;

      const validRows = recipeRows.filter(r => r.ingredient_id !== '' && r.quantity !== '' && Number(r.quantity) > 0);
      await saveRecipe(menuItemId, validRows.map(r => ({
        ingredient_id: Number(r.ingredient_id),
        quantity: Number(r.quantity),
        recipe_unit: r.recipe_unit,
      })));

      onClose();
      onSaved(editingItem ? 'Блюдо обновлено' : 'Блюдо создано');
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Ошибка при сохранении');
    }
  };

  const getIngredient = (id: number | '') => ingredients.find(i => i.id === id) ?? null;

  const addRow = () => {
    setRecipeRows(prev => [...prev, { ingredient_id: '', quantity: '', recipe_unit: '' }]);
  };

  const removeRow = (idx: number) => setRecipeRows(prev => prev.filter((_, i) => i !== idx));

  const updateRow = (idx: number, patch: Partial<RecipeRow>) => {
    setRecipeRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, ...patch };
      // When ingredient changes, auto-pick the first compatible unit
      if ('ingredient_id' in patch) {
        const ing = ingredients.find(x => x.id === patch.ingredient_id);
        updated.recipe_unit = ing ? (compatibleUnits[ing.unit]?.[0] ?? ing.unit) : '';
      }
      return updated;
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        {editingItem ? 'Редактировать блюдо' : 'Новое блюдо'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {/* Image upload */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" gutterBottom>Изображение</Typography>
            <Box sx={{
              border: '2px dashed', borderColor: 'divider', borderRadius: 2, height: 200,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'background.default', position: 'relative', overflow: 'hidden',
              transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
            }}>
              {formData.image_url ? (
                <>
                  <Box component="img" src={formData.image_url} alt="Preview" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <Box sx={{
                    position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 },
                  }}>
                    <Button variant="contained" component="span" size="small">Изменить фото</Button>
                  </Box>
                </>
              ) : (
                <Box textAlign="center" p={2}>
                  <Upload size={32} color={theme.palette.text.secondary} style={{ marginBottom: 8 }} />
                  <Typography variant="body2" color="text.secondary">Нажмите для загрузки</Typography>
                </Box>
              )}
              <input accept="image/*" style={{ display: 'none' }} type="file" onChange={handleFileChange} id="menu-upload-input" />
              <label htmlFor="menu-upload-input" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
            </Box>
            {uploading && <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>Загрузка...</Typography>}
          </Grid>

          {/* Main fields */}
          <Grid item xs={12} md={7}>
            <Typography variant="subtitle2" gutterBottom>Основное</Typography>
            <Stack spacing={2}>
              <TextField label="Название блюда" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Autocomplete
                freeSolo options={categories} value={formData.category}
                onInputChange={(_, v) => setFormData({ ...formData, category: v })}
                renderInput={(params) => <TextField {...params} label="Категория" fullWidth required />}
              />
              <TextField
                label="Цена" type="number" fullWidth value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">₽</InputAdornment> }}
                required
              />
            </Stack>
          </Grid>
        </Grid>

        {/* Recipe section */}
        <Divider sx={{ my: 3 }} />
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box>
              <Typography variant="subtitle2">Состав блюда (рецептура)</Typography>
              <Typography variant="caption" color="text.secondary">
                Количество в единице рецепта — при заказе автоматически конвертируется и списывается со склада
              </Typography>
            </Box>
            <Button size="small" startIcon={<Plus size={16} />} onClick={addRow}>
              Добавить ингредиент
            </Button>
          </Box>

          {recipeRows.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Рецептура не задана — блюдо всегда доступно к заказу, списания не происходят
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {recipeRows.map((row, idx) => {
                const ing = getIngredient(row.ingredient_id);
                const allowed = ing ? (compatibleUnits[ing.unit] ?? [ing.unit]) : [];
                // Live conversion hint
                let hint = '';
                if (ing && row.recipe_unit && row.quantity !== '') {
                  const converted = convertToStockUnit(Number(row.quantity), row.recipe_unit, ing.unit);
                  if (!isNaN(converted)) {
                    hint = row.recipe_unit === ing.unit
                      ? ''
                      : `= ${converted % 1 === 0 ? converted : converted.toFixed(4).replace(/\.?0+$/, '')} ${ing.unit} спишется со склада`;
                  }
                }

                return (
                  <Box key={idx}>
                    <Box display="flex" gap={1.5} alignItems="center">
                      {/* Ingredient selector */}
                      <Autocomplete
                        options={ingredients}
                        getOptionLabel={i => `${i.name} (склад: ${i.unit})`}
                        value={ing}
                        onChange={(_, v) => updateRow(idx, { ingredient_id: v ? v.id : '' })}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        renderInput={(params) => <TextField {...params} label="Ингредиент" size="small" placeholder="Выберите..." />}
                        sx={{ flexGrow: 1 }}
                        size="small"
                      />

                      {/* Recipe unit selector */}
                      <FormControl size="small" sx={{ minWidth: 80 }} disabled={!ing}>
                        <InputLabel>Ед.</InputLabel>
                        <Select
                          label="Ед."
                          value={row.recipe_unit}
                          onChange={e => updateRow(idx, { recipe_unit: e.target.value })}
                        >
                          {allowed.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </Select>
                      </FormControl>

                      {/* Quantity */}
                      <TextField
                        label="Кол-во"
                        type="number"
                        size="small"
                        value={row.quantity}
                        onChange={e => updateRow(idx, { quantity: parseFloat(e.target.value) || '' })}
                        sx={{ width: 100 }}
                        inputProps={{ min: 0.001, step: 0.001 }}
                        disabled={!ing}
                      />

                      <IconButton size="small" color="error" onClick={() => removeRow(idx)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>

                    {/* Conversion hint */}
                    {hint && (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 1, display: 'block', mt: 0.25 }}>
                        {hint}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">Отмена</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={uploading}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MenuItemDialog;
