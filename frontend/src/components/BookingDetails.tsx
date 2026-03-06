import { Dialog, DialogTitle, DialogContent, Typography, Box, Button, DialogActions, Chip } from '@mui/material';
import type { BookingData } from '../types';

interface BookingDetailsProps {
  open: boolean;
  onClose: () => void;
  booking: BookingData | null;
  onCancelBooking?: (id: number) => void;
}

const BookingDetails = ({ open, onClose, booking, onCancelBooking }: BookingDetailsProps) => {
  if (!booking) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Детали бронирования</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Имя гостя</Typography>
            <Typography variant="body1">{booking.guest_name}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Телефон</Typography>
            <Typography variant="body1">{booking.phone}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Стол</Typography>
            <Typography variant="body1">№ {booking.table_id}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Дата</Typography>
            <Typography variant="body1">{booking.booking_date}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Забронированные слоты</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {booking.slots.map(slot => (
                <Chip key={slot.id} label={slot.time} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Гостей</Typography>
            <Typography variant="body1">{booking.pax}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        {onCancelBooking ? (
            <Button color="error" onClick={() => onCancelBooking(booking.id)}>
              Отменить бронь
            </Button>
        ) : <Box />}
        <Button onClick={onClose} variant="contained" disableElevation>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDetails;
