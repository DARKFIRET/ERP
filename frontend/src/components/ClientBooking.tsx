import { Box, Typography, IconButton, Divider, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button, FormHelperText, Card, CardContent } from '@mui/material';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import TextMaskCustom from './TextMaskCustom';
import type { TableData, TimeSlot } from '../types';

interface ClientBookingProps {
    guestName: string;
    setGuestName: (value: string) => void;
    phone: string;
    date: string;
    setDate: (value: string) => void;
    pax: number;
    setPax: (value: number) => void;
    tables: TableData[];
    selectedTableId: number | '';
    setSelectedTableId: (value: number | '') => void;
    timeSlots: TimeSlot[];
    selectedSlotIds: number[];
    setSelectedSlotIds: (value: number[]) => void;
    isSlotOccupied: (slotId: number) => boolean;
    onBack: () => void;
    onSubmit: () => void;
}

export const ClientBooking = ({
    guestName, setGuestName, phone, date, setDate, pax, setPax,
    tables, selectedTableId, setSelectedTableId, timeSlots,
    selectedSlotIds, setSelectedSlotIds, isSlotOccupied,
    onBack, onSubmit
}: ClientBookingProps) => (
    <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={onBack} sx={{ mr: 2 }}><ArrowLeftIcon /></IconButton>
                <Typography variant="h5" fontWeight="bold">Бронирование столика</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Ваше имя" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Телефон" value={phone} disabled InputProps={{ inputComponent: TextMaskCustom as any }} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Дата" type="date" value={date} onChange={(e) => { setDate(e.target.value); setSelectedSlotIds([]); }} InputLabelProps={{ shrink: true }} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Количество гостей" type="number" value={pax} onChange={(e) => setPax(Number(e.target.value))} inputProps={{ min: 1 }} required />
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth required>
                        <InputLabel>Выберите стол</InputLabel>
                        <Select value={selectedTableId} label="Выберите стол" onChange={(e) => { setSelectedTableId(Number(e.target.value)); setSelectedSlotIds([]); }}>
                            {tables.filter(t => t.seats >= pax).map(t => (
                                <MenuItem key={t.id} value={t.id}>Стол {t.number} ({t.seats} мест)</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                {selectedTableId !== '' && (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>Выберите время:</Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {timeSlots.map(slot => {
                                const occupied = isSlotOccupied(slot.id);
                                const selected = selectedSlotIds.includes(slot.id);
                                return (
                                    <Button
                                        key={slot.id}
                                        variant={selected ? "contained" : "outlined"}
                                        disabled={occupied}
                                        onClick={() => {
                                            if (selected) {
                                                setSelectedSlotIds(selectedSlotIds.filter(id => id !== slot.id));
                                            } else {
                                                setSelectedSlotIds([...selectedSlotIds, slot.id]);
                                            }
                                        }}
                                        sx={{ minWidth: '80px' }}
                                        color={selected ? "primary" : "inherit"}
                                    >
                                        {slot.start_time}
                                    </Button>
                                );
                            })}
                        </Box>
                        {selectedSlotIds.length === 0 && <FormHelperText error>Выберите хотя бы одно время.</FormHelperText>}
                    </Grid>
                )}

                <Grid item xs={12}>
                    <Button variant="contained" size="large" fullWidth onClick={onSubmit} disabled={!guestName || !selectedTableId || selectedSlotIds.length === 0} sx={{ mt: 2, py: 1.5 }}>
                        Продолжить (Выбор блюд)
                    </Button>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);
