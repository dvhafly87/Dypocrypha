import { useSearchParams } from 'react-router-dom';
import ResetPage from '../components/ResetPage.jsx';

export default function ResetTokenWrapper() {
  const [searchParams] = useSearchParams();
  return <ResetPage actualToken={searchParams.get('token')} />;
}
