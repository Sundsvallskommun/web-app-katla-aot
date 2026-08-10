import { User } from '@interfaces/users.interface';

declare module 'express-serve-static-core' {
  export interface Request {
    // Unionen med Record krävs för att passport-samls RequestWithUser (user: Record<string, unknown>)
    // ska förbli kompatibel med Express Request; egna handlers använder RequestWithUser med user: User.
    user?: User | Record<string, unknown>;
  }
}
