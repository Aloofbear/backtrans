import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (username: string) => {
    setUser(username);
    localStorage.setItem('currentUser', username);
    
    // --- Data Migration Logic Start ---
    const migrateData = (legacyKey: string, newUserKey: string, filterFn: (item: any) => boolean) => {
      const legacyData = JSON.parse(localStorage.getItem(legacyKey) || '[]');
      if (legacyData.length > 0) {
        const userData = legacyData.filter(filterFn);
        if (userData.length > 0) {
          const existingNewData = JSON.parse(localStorage.getItem(newUserKey) || '[]');
          // Merge and avoid duplicates by ID
          const mergedData = [...userData, ...existingNewData];
          const uniqueData = Array.from(new Map(mergedData.map(item => [item.id, item])).values());
          
          localStorage.setItem(newUserKey, JSON.stringify(uniqueData));
          
          // Remove migrated items from legacy storage to clean up
          const remainingLegacyData = legacyData.filter((item: any) => !filterFn(item));
          localStorage.setItem(legacyKey, JSON.stringify(remainingLegacyData));
        }
      }
    };

    // Migrate Practice History
    migrateData('practiceHistory', `practiceHistory_${username}`, (item) => item.userId === username);
    
    // Migrate Completed Corpus IDs
    // Note: Legacy completedCorpusIds didn't store userId, so we can only migrate if the user was the only one using it
    // or we can safely copy it as a starting point for existing users.
    const legacyCompleted = localStorage.getItem('completedCorpusIds');
    const userCompletedKey = `completedCorpusIds_${username}`;
    if (legacyCompleted && !localStorage.getItem(userCompletedKey)) {
      localStorage.setItem(userCompletedKey, legacyCompleted);
    }

    // Migrate Error Book
    // Note: Legacy errorBook didn't store userId, so we copy it to the user's specific book if they don't have one yet
    const legacyErrorBook = localStorage.getItem('errorBook');
    const userErrorBookKey = `errorBook_${username}`;
    if (legacyErrorBook && !localStorage.getItem(userErrorBookKey)) {
      localStorage.setItem(userErrorBookKey, legacyErrorBook);
    }
    // --- Data Migration Logic End ---
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
