import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { SupportManagementController } from './controllers/supportmanagement.controller';
import { EmployeeController } from './controllers/employee.controller';
import { CitizenController } from './controllers/citizen.controller';
import { SchemaController } from './controllers/schema.controller';
import { OrganizationController } from './controllers/organization.controller';

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
