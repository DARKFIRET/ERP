import { useState } from 'react';

type Severity = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
}

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: Severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const hideSnackbar = () =>
    setSnackbar(s => ({ ...s, open: false }));

  return { snackbar, showSnackbar, hideSnackbar };
}
