import i18nConfig from '@app/i18nConfig';

/**
 * Språken i den ordning de visas, härledda ur i18n-konfigurationen så att ett nytt språk
 * bara behöver läggas till på ett ställe.
 *
 * Namnen skrivs på språket självt ("English", inte "Engelska"). En användare som inte läser
 * svenska ska kunna hitta sitt språk i menyn, och därför bär varje alternativ även ett
 * lang-attribut så att skärmläsare uttalar namnet med rätt röst.
 */
export const languageOptions = i18nConfig.locales.map((locale) => ({
  value: locale,
  labelKey: `layout:language.${locale}`,
}));
