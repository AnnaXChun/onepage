import { User } from './models';
import { Blog } from './models';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface BlogContextType {
  currentBlog: Blog | null;
  setCurrentBlog: (blog: Blog | null) => void;
  clearBlog: () => void;
}
