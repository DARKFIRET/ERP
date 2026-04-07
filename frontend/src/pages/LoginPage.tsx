import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Container, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                setError('Неверный логин или пароль');
                return;
            }

            const data = await res.json();
            login(data.token, data.role, data.username);

            // Redirect based on role
            switch (data.role) {
                case 'admin': navigate('/admin'); break;
                case 'waiter': navigate('/waiter'); break;
                case 'cook': navigate('/kitchen'); break;
                case 'manager': navigate('/management'); break;
                default: navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError('Ошибка входа. Проверьте подключение к серверу.');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Typography component="h1" variant="h5" gutterBottom>
                    Вход в систему
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Логин"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Войти
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;
