import { User } from '@/interfaces/users.interface';
import { OrganizationDTO } from '@/responses/legal-entity.response';

declare module 'express-session' {
  interface Session {
    returnTo?: string;
    user?: User;
    passport?: unknown;
    /**
     * Organisations the logged-in citizen may act for — their own engagements plus any granted
     * by mandate. The only thing errand queries may be scoped by, so it is resolved server side
     * at login and never taken from the request.
     */
    representingBusinessChoices?: OrganizationDTO[];
    messages: string[];
  }
}
