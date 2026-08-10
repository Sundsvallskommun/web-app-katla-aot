import { User } from '@/interfaces/users.interface';
interface Engagement {
  organizationName: string;
  organizationNumber: string;
  organizationId: string;
}

declare module 'express-session' {
  interface Session {
    returnTo?: string;
    user?: User;
    representing?: Engagement;
    passport?: unknown;
    representingChoices?: Engagement[];
    messages: string[];
  }
}
