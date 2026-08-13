'use client';

import { Alert } from '@sk-web-gui/react';

interface ErrorAlertProps {
  className?: string;
  message: string;
}

/**
 * Gemensam presentation av ett API-fel. Äger rollen, uppmärkningen och
 * ikonen så att felmeddelanden ser likadana ut och annonseras likadant
 * oavsett vilken yta som visar dem.
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({ className, message }) => (
  <div role="alert" className={className}>
    <Alert type="error">
      <Alert.Icon />
      <Alert.Content>
        <Alert.Content.Description>{message}</Alert.Content.Description>
      </Alert.Content>
    </Alert>
  </div>
);

interface ErrorAlertListProps {
  messages: string[];
}

/** Renderar flera samtidiga fel, till exempel metadata- och ärendefel på samma yta. */
export const ErrorAlertList: React.FC<ErrorAlertListProps> = ({ messages }) => (
  <>
    {messages.map((message, index) => (
      <ErrorAlert key={`${index}-${message}`} message={message} />
    ))}
  </>
);
