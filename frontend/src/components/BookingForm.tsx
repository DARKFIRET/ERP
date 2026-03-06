import { useState, useEffect, forwardRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography, ToggleButton, ToggleButtonGroup, Grid, InputAdornment } from '@mui/material';
import { IMaskInput } from 'react-imask';
import { User, Phone, Calendar, Users, Table as TableIcon, Clock } from 'lucide-react';
import type { CreateBookingPayload, TableData, BookingData, TimeSlot } from '../types';
import { fetchBookings, fetchTimeSlots } from '../api';

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBookingPayload) => void;
  tableId: number | null;
  tables?: TableData[];
}

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const TextMaskCustom = forwardRef<HTMLElement, CustomProps>(
  function TextMaskCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="+7 (000) 000-00-00"
        definitions={{
          '#': /[1-9]/,
        }}
        inputRef={ref as any}
        onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
        overwrite
      />
    );
  },
);

const BookingForm = ({ open, onClose, onSubmit, tableId, tables = [] }: BookingFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pax, setPax] = useState(2);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [existingBookings, setExistingBookings] = useState<BookingData[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    pax: '',
    table: '',
    slot: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    pax: false,
    table: false,
    slot: false
  });

  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
      setPax(2);
      setSelectedTableId(tableId);
      const today = new Date().toISOString().slice(0, 10);
      setSelectedDate(today);
      setSelectedSlotIds([]);
      setErrors({ name: '', phone: '', pax: '', table: '', slot: '' });
      setTouched({ name: false, phone: false, pax: false, table: false, slot: false });

      Promise.all([fetchBookings(), fetchTimeSlots()])
        .then(([bookings, slots]) => {
            setExistingBookings(bookings);
            setAllTimeSlots(slots);
        })
        .catch(console.error);
    }
  }, [open, tableId]);

  // Check if a slot is occupied
  const isSlotOccupied = (slotId: number) => {
    if (!selectedDate || !selectedTableId) return false;

    return existingBookings.some(booking => {
        if (booking.table_id !== selectedTableId) return false;
        if (booking.booking_date !== selectedDate) return false;

        // Check if this booking includes the slotId
        return booking.slots.some(s => s.id === slotId);
    });
  };

  const handleSlotChange = (_event: React.MouseEvent<HTMLElement>, newSlotIds: number[]) => {
    setSelectedSlotIds(newSlotIds);
  };

  const validate = () => {
    const newErrors = { name: '', phone: '', pax: '', table: '', slot: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Введите имя гостя';
      isValid = false;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 11) {
       newErrors.phone = 'Введите полный номер телефона';
       isValid = false;
    }

    if (pax < 1) {
        newErrors.pax = 'Минимум 1 гость';
        isValid = false;
    } else if (pax > 4) {
        newErrors.pax = 'Максимум 4 гостя';
        isValid = false;
    }

    if (!selectedTableId) {
        newErrors.table = 'Выберите стол';
        isValid = false;
    }

    if (selectedSlotIds.length === 0) {
        newErrors.slot = 'Выберите хотя бы один слот';
        isValid = false;
    } else {
        // Check continuity if strictly required, user said "can select multiple checkpoints"
        // Usually contiguous makes sense for a single order.
        // Let's enforce contiguous logic based on IDs assuming they are sequential in DB.
        const sortedIds = [...selectedSlotIds].sort((a, b) => a - b);
        for (let i = 0; i < sortedIds.length - 1; i++) {
            if (sortedIds[i + 1] !== sortedIds[i] + 1) {
                 newErrors.slot = 'Слоты должны идти подряд';
                 isValid = false;
                 break;
            }
        }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    setTouched({ name: true, phone: true, pax: true, table: true, slot: true });
    if (validate()) {
      onSubmit({
        tableId: selectedTableId!,
        guestName: name,
        phone,
        pax,
        date: selectedDate,
        slotIds: selectedSlotIds,
      });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}>
        Новая бронь
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Имя гостя *"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched({ ...touched, name: true })}
              variant="outlined"
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
              InputProps={{
                startAdornment: <InputAdornment position="start"><User size={18} /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
                label="Телефон *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched({ ...touched, phone: true })}
                name="phone"
                InputProps={{
                    inputComponent: TextMaskCustom as any,
                    startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment>,
                }}
                fullWidth
                error={touched.phone && !!errors.phone}
                helperText={touched.phone && errors.phone}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
             <TextField
              label="Дата *"
              type="date"
              fullWidth
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
             <TextField
              label="Гостей *"
              type="number"
              fullWidth
              value={pax}
              onChange={(e) => setPax(Number(e.target.value))}
              onBlur={() => setTouched({ ...touched, pax: true })}
              error={touched.pax && !!errors.pax}
              helperText={touched.pax && errors.pax}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Users size={18} /></InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={touched.table && !!errors.table}>
              <InputLabel id="table-select-label">Номер стола *</InputLabel>
              <Select
                labelId="table-select-label"
                value={selectedTableId || ''}
                label="Номер стола *"
                onChange={(e) => setSelectedTableId(Number(e.target.value))}
                onBlur={() => setTouched({ ...touched, table: true })}
                startAdornment={<InputAdornment position="start" sx={{ ml: 1, mr: -1 }}><TableIcon size={18} /></InputAdornment>}
              >
                {tables.map((table) => (
                  <MenuItem key={table.id} value={table.id}>
                    Стол {table.number} ({table.seats} мест) - {
                      table.status === 'free' ? 'Свободен' :
                      table.status === 'occupied' ? 'Занят' :
                      table.status === 'reserved' ? 'Забронирован' : 'Грязный'
                    }
                  </MenuItem>
                ))}
              </Select>
              {touched.table && errors.table && <FormHelperText>{errors.table}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Slots Selection */}
          <Grid item xs={12}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={16} /> Выберите время:
              </Typography>
              <ToggleButtonGroup
                  value={selectedSlotIds}
                  onChange={handleSlotChange}
                  aria-label="time slots"
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
              >
                  {allTimeSlots.map(slot => {
                      const disabled = isSlotOccupied(slot.id);
                      return (
                          <ToggleButton
                              key={slot.id}
                              value={slot.id}
                              disabled={disabled}
                              sx={{
                                  flex: '0 0 auto',
                                  border: '1px solid rgba(0, 0, 0, 0.12) !important',
                                  borderRadius: '4px !important',
                                  px: 2,
                                  py: 1,
                                  bgcolor: disabled ? 'action.disabledBackground' : 'transparent',
                                  '&.Mui-selected': {
                                      bgcolor: 'primary.main',
                                      color: 'white',
                                      '&:hover': { bgcolor: 'primary.dark' }
                                  }
                              }}
                          >
                              {slot.start_time}
                          </ToggleButton>
                      );
                  })}
              </ToggleButtonGroup>
              {touched.slot && errors.slot && (
                  <FormHelperText error>{errors.slot}</FormHelperText>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">Отмена</Button>
        <Button onClick={handleSubmit} variant="contained">Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;
