import { VerifiedCallback } from '@node-saml/passport-saml';

import { HttpException } from '@/exceptions/HttpException';
import { Profile } from '@/interfaces/profile.interface';
import { User } from '@/interfaces/users.interface';
import { NO_SESSION_SENDER } from '@/services/api.service';
import { getCitizenPartyId } from '@/services/citizen.service';
import { logger } from '@/utils/logger';
import { sanitizePersonNumber } from '@/utils/sanitizePersonNumber';

/**
 * Citizens, not employees: the IdP sends no group or role claims, so nothing is authorized here.
 * Identity is the citizen identifier, exchanged for the party id the rest of the app keys on.
 */
export const citizenVerify = async (profile: Profile | null, done: VerifiedCallback): Promise<void> => {
  if (!profile) {
    done({ name: 'SAML_MISSING_PROFILE', message: 'Missing SAML profile' });
    return;
  }

  const { firstname: givenName, Surname: surname, citizenIdentifier } = profile;

  if (!givenName || !surname || !citizenIdentifier) {
    logger.error('Could not extract necessary profile data fields from the IDP profile. Does the Profile interface match the IDP profile response?');
    done(null, undefined, { name: 'SAML_MISSING_ATTRIBUTES', message: 'Missing profile attributes' });
    return;
  }

  const personNumber = sanitizePersonNumber(citizenIdentifier);
  if (personNumber === undefined) {
    logger.error('The citizen identifier in the IDP profile is not a person number');
    done(null, undefined, { name: 'SAML_INVALID_CITIZEN_IDENTIFIER', message: 'Invalid citizen identifier' });
    return;
  }

  try {
    // The party id being resolved here is the one every later call sends as X-Sent-By.
    const partyId = await getCitizenPartyId(personNumber, NO_SESSION_SENDER);

    const findUser: User = {
      partyId,
      personNumber,
      name: `${givenName} ${surname}`,
      firstName: givenName,
      lastName: surname,
    };

    // The profile and the person number are PII — never above debug.
    logger.info(`Authenticated citizen ${partyId}`);
    logger.debug(`Found user: ${JSON.stringify(findUser)}`);

    done(null, findUser);
  } catch (err) {
    if (err instanceof HttpException && err.status === 404) {
      logger.error('Citizen has no party id');
      done(null, undefined, { name: 'SAML_CITIZEN_FAILED', message: 'Failed to fetch user from Citizen API' });
      return;
    }
    logger.error('Error when calling Citizen:');
    logger.error(err);
    done(err instanceof Error ? err : null);
  }
};
