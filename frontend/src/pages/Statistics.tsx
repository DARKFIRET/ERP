import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  subDays,
  subMonths,
  subYears,
  subQuarters,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";
import { fetchStatistics, fetchMargins } from "../api";
import type { MarginItem } from "../types";

type FilterType = "week" | "month" | "quarter" | "year" | "custom";

interface ChartData {
  date: string;
  revenue: number;
  dishes: number;
  displayDate?: string;
}

const Statistics = () => {
  const theme = useTheme();
  const [filter, setFilter] = useState<FilterType>("week");
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [margins, setMargins] = useState<{ by_item: MarginItem[]; by_category: { category: string; revenue: number; total_cost: number; margin_pct: number }[]; total: { revenue: number; total_cost: number; margin_pct: number } } | null>(null);

  useEffect(() => {
    const today = new Date();
    switch (filter) {
      case "week":
        setStartDate(format(subDays(today, 7), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "month":
        setStartDate(format(subMonths(today, 1), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "quarter":
        setStartDate(format(subQuarters(today, 1), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "year":
        setStartDate(format(subYears(today, 1), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "custom":
        // Keep the current startDate and endDate
        break;
    }
  }, [filter]);

  useEffect(() => {
    if (startDate && endDate) {
        setLoading(true);
        Promise.all([
            fetchStatistics(startDate, endDate),
            fetchMargins(startDate, endDate)
        ]).then(([stats, marginsData]) => {
            setData(stats);
            setMargins(marginsData);
        }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [startDate, endDate]);

  const displayData = useMemo(() => {
    const formattedData = data.map((item) => ({
      ...item,
      displayDate: format(
        parseISO(item.date),
        filter === "year" ? "MMM yyyy" : "dd MMM",
        { locale: ru }
      ),
    }));

    if (formattedData.length > 90) {
      // Group by month if more than 90 days
      const grouped: Record<string, ChartData> = {};
      formattedData.forEach((item) => {
        const monthKey = format(parseISO(item.date), "yyyy-MM");
        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            date: monthKey,
            revenue: 0,
            dishes: 0,
            displayDate: format(parseISO(item.date), "MMM yyyy", {
              locale: ru,
            }),
          };
        }
        grouped[monthKey].revenue += item.revenue;
        grouped[monthKey].dishes += item.dishes;
      });
      return Object.values(grouped);
    }
    return formattedData;
  }, [data, filter]);

  const totalRevenue = displayData.reduce((sum, item) => sum + item.revenue, 0);
  const totalDishes = displayData.reduce((sum, item) => sum + item.dishes, 0);

  return (
    <Box sx={{ p: 3, width: "90%", mx: "auto" }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Статистика
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Аналитика по выручке и количеству проданных блюд
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 3,
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Период</InputLabel>
              <Select
                value={filter}
                label="Период"
                onChange={(e) => setFilter(e.target.value as FilterType)}
              >
                <MenuItem value="week">За неделю</MenuItem>
                <MenuItem value="month">За месяц</MenuItem>
                <MenuItem value="quarter">За квартал</MenuItem>
                <MenuItem value="year">За год</MenuItem>
                <MenuItem value="custom">Произвольный период</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {filter === "custom" && (
            <>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  label="С"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  label="По"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Общая выручка за период
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {new Intl.NumberFormat("ru-RU", {
                    style: "currency",
                    currency: "RUB",
                  }).format(totalRevenue)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Продано блюд за период
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {totalDishes.toLocaleString("ru-RU")} шт.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom mb={3}>
              График показателей
            </Typography>
            <Box sx={{ width: "100%", height: 400 }}>
              {displayData.length > 0 ? (
                  <ResponsiveContainer>
                    <ComposedChart
                      data={displayData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="displayDate"
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        tickMargin={10}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke={theme.palette.primary.main}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k ₽`}
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={theme.palette.success.main}
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: `1px solid ${theme.palette.divider}`,
                          backgroundColor: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value: any, name: any) => {
                          if (typeof value !== "number") return [value, name];
                          if (name === "Выручка")
                            return [
                              new Intl.NumberFormat("ru-RU", {
                                style: "currency",
                                currency: "RUB",
                              }).format(value),
                              name,
                            ];
                          if (name === "Блюда") return [`${value} шт.`, name];
                          return [value, name];
                        }}
                        labelStyle={{
                          color: theme.palette.text.secondary,
                          marginBottom: 8,
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                      <Bar
                        yAxisId="right"
                        dataKey="dishes"
                        name="Блюда"
                        fill={theme.palette.success.main}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        opacity={0.8}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        name="Выручка"
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
              ) : (
                  <Typography color="text.secondary" align="center" mt={10}>
                      Нет данных за выбранный период
                  </Typography>
              )}
            </Box>
          </Card>
          {/* Margins section */}
          {margins && (
            <>
              <Typography variant="h5" fontWeight="bold" gutterBottom mt={4} mb={2}>Маржа</Typography>

              {/* Margin summary cards */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Выручка</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(margins.total.revenue)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Себестоимость</Typography>
                    <Typography variant="h5" fontWeight="bold" color="error.main">
                      {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(margins.total.total_cost)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Чистая маржа</Typography>
                    <Typography variant="h5" fontWeight="bold" color={margins.total.margin_pct >= 40 ? 'success.main' : margins.total.margin_pct >= 20 ? 'warning.main' : 'error.main'}>
                      {margins.total.margin_pct.toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Stacked bar chart by category */}
              {margins.by_category.length > 0 && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, mb: 4 }}>
                  <Typography variant="h6" gutterBottom mb={3}>Выручка vs Себестоимость по категориям</Typography>
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={margins.by_category} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis dataKey="category" fontSize={12} />
                        <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} fontSize={12} />
                        <Tooltip formatter={(v: number | undefined) => v !== undefined ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v) : ''} />
                        <Legend />
                        <Bar dataKey="total_cost" name="Себестоимость" stackId="a" fill={theme.palette.error.light} />
                        <Bar dataKey="revenue" name="Выручка" stackId="b" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
              )}

              {/* Margin table by item */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6">Маржа по блюдам</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell>Блюдо</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell align="right">Продано</TableCell>
                        <TableCell align="right">Выручка ₽</TableCell>
                        <TableCell align="right">Себест. ₽</TableCell>
                        <TableCell align="right">Маржа ₽</TableCell>
                        <TableCell align="right">Маржа %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {margins.by_item.map((item, idx) => (
                        <TableRow key={idx} hover sx={{
                          bgcolor: item.margin_pct < 20 ? 'error.50' : item.margin_pct > 60 ? 'success.50' : 'inherit'
                        }}>
                          <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right">{item.sold}</TableCell>
                          <TableCell align="right">{item.revenue.toFixed(0)}</TableCell>
                          <TableCell align="right">{item.total_cost.toFixed(0)}</TableCell>
                          <TableCell align="right">{item.margin_rub.toFixed(0)}</TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 'bold',
                            color: item.margin_pct < 20 ? 'error.main' : item.margin_pct > 60 ? 'success.main' : 'warning.main'
                          }}>
                            {item.margin_pct.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {margins.by_item.length === 0 && (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Нет данных</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default Statistics;