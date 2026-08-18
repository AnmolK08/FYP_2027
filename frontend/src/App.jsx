import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </>
  );
}
