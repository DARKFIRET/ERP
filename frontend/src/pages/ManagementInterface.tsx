import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Autocomplete,
  Grid,
  InputAdornment,
  Card,
  TablePagination,
  Snackbar,
  Alert,
  Chip,
  Stack,
  useTheme,
} from "@mui/material";
import {
  Edit,
  Trash2,
  Plus,
  Image as ImageIcon,
  Users,
  Search,
  Upload,
  BarChart2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MenuItemData } from "../types";
import { fetchMenu } from "../api";

const ManagementInterface = () => {
  const theme = useTheme();
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    image_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = () => {
    fetchMenu().then(setMenuItems).catch(console.error);
  };

  const handleOpen = (item?: MenuItemData) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        category: item.category,
        image_url: item.image_url || "",
      });
    } else {
      setEditingItem(null);
      setFormData({ name: "", price: "", category: "", image_url: "" });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      setUploading(true);
      try {
        const res = await fetch("http://localhost:3000/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setFormData((prev) => ({ ...prev, image_url: data.url }));
          showSnackbar("Изображение загружено", "success");
        } else {
          showSnackbar("Ошибка загрузки", "error");
        }
      } catch (err) {
        console.error(err);
        showSnackbar("Ошибка загрузки файла", "error");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      showSnackbar("Заполните обязательные поля", "error");
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
    };

    try {
      const url = editingItem
        ? `http://localhost:3000/menu/${editingItem.id}`
        : "http://localhost:3000/menu";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Operation failed");

      loadMenu();
      handleClose();
      showSnackbar(
        editingItem ? "Блюдо обновлено" : "Блюдо создано",
        "success"
      );
    } catch (err) {
      console.error(err);
      showSnackbar("Ошибка при сохранении", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить это блюдо?")) {
      try {
        await fetch(`http://localhost:3000/menu/${id}`, { method: "DELETE" });
        loadMenu();
        showSnackbar("Блюдо удалено", "success");
      } catch (err) {
        console.error(err);
        showSnackbar("Ошибка при удалении", "error");
      }
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate pagination
  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3, width: "90%", mx: "auto" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Меню ресторана
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Управление блюдами и категориями
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Users size={20} />}
            onClick={() => navigate("/management/users")}
            size="large"
          >
            Персонал
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => handleOpen()}
            size="large"
            sx={{ px: 3 }}
          >
            Добавить блюдо
          </Button>
        </Box>
      </Box>

      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <TextField
            placeholder="Поиск блюд..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Typography variant="caption" color="text.secondary">
            Всего позиций: {filteredItems.length}
          </Typography>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Фото</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Название</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Категория</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Цена</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>
                      <Avatar
                        src={item.image_url}
                        variant="rounded"
                        sx={{ width: 56, height: 56, bgcolor: "grey.100" }}
                      >
                        <ImageIcon
                          size={24}
                          color={theme.palette.text.secondary}
                        />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="500">
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {item.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.category}
                        size="small"
                        sx={{
                          bgcolor: "primary.50",
                          color: "primary.main",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                        }).format(item.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpen(item)}
                        size="small"
                        sx={{
                          mr: 1,
                          bgcolor: "primary.50",
                          "&:hover": { bgcolor: "primary.100" },
                        }}
                      >
                        <Edit size={18} />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(item.id)}
                        size="small"
                        sx={{
                          bgcolor: "error.50",
                          "&:hover": { bgcolor: "error.100" },
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={1}
                    >
                      <Search size={48} color={theme.palette.text.disabled} />
                      <Typography color="text.secondary">
                        Блюда не найдены
                      </Typography>
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
          count={filteredItems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
        />
      </Card>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
        >
          {editingItem ? "Редактировать блюдо" : "Новое блюдо"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" gutterBottom>
                Изображение
              </Typography>
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  height: 250,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.default",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "primary.50",
                  },
                }}
              >
                {formData.image_url ? (
                  <>
                    <Box
                      component="img"
                      src={formData.image_url}
                      alt="Preview"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.2s",
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <Button variant="contained" component="span" size="small">
                        Изменить фото
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box textAlign="center" p={2}>
                    <Upload
                      size={32}
                      color={theme.palette.text.secondary}
                      style={{ marginBottom: 8 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Нажмите или перетащите фото сюда
                    </Typography>
                  </Box>
                )}
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  type="file"
                  onChange={handleFileChange}
                  id="upload-file-input"
                />
                <label
                  htmlFor="upload-file-input"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                />
              </Box>
              {uploading && (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ display: "block", mt: 1, textAlign: "center" }}
                >
                  Загрузка...
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle2" gutterBottom>
                Информация
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Название блюда"
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <Autocomplete
                  freeSolo
                  options={[...new Set(menuItems.map((item) => item.category))]}
                  value={formData.category}
                  onInputChange={(_, newValue) =>
                    setFormData({ ...formData, category: newValue })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Категория"
                      fullWidth
                      required
                    />
                  )}
                />
                <TextField
                  label="Цена (₽)"
                  type="number"
                  fullWidth
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₽</InputAdornment>
                    ),
                  }}
                  required
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Button onClick={handleClose} color="inherit">
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={uploading}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManagementInterface;
