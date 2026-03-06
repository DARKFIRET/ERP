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
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  ComposedChart,
  Line,
  Bar,
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
import { fetchStatistics } from "../api";

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
        fetchStatistics(startDate, endDate)
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch stats", err);
                setLoading(false);
            });
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

          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 3,
            }}
          >
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
                          border: "1px solid #e0e0e0",
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
        </>
      )}
    </Box>
  );
};

export default Statistics;