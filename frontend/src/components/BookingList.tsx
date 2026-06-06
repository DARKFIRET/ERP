import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Button, TextField } from '@mui/material';
import type { BookingData } from '../types';
import { fetchBookings, updateBookingStatus } from '../api';
import BookingDetails from './BookingDetails';

interface BookingListProps {
  refreshTrigger: number;
  onAddBooking: () => void;
  onRefresh?: () => void;
}

const BookingList = ({ refreshTrigger, onAddBooking, onRefresh }: BookingListProps) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);

  const loadBookings = () => {
    fetchBookings().then(setBookings).catch(console.error);
  };

  useEffect(() => {
    loadBookings();
  }, [refreshTrigger]);

  const handleCancelBooking = async (id: number) => {
      try {
          await updateBookingStatus(id, 'cancelled');
          setSelectedBooking(null);
          loadBookings();
          if (onRefresh) onRefresh();
      } catch (err) {
          console.error(err);
      }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.booking_date === selectedDate
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>Брони на дату</Typography>

      <Box sx={{ px: 2, pb: 2 }}>
        <TextField
          type="date"
          fullWidth
          size="small"
          label="Дата"
          InputLabelProps={{ shrink: true }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{}}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              sx={{ mb: 2, bgcolor: 'background.paper', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => setSelectedBooking(booking)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle1" fontWeight="500">
                  {booking.guest_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Стол: {booking.table_id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Слоты: {booking.slots.map(s => s.time).join(', ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                   Гостей: {booking.pax}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            Нет броней на выбранную дату
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={onAddBooking}
          sx={{ textTransform: 'none', fontSize: '1rem' }}
        >
          Добавить бронь
        </Button>
      </Box>

      <BookingDetails
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        onCancelBooking={handleCancelBooking}
      />
    </Box>
  );
};

export default BookingList;
