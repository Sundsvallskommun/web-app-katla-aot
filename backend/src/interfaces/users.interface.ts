export interface User {
  // personId: string;
  partyId?: string;
  username: string;
  name: string;
  givenName: string;
  surname: string;
}

export interface ClientUser {
  name: string;
  username: string;
  initials: string;
}
