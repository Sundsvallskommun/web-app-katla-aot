import 'reflect-metadata';

import {
  APP_NAME,
  BASE_URL_PREFIX,
  CREDENTIALS,
  LOG_FORMAT,
  NODE_ENV,
  ORIGIN,
  PORT,
  SAML_CALLBACK_URL,
  SAML_ENTRY_SSO,
  SAML_FAILURE_REDIRECT,
  SAML_IDP_PUBLIC_CERT,
  SAML_ISSUER,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_PRIVATE_KEY,
  SAML_PUBLIC_KEY,
  SAML_SUCCESS_REDIRECT,
  SECRET_KEY,
  SESSION_MEMORY,
  SWAGGER_ENABLED,
} from '@config';
import errorMiddleware from '@middlewares/error.middleware';
import { Profile as SamlProfile, Strategy, VerifiedCallback } from '@node-saml/passport-saml';
import { logger, stream } from '@utils/logger';
import bodyParser from 'body-parser';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { existsSync, mkdirSync } from 'fs';
import helmet from 'helmet';
import hpp from 'hpp';
import createMemoryStore from 'memorystore';
import morgan from 'morgan';
import passport from 'passport';
import { join } from 'path';
import { getMetadataArgsStorage, useExpressServer } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import createFileStore from 'session-file-store';
import swaggerUi from 'swagger-ui-express';

import { HttpException } from './exceptions/HttpException';
import { Profile } from './interfaces/profile.interface';
import { additionalConverters } from './utils/custom-validation-classes';
import { getSafeRedirect, getSamlRedirects } from './utils/isValidOrigin';

type ControllerClass = new () => object;

const corsWhitelist = (ORIGIN ?? '').split(',');

const sessionTTL = 4 * 24 * 60 * 60;
// NOTE: memory uses ms while file uses seconds
const sessionStore: session.Store = SESSION_MEMORY
  ? new (createMemoryStore(session))({ checkPeriod: sessionTTL * 1000 })
  : new (createFileStore(session))({ sessionTTL, path: './data/sessions' });

export const getSessionCookieOptions = (environment: string | undefined): session.CookieOptions => ({
  httpOnly: true,
  secure: environment === 'production',
  sameSite: 'lax',
  maxAge: sessionTTL * 1000,
});

// Plockar ut ett name-fält ur ett okänt felobjekt (SAML-verifieringen skickar { name, message }).
const getErrorName = (err: unknown): string | undefined => {
  if (typeof err === 'object' && err !== null && 'name' in err) {
    const { name } = err as { name?: unknown };
    if (typeof name === 'string' && name !== '') return name;
  }
  return undefined;
};

const getRelayState = (body: unknown): unknown =>
  typeof body === 'object' && body !== null ? (body as { RelayState?: unknown }).RelayState : undefined;

// const prisma = new PrismaClient();
// const apiService = new ApiService();

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user: Express.User, done) {
  done(null, user);
});

const samlStrategy = new Strategy(
  {
    disableRequestedAuthnContext: true,
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    callbackUrl: SAML_CALLBACK_URL ?? '',
    entryPoint: SAML_ENTRY_SSO,
    // decryptionPvk: SAML_PRIVATE_KEY,
    privateKey: SAML_PRIVATE_KEY,
    // Identity Provider's public key
    idpCert: SAML_IDP_PUBLIC_CERT ?? '',
    issuer: SAML_ISSUER ?? '',
    wantAssertionsSigned: false,
    wantAuthnResponseSigned: false,
    acceptedClockSkewMs: -1,
    audience: false,
    logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL,
  },
  function (samlProfile: SamlProfile | null, done: VerifiedCallback) {
    if (!samlProfile) {
      done({
        name: 'SAML_MISSING_PROFILE',
        message: 'Missing SAML profile',
      });
      return;
    }
    const { givenName, surname, citizenIdentifier, username } = samlProfile as Profile;

    if (!givenName || !surname || !citizenIdentifier) {
      done({
        name: 'SAML_MISSING_ATTRIBUTES',
        message: 'Missing profile attributes',
      });
      return;
    }

    //   const groupList: ADRole[] =
    //   groups !== undefined
    //     ? (groups
    //         .split(',')
    //         .map(x => x.toLowerCase())
    //         .filter(x => x.includes('sg_appl_app_')) as ADRole[])
    //     : [];

    // const appGroups: ADRole[] = groupList.length > 0 ? groupList : groupList.concat('sg_appl_app_read');

    try {
      // const personNumber = profile.citizenIdentifier;
      // const citizenResult = await apiService.get<any>({ url: `citizen/2.0/${personNumber}/guid` });
      // const { data: personId } = citizenResult;

      // if (!personId) {
      //   return done({
      //     name: 'SAML_CITIZEN_FAILED',
      //     message: 'Failed to fetch user from Citizen API',
      //   });
      // }

      const findUser = {
        // personId: personId,
        username: username,
        name: `${givenName} ${surname}`,
        givenName: givenName,
        surname: surname,
      };

      done(null, findUser);
    } catch (err) {
      if (err instanceof HttpException && err.status === 404) {
        // Handle missing person form Citizen
      }
      done(err as Error);
    }
  },
  function (_samlProfile: SamlProfile | null, done: VerifiedCallback) {
    done(null, {});
  },
);

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public swaggerEnabled: boolean;

  constructor(Controllers: ControllerClass[]) {
    this.app = express();
    // Tom sträng ska precis som tidigare falla tillbaka på respektive standardvärde.
    this.env = NODE_ENV !== undefined && NODE_ENV !== '' ? NODE_ENV : 'development';
    this.port = PORT !== undefined && PORT !== '' ? PORT : 3000;
    this.swaggerEnabled = SWAGGER_ENABLED || false;

    this.initializeDataFolders();

    this.initializeMiddlewares();
    this.initializeRoutes(Controllers);
    if (this.swaggerEnabled) {
      this.initializeSwagger(Controllers);
    }
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.set('trust proxy', 1);
    this.app.use(morgan(LOG_FORMAT ?? 'default', { stream }));
    // Grundläggande rate limiting för alla rutter (inloggningsflöden, swagger, proxade API:er).
    // Justera per driftmiljö; miljöer bakom en gateway kan även rate-limita i kanten.
    this.app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    this.app.use(
      session({
        secret: SECRET_KEY ?? '',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: getSessionCookieOptions(NODE_ENV),
      }),
    );

    this.app.use(passport.initialize());
    this.app.use(passport.session());
    passport.use('saml', samlStrategy);

    this.app.use(
      cors({
        credentials: CREDENTIALS,
        origin: function (origin, callback) {
          if (origin === undefined || corsWhitelist.includes(origin) || corsWhitelist.includes('*')) {
            callback(null, true);
          } else {
            if (NODE_ENV == 'development') {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        },
      }),
    );

    this.app.get(
      `${BASE_URL_PREFIX}/saml/login`,
      (req, res, next) => {
        if (req.session.returnTo) {
          req.query.RelayState = req.session.returnTo;
        } else if (typeof req.query.successRedirect === 'string' && req.query.successRedirect !== '') {
          req.query.RelayState = req.query.successRedirect;
        }
        if (typeof req.query.failureRedirect === 'string' && req.query.failureRedirect !== '') {
          const relayState = typeof req.query.RelayState === 'string' ? req.query.RelayState : '';
          req.query.RelayState = `${relayState},${req.query.failureRedirect}`;
        }
        next();
      },
      (req, res, next) => {
        const authenticate = passport.authenticate('saml', {
          failureRedirect: SAML_FAILURE_REDIRECT,
        }) as express.RequestHandler;
        authenticate(req, res, next);
      },
    );

    this.app.get(`${BASE_URL_PREFIX}/saml/metadata`, (req, res) => {
      res.type('application/xml');
      const metadata = samlStrategy.generateServiceProviderMetadata(SAML_PUBLIC_KEY ?? null, SAML_PUBLIC_KEY ?? null);
      res.status(200).send(metadata);
    });

    this.app.get(
      `${BASE_URL_PREFIX}/saml/logout`,
      (req, res, next) => {
        if (req.session.returnTo) {
          req.query.RelayState = req.session.returnTo;
        } else if (typeof req.query.successRedirect === 'string' && req.query.successRedirect !== '') {
          req.query.RelayState = req.query.successRedirect;
        }
        next();
      },
      (req, res, next) => {
        const successRedirect = getSafeRedirect(req.query.successRedirect, SAML_SUCCESS_REDIRECT ?? '');

        samlStrategy.logout(req as unknown as Parameters<typeof samlStrategy.logout>[0], () => {
          req.logout(err => {
            if (err) {
              next(err);
              return;
            }
            res.redirect(successRedirect);
          });
        });
      },
    );

    this.app.get(`${BASE_URL_PREFIX}/saml/logout/callback`, bodyParser.urlencoded({ extended: false }), (req, res, next) => {
      // Passport may clear session-scoped SAML messages during logout, so preserve the result first.
      const failMessage = req.session.messages?.[0];
      req.logout(err => {
        if (err) {
          next(err);
          return;
        }

        const { successRedirect, failureRedirect } = getSamlRedirects(getRelayState(req.body), SAML_SUCCESS_REDIRECT ?? '');
        if (failMessage) {
          failureRedirect.searchParams.set('failMessage', failMessage);
          res.redirect(failureRedirect.toString());
          return;
        }

        res.redirect(successRedirect.toString());
      });
    });

    this.app.post(`${BASE_URL_PREFIX}/saml/login/callback`, bodyParser.urlencoded({ extended: false }), (req, res, next) => {
      const { successRedirect, failureRedirect } = getSamlRedirects(getRelayState(req.body), SAML_SUCCESS_REDIRECT ?? '');

      const authenticate = passport.authenticate('saml', (err: unknown, user?: Express.User | false | null) => {
        if (err) {
          const errorName = getErrorName(err);
          failureRedirect.searchParams.set('failMessage', errorName ?? 'SAML_UNKNOWN_ERROR');
          res.redirect(failureRedirect.toString());
          return;
        } else if (!user) {
          failureRedirect.searchParams.set('failMessage', 'NO_USER');
          res.redirect(failureRedirect.toString());
          return;
        } else {
          req.login(user, loginErr => {
            if (loginErr) {
              failureRedirect.searchParams.set('failMessage', 'SAML_UNKNOWN_ERROR');
              res.redirect(failureRedirect.toString());
              return;
            }
            res.redirect(successRedirect.toString());
          });
        }
      }) as express.RequestHandler;
      authenticate(req, res, next);
    });
  }

  private initializeRoutes(controllers: ControllerClass[]) {
    useExpressServer(this.app, {
      routePrefix: BASE_URL_PREFIX,
      controllers: controllers,
      defaultErrorHandler: false,
    });
  }

  private initializeSwagger(controllers: ControllerClass[]) {
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix: '#/components/schemas/',
      additionalConverters: additionalConverters,
    });

    const routingControllersOptions = {
      routePrefix: BASE_URL_PREFIX,
      controllers: controllers,
    };

    // routing-controllers-openapi och class-validator-jsonschema använder olika majorversioner av
    // openapi3-ts; schemastrukturen är kompatibel men typerna måste kastas om.
    type SpecAdditionalProperties = NonNullable<Parameters<typeof routingControllersToSpec>[2]>;
    type SpecSchemas = NonNullable<SpecAdditionalProperties['components']>['schemas'];

    const storage = getMetadataArgsStorage();
    const spec = routingControllersToSpec(storage, routingControllersOptions, {
      components: {
        schemas: schemas as unknown as SpecSchemas,
        securitySchemes: {
          basicAuth: {
            scheme: 'basic',
            type: 'http',
          },
        },
      },
      info: {
        title: `${APP_NAME} Proxy API`,
        description: '',
        version: '1.0.0',
      },
    });

    this.app.use(`${BASE_URL_PREFIX}/swagger.json`, (req: express.Request, res: express.Response) => {
      res.json(spec);
    });
    this.app.use(`${BASE_URL_PREFIX}/api-docs`, swaggerUi.serve, swaggerUi.setup(spec));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeDataFolders() {
    const databaseDir: string = join(__dirname, '../data/database');
    if (!existsSync(databaseDir)) {
      mkdirSync(databaseDir, { recursive: true });
    }
    const logsDir: string = join(__dirname, '../data/logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    const sessionsDir: string = join(__dirname, '../data/sessions');
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
    }
  }
}

export default App;
