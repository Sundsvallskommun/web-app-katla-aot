import SanitizeHTML from 'sanitize-html';

const FIELD_DESCRIPTION_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'blockquote',
  'p',
  'a',
  'ul',
  'ol',
  'li',
  'b',
  'i',
  'strong',
  'em',
  'strike',
  'del',
  'br',
  'div',
  'sup',
  'sub',
] as const;

export interface SanitizedFieldDescription {
  html: string;
  hasNewTabLink: boolean;
}

/** Sanitizes externally managed schema text without depending on browser globals. */
export function sanitizeFieldDescription(unsafeHtml: string, newTabAnnouncementId: string): SanitizedFieldDescription {
  let hasNewTabLink = false;
  const sanitizedHtml = SanitizeHTML(unsafeHtml, {
    allowedTags: [...FIELD_DESCRIPTION_TAGS],
    allowedAttributes: {
      a: ['href', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  });
  const options: SanitizeHTML.IOptions = {
    allowedTags: [...FIELD_DESCRIPTION_TAGS],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'aria-describedby'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => {
        const safeAttributes: Record<string, string> = {};
        if (attributes.href) safeAttributes.href = attributes.href;

        // Only the canonical HTML keyword opens a new browsing context. Named targets
        // and differently cased lookalikes are removed instead of being trusted.
        if (attributes.target !== '_blank' || !attributes.href) return { tagName, attribs: safeAttributes };

        hasNewTabLink = true;
        return {
          tagName,
          attribs: {
            ...safeAttributes,
            target: '_blank',
            rel: 'noopener noreferrer',
            'aria-describedby': newTabAnnouncementId,
          },
        };
      },
    },
  };

  return {
    html: SanitizeHTML(sanitizedHtml, options),
    hasNewTabLink,
  };
}
