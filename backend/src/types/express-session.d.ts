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
    /**
     * Party ids of the organisations the logged-in user belongs to. The only thing errand
     * queries may be scoped by, so it must be resolved server side at login and never taken
     * from the request.
     */
    organizationPartyIds?: string[];
    messages: string[];
  }
}
