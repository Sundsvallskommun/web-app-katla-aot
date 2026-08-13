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

/** Sanerar schemaägd text utan att vara beroende av webbläsarglobaler. */
export function sanitizeFieldDescription(unsafeHtml: string, newTabAnnouncementId: string): SanitizedFieldDescription {
  let hasNewTabLink = false;
  // Ett pass räcker: transformen bygger länkattributen från grunden och kopierar
  // bara href, så inkommande rel eller aria-describedby kan aldrig överleva.
  // Scheman filtreras av allowedSchemes efter transformen.
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

        // Endast det kanoniska HTML-nyckelordet öppnar en ny flik. Namngivna mål
        // och varianter med annan skiftlägesform tas bort i stället för att litas på.
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
    html: SanitizeHTML(unsafeHtml, options),
    hasNewTabLink,
  };
}
