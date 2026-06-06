import {
  Box, Card, Typography, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Avatar, Chip, TablePagination, InputAdornment, useTheme,
} from '@mui/material';
import { Edit, Trash2, Image as ImageIcon, Search } from 'lucide-react';
import type { MenuItemData } from '../types';

interface MenuTableProps {
  paginatedItems: MenuItemData[];
  filteredCount: number;
  searchQuery: string;
  page: number;
  rowsPerPage: number;
  onSearchChange: (value: string) => void;
  onEdit: (item: MenuItemData) => void;
  onDelete: (id: number) => void;
  onPageChange: (_: unknown, newPage: number) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MenuTable = ({
  paginatedItems, filteredCount, searchQuery, page, rowsPerPage,
  onSearchChange, onEdit, onDelete, onPageChange, onRowsPerPageChange,
}: MenuTableProps) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          placeholder="Поиск блюд..."
          size="small"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color={theme.palette.text.secondary} /></InputAdornment> }}
          sx={{ width: 300 }}
        />
        <Typography variant="caption" color="text.secondary">Всего позиций: {filteredCount}</Typography>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Фото</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Название</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Категория</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Цена</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Avatar src={item.image_url} variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'grey.100' }}>
                      <ImageIcon size={24} color={theme.palette.text.secondary} />
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="500">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {item.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category} size="small" sx={{ bgcolor: 'primary.50', color: 'primary.main', fontWeight: 500 }} />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(item.price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => onEdit(item)} size="small" sx={{ mr: 1, bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}>
                      <Edit size={18} />
                    </IconButton>
                    <IconButton color="error" onClick={() => onDelete(item.id)} size="small" sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <Search size={48} color={theme.palette.text.disabled} />
                    <Typography color="text.secondary">Блюда не найдены</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Строк на странице:"
      />
    </Card>
  );
};

export default MenuTable;
