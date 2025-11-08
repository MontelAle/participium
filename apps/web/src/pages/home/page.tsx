import { useAuth } from '@/contexts/auth-context';
import MapPage from '../map/page';
import UsersMunicipalityPage from '../users-municipality/page';

function HomePage() {
  const { user } = useAuth();

  const isAdminUser = user && user.role.name === 'admin'

  if (!isAdminUser) {
    return <MapPage />;
  } else {
    return <UsersMunicipalityPage />;
  }  
}

export default HomePage;