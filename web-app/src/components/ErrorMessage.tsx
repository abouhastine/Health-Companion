import { Alert } from '@mui/material';

type ErrorMessageProps = {
  message: string;
  onClose?: () => void;
};

export function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return message ? (
    <Alert severity="error" onClose={onClose}>
      {message}
    </Alert>
  ) : null;
}
