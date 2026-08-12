export interface User {
  id: number;
  personId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  groups: string[];
}

export interface ClientUser {
  name: string;
  username: string;
  initials: string;
}
