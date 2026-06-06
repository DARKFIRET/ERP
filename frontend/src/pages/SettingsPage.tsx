import { useRef, useState } from 'react';
import {
  Box, Typography, Card, CardContent, ToggleButton, ToggleButtonGroup,
  TextField, Button, Avatar, Tooltip, Divider, Stack, Grid, Chip,
} from '@mui/material';
import { Sun, Moon, RotateCcw, Upload, Trash2, Check, Cloud, CloudOff } from 'lucide-react';
import { useThemeSettings } from '../contexts/ThemeSettingsContext';

const COLOR_PRESETS = [
  { label: 'Синий',       value: '#1976d2' },
  { label: 'Индиго',      value: '#3f51b5' },
  { label: 'Фиолетовый',  value: '#7c3aed' },
  { label: 'Розовый',     value: '#db2777' },
  { label: 'Красный',     value: '#dc2626' },
  { label: 'Оранжевый',   value: '#ea580c' },
  { label: 'Зелёный',     value: '#16a34a' },
  { label: 'Бирюзовый',   value: '#0891b2' },
  { label: 'Серый',       value: '#475569' },
];

const PREVIEW_ITEMS = ['Бронирование', 'Управление', 'Склад', 'Статистика'];

export default function SettingsPage() {
  const { settings, update, reset, saving } = useThemeSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    setUploadError('');
    try {
      const payload = new FormData();
      payload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: payload });
      const data = await res.json();
      if (data.url) update({ iconDataUrl: data.url });
      else setUploadError('Ошибка загрузки');
    } catch {
      setUploadError('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const initials = settings.appName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'E';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Настройки</Typography>
          <Typography variant="body2" color="text.secondary">
            Внешний вид и брендинг — применяется на всех устройствах организации
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            icon={saving ? <Cloud size={14} /> : <CloudOff size={14} />}
            label={saving ? 'Сохранение...' : 'Синхронизировано'}
            color={saving ? 'default' : 'success'}
            variant="outlined"
          />
          <Tooltip title="Сбросить к стандартным">
            <Button variant="outlined" color="inherit" startIcon={<RotateCcw size={16} />} onClick={reset} size="small">
              Сбросить
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} lg={8}>

          {/* Appearance */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Тема оформления</Typography>
              <ToggleButtonGroup
                value={settings.mode}
                exclusive
                onChange={(_, v) => v && update({ mode: v })}
                sx={{ mb: 3 }}
              >
                <ToggleButton value="light" sx={{ px: 3, gap: 1 }}>
                  <Sun size={18} /> Светлая
                </ToggleButton>
                <ToggleButton value="dark" sx={{ px: 3, gap: 1 }}>
                  <Moon size={18} /> Тёмная
                </ToggleButton>
              </ToggleButtonGroup>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" mb={1.5}>Основной цвет</Typography>
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                {COLOR_PRESETS.map(({ label, value }) => (
                  <Tooltip title={label} key={value}>
                    <Box
                      onClick={() => update({ primaryColor: value })}
                      sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: value, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: settings.primaryColor === value ? '3px solid' : '2px solid transparent',
                        borderColor: settings.primaryColor === value ? 'text.primary' : 'transparent',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        '&:hover': { transform: 'scale(1.15)', boxShadow: 3 },
                      }}
                    >
                      {settings.primaryColor === value && <Check size={16} color="#fff" strokeWidth={3} />}
                    </Box>
                  </Tooltip>
                ))}

                {/* Custom color picker */}
                <Tooltip title="Свой цвет">
                  <Box
                    component="label"
                    sx={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid', borderColor: 'divider',
                      transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.15)' },
                    }}
                  >
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={e => update({ primaryColor: e.target.value })}
                      style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                    />
                  </Box>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Брендинг</Typography>

              <Stack spacing={3}>
                <TextField
                  label="Название системы"
                  value={settings.appName}
                  onChange={e => update({ appName: e.target.value })}
                  inputProps={{ maxLength: 30 }}
                  helperText="Отображается в боковой панели и вкладке браузера"
                  fullWidth
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>Иконка приложения</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    PNG, SVG или JPG — станет иконкой вкладки и аватаром в меню
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={settings.iconDataUrl ?? undefined}
                      sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.1rem', fontWeight: 700 }}
                    >
                      {!settings.iconDataUrl && initials}
                    </Avatar>
                    <Stack spacing={1}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleIconUpload}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<Upload size={16} />}
                        onClick={() => fileInputRef.current?.click()}
                        size="small"
                        disabled={uploading}
                      >
                        {uploading ? 'Загрузка...' : 'Загрузить иконку'}
                      </Button>
                      {settings.iconDataUrl && (
                        <Button
                          variant="text"
                          color="error"
                          startIcon={<Trash2 size={16} />}
                          onClick={() => update({ iconDataUrl: null })}
                          size="small"
                        >
                          Удалить
                        </Button>
                      )}
                      {uploadError && (
                        <Typography variant="caption" color="error">{uploadError}</Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 88 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Предпросмотр</Typography>
              <Box
                sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  overflow: 'hidden', userSelect: 'none',
                }}
              >
                {/* Mini sidebar header */}
                <Box
                  sx={{
                    bgcolor: settings.mode === 'dark' ? '#1a1d27' : '#fff',
                    p: 1.5,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    borderBottom: '1px solid', borderColor: 'divider',
                  }}
                >
                  <Avatar
                    src={settings.iconDataUrl ?? undefined}
                    sx={{ width: 28, height: 28, bgcolor: settings.primaryColor, fontSize: '0.6rem', fontWeight: 700 }}
                  >
                    {!settings.iconDataUrl && initials}
                  </Avatar>
                  <Typography variant="caption" fontWeight={800} noWrap>
                    {settings.appName || 'Кафе ERP'}
                  </Typography>
                </Box>

                {/* Mini nav */}
                <Box sx={{ bgcolor: settings.mode === 'dark' ? '#1a1d27' : '#fff', p: 1 }}>
                  {PREVIEW_ITEMS.map((item, i) => (
                    <Box
                      key={item}
                      sx={{
                        px: 1.5, py: 0.75, mb: 0.5, borderRadius: 1,
                        bgcolor: i === 1 ? settings.primaryColor : 'transparent',
                        display: 'flex', alignItems: 'center', gap: 1,
                      }}
                    >
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: i === 1 ? '#fff' : 'text.disabled' }} />
                      <Typography
                        variant="caption"
                        sx={{ color: i === 1 ? '#fff' : 'text.secondary', fontWeight: i === 1 ? 600 : 400, fontSize: 11 }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Mini AppBar */}
                <Box
                  sx={{
                    bgcolor: settings.mode === 'dark' ? '#0f1117' : '#f4f6f8',
                    borderTop: '1px solid', borderColor: 'divider',
                    p: 1.5,
                  }}
                >
                  <Box sx={{ height: 8, width: '60%', bgcolor: 'text.disabled', borderRadius: 1, opacity: 0.4 }} />
                </Box>

                {/* Color swatch */}
                <Box
                  sx={{
                    bgcolor: settings.primaryColor,
                    p: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1,
                  }}
                >
                  {[0.4, 0.6, 1].map(op => (
                    <Box key={op} sx={{ width: 20, height: 8, bgcolor: `rgba(255,255,255,${op})`, borderRadius: 0.5 }} />
                  ))}
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" display="block" mt={1.5} textAlign="center">
                Изменения применяются сразу
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
