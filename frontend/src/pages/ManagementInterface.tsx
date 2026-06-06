import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Button, Snackbar, Alert } from "@mui/material";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MenuItemData } from "../types";
import { fetchMenu } from "../api";
import { useSnackbar } from "../hooks/useSnackbar";
import MenuItemDialog from "../components/MenuItemDialog";
import MenuTable from "../components/MenuTable";

const ManagementInterface = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = () => {
    fetchMenu().then(setMenuItems).catch(() => showSnackbar('Ошибка загрузки меню', 'error'));
  };

  const handleOpen = (item?: MenuItemData) => {
    setEditingItem(item ?? null);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить это блюдо?")) {
      try {
        await fetch(`/api/menu/${id}`, { method: "DELETE" });
        loadMenu();
        showSnackbar("Блюдо удалено", "success");
      } catch {
        showSnackbar("Ошибка при удалении", "error");
      }
    }
  };

  const filteredItems = useMemo(() =>
    menuItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [menuItems, searchQuery]
  );

  const categories = useMemo(
    () => [...new Set(menuItems.map(item => item.category))],
    [menuItems]
  );

  const paginatedItems = filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3, width: "90%", mx: "auto" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Меню ресторана</Typography>
          <Typography variant="body1" color="text.secondary">Управление блюдами и категориями</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Users size={20} />} onClick={() => navigate("/management/users")} size="large">
            Персонал
          </Button>
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => handleOpen()} size="large" sx={{ px: 3 }}>
            Добавить блюдо
          </Button>
        </Box>
      </Box>

      <MenuTable
        paginatedItems={paginatedItems}
        filteredCount={filteredItems.length}
        searchQuery={searchQuery}
        page={page}
        rowsPerPage={rowsPerPage}
        onSearchChange={(v) => { setSearchQuery(v); setPage(0); }}
        onEdit={handleOpen}
        onDelete={handleDelete}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />

      <MenuItemDialog
        open={open}
        editingItem={editingItem}
        categories={categories}
        onClose={() => setOpen(false)}
        onSaved={(msg) => { loadMenu(); showSnackbar(msg, 'success'); }}
        onError={(msg) => showSnackbar(msg, 'error')}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={hideSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={hideSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManagementInterface;
