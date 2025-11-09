export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
  createdAt?: string | Date;
  permissions?: string[];
  roles?: string[];
}


