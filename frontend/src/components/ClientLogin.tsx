import { Card, CardContent, Typography, TextField, Button } from '@mui/material';
import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

export const TextMaskCustom = forwardRef<HTMLElement, CustomProps>(
  function TextMaskCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="+7 (000) 000-00-00"
        definitions={{ '#': /[1-9]/ }}
        inputRef={ref as any}
        onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
        overwrite
      />
    );
  },
);

interface ClientLoginProps {
    phone: string;
    setPhone: (value: string) => void;
    onLogin: () => void;
}

export const ClientLogin = ({ phone, setPhone, onLogin }: ClientLoginProps) => (
    <Card elevation={3} sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">Вход в личный кабинет</Typography>
            <Typography color="text.secondary" mb={3}>
                Введите номер телефона для доступа к вашим бронированиям и заказам
            </Typography>
            <TextField
                fullWidth
                label="Ваш телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                name="phone"
                InputProps={{ inputComponent: TextMaskCustom as any }}
                placeholder="+7 (999) 000-00-00"
                sx={{ mb: 3 }}
            />
            <Button variant="contained" size="large" fullWidth onClick={onLogin}>
                Войти / Зарегистрироваться
            </Button>
        </CardContent>
    </Card>
);
