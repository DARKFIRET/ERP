import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, Typography, CircularProgress, Alert
} from '@mui/material';
import { sendOtp, verifyOtp } from '../api';

interface OtpDialogProps {
    open: boolean;
    phone: string;
    onVerified: () => void;
    onClose: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export const OtpDialog = ({ open, phone, onVerified, onClose }: OtpDialogProps) => {
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!open) return;
        setDigits(Array(OTP_LENGTH).fill(''));
        setError('');
        startCountdown();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [open]);

    const startCountdown = () => {
        setCountdown(RESEND_COOLDOWN);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        setError('');
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;
        const next = Array(OTP_LENGTH).fill('');
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        setDigits(next);
        const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
    };

    const handleVerify = async () => {
        const code = digits.join('');
        if (code.length < OTP_LENGTH) {
            setError('Введите все 6 цифр кода');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await verifyOtp(phone, code);
            onVerified();
        } catch (err: any) {
            const msg = err.message || 'Неверный код';
            setError(msg === 'Code expired' ? 'Код истёк, запросите новый' : 'Неверный код. Попробуйте ещё раз');
            setDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setError('');
        setDigits(Array(OTP_LENGTH).fill(''));
        try {
            await sendOtp(phone);
            startCountdown();
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } catch {
            setError('Не удалось отправить код. Попробуйте позже');
        }
    };

    const code = digits.join('');

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>
                Подтверждение номера
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
                    Код отправлен на номер<br />
                    <strong>{phone}</strong>
                </Typography>

                <Box display="flex" justifyContent="center" gap={1} mb={2} onPaste={handlePaste}>
                    {digits.map((digit, i) => (
                        <TextField
                            key={i}
                            inputRef={el => { inputRefs.current[i] = el; }}
                            value={digit}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            inputProps={{
                                maxLength: 1,
                                style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', padding: '10px 0' }
                            }}
                            sx={{ width: 44 }}
                            error={!!error}
                        />
                    ))}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box textAlign="center">
                    {countdown > 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Повторная отправка через {countdown} с
                        </Typography>
                    ) : (
                        <Button variant="text" size="small" onClick={handleResend}>
                            Отправить код повторно
                        </Button>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    onClick={handleVerify}
                    disabled={loading || code.length < OTP_LENGTH}
                    fullWidth
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {loading ? 'Проверяем...' : 'Подтвердить'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
