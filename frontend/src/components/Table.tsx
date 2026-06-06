import { Paper, Typography, Box, useTheme } from '@mui/material';
import { Clock } from 'lucide-react';
import type { TableData } from '../types';
import { tableStatusColor, tableStatusLabel } from '../utils/statusHelpers';

interface TableProps {
  table: TableData;
  onClick: (table: TableData) => void;
}

const Table = ({ table, onClick }: TableProps) => {
  const theme = useTheme();
  const getStatusColor = (status: string) => tableStatusColor[status] ?? '#bdbdbd';
  const getStatusText = (status: string) => tableStatusLabel[status] ?? '';

  const isRound = table.seats <= 4;
  const chairColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0';

  const renderChairs = () => {
    const chairs = [];
    const size = 16; // chair size
    const offset = -16; // Increase offset to push chairs further out (from -8 to -16)

    if (table.seats === 2) {
      // Top and bottom
      chairs.push(<Box key="1" sx={{ position: 'absolute', top: offset, left: '50%', transform: 'translateX(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="2" sx={{ position: 'absolute', bottom: offset, left: '50%', transform: 'translateX(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
    } else if (table.seats === 4) {
      // Top, right, bottom, left
      chairs.push(<Box key="1" sx={{ position: 'absolute', top: offset, left: '50%', transform: 'translateX(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="2" sx={{ position: 'absolute', bottom: offset, left: '50%', transform: 'translateX(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="3" sx={{ position: 'absolute', left: offset, top: '50%', transform: 'translateY(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="4" sx={{ position: 'absolute', right: offset, top: '50%', transform: 'translateY(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
    } else {
      // More generic distribution for 6+
      chairs.push(<Box key="1" sx={{ position: 'absolute', top: offset, left: '25%', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="2" sx={{ position: 'absolute', top: offset, right: '25%', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="3" sx={{ position: 'absolute', bottom: offset, left: '25%', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="4" sx={{ position: 'absolute', bottom: offset, right: '25%', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="5" sx={{ position: 'absolute', left: offset, top: '50%', transform: 'translateY(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
      chairs.push(<Box key="6" sx={{ position: 'absolute', right: offset, top: '50%', transform: 'translateY(-50%)', width: size, height: size, borderRadius: '50%', bgcolor: chairColor, zIndex: 0, border: '1px solid rgba(0,0,0,0.1)' }} />);
    }
    return chairs;
  };

  return (
    <Box 
        sx={{ 
            position: 'relative', 
            width: '100%', 
            padding: 3, // Increase padding (from 2 to 3) to accommodate wider chair distribution
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}
    >
        {renderChairs()}
        <Paper
        elevation={3}
        onClick={() => onClick(table)}
        sx={{
            width: '100%',
            minWidth: 100,
            aspectRatio: isRound ? '1/1' : '4/3',
            bgcolor: getStatusColor(table.status),
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: isRound ? '50%' : '16px', // Round for 2-4 seats, rounded rect for more
            overflow: 'hidden',
            p: 1.5,
            zIndex: 1, // Above chairs
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.2)',
            '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
            },
        }}
        >
        <Box textAlign="center" width="100%">
            <Typography variant="h5" fontWeight="bold" noWrap>
            {table.number}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: -0.5 }} noWrap>
            {table.seats} мест
            </Typography>
            
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, opacity: 1, mt: 0.5, display: 'block', textTransform: 'uppercase' }} noWrap>
            {getStatusText(table.status)}
            </Typography>

            {table.today_bookings && table.today_bookings.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.2)', px: 0.8, py: 0.2, borderRadius: 2 }}>
                        <Clock size={10} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>
                            {table.today_bookings.length} брони
                        </Typography>
                    </Box>
                    {table.upcoming_booking && (
                        <Typography variant="caption" sx={{ mt: 0.2, fontSize: '0.65rem', opacity: 0.9, whiteSpace: 'nowrap' }}>
                            на {table.upcoming_booking.time}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
        </Paper>
    </Box>
  );
};

export default Table;
