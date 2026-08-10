import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';

import App from '@/app';

import { CitizenController } from './controllers/citizen.controller';
import { EmployeeController } from './controllers/employee.controller';
import { HealthController } from './controllers/health.controller';
import { OrganizationController } from './controllers/organization.controller';
import { SchemaController } from './controllers/schema.controller';
import { SupportManagementController } from './controllers/supportmanagement.controller';
import { UserController } from './controllers/user.controller';

validateEnv();

const app = new App([
  IndexController,
  UserController,
  HealthController,
  SupportManagementController,
  EmployeeController,
  CitizenController,
  SchemaController,
  OrganizationController,
]);

app.listen();
