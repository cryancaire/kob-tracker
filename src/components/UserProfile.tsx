import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export function UserProfile() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="user-info">
        <span className="user-email">{user.email}</span>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="btn sign-out-btn"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}