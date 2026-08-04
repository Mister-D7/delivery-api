import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import frCommon from './locales/fr/common.json';
import frDashboard from './locales/fr/dashboard.json';
import frCustomize from './locales/fr/customize.json';
import frStorefront from './locales/fr/storefront.json';
import frCheckout from './locales/fr/checkout.json';
import frSettings from './locales/fr/settings.json';
import frProductCard from './locales/fr/product-card.json';
import frCart from './locales/fr/cart.json';
import frNotifications from './locales/fr/notifications.json';
import frPrint from './locales/fr/print.json';
import frUserMenu from './locales/fr/user-menu.json';
import frOrderTracking from './locales/fr/order-tracking.json';
import frCustomerAuth from './locales/fr/customer-auth.json';
import frCustomerProfile from './locales/fr/customer-profile.json';
import frOrderStatus from './locales/fr/order-status.json';
import frRevenue from './locales/fr/revenue.json';
import frDeliveryPricing from './locales/fr/delivery-pricing.json';
import frBackup from './locales/fr/backup.json';
import frStorefrontEditor from './locales/fr/storefront-editor.json';
import frCoupons from './locales/fr/coupons.json';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enCustomize from './locales/en/customize.json';
import enStorefront from './locales/en/storefront.json';
import enCheckout from './locales/en/checkout.json';
import enSettings from './locales/en/settings.json';
import enProductCard from './locales/en/product-card.json';
import enCart from './locales/en/cart.json';
import enNotifications from './locales/en/notifications.json';
import enPrint from './locales/en/print.json';
import enUserMenu from './locales/en/user-menu.json';
import enOrderTracking from './locales/en/order-tracking.json';
import enCustomerAuth from './locales/en/customer-auth.json';
import enCustomerProfile from './locales/en/customer-profile.json';
import enOrderStatus from './locales/en/order-status.json';
import enRevenue from './locales/en/revenue.json';
import enDeliveryPricing from './locales/en/delivery-pricing.json';
import enBackup from './locales/en/backup.json';
import enStorefrontEditor from './locales/en/storefront-editor.json';
import enCoupons from './locales/en/coupons.json';
import arCommon from './locales/ar/common.json';
import arDashboard from './locales/ar/dashboard.json';
import arCustomize from './locales/ar/customize.json';
import arStorefront from './locales/ar/storefront.json';
import arCheckout from './locales/ar/checkout.json';
import arSettings from './locales/ar/settings.json';
import arProductCard from './locales/ar/product-card.json';
import arCart from './locales/ar/cart.json';
import arNotifications from './locales/ar/notifications.json';
import arPrint from './locales/ar/print.json';
import arUserMenu from './locales/ar/user-menu.json';
import arOrderTracking from './locales/ar/order-tracking.json';
import arCustomerAuth from './locales/ar/customer-auth.json';
import arCustomerProfile from './locales/ar/customer-profile.json';
import arOrderStatus from './locales/ar/order-status.json';
import arRevenue from './locales/ar/revenue.json';
import arDeliveryPricing from './locales/ar/delivery-pricing.json';
import arBackup from './locales/ar/backup.json';
import arStorefrontEditor from './locales/ar/storefront-editor.json';
import arCoupons from './locales/ar/coupons.json';

export const RTL_LANGUAGES = ['ar'] as const;
export type AppLanguage = 'fr' | 'en' | 'ar';

export function isRTL(lng?: string): boolean {
  return RTL_LANGUAGES.includes(lng as any);
}

const resources = {
  fr: {
    common: frCommon,
    dashboard: frDashboard,
    customize: frCustomize,
    storefront: frStorefront,
    checkout: frCheckout,
    settings: frSettings,
    'product-card': frProductCard,
    cart: frCart,
    notifications: frNotifications,
    print: frPrint,
    'user-menu': frUserMenu,
    'order-tracking': frOrderTracking,
    'customer-auth': frCustomerAuth,
    'customer-profile': frCustomerProfile,
    'order-status': frOrderStatus,
    revenue: frRevenue,
    'delivery-pricing': frDeliveryPricing,
    backup: frBackup,
    'storefront-editor': frStorefrontEditor,
    coupons: frCoupons,
  },
  en: {
    common: enCommon,
    dashboard: enDashboard,
    customize: enCustomize,
    storefront: enStorefront,
    checkout: enCheckout,
    settings: enSettings,
    'product-card': enProductCard,
    cart: enCart,
    notifications: enNotifications,
    print: enPrint,
    'user-menu': enUserMenu,
    'order-tracking': enOrderTracking,
    'customer-auth': enCustomerAuth,
    'customer-profile': enCustomerProfile,
    'order-status': enOrderStatus,
    revenue: enRevenue,
    'delivery-pricing': enDeliveryPricing,
    backup: enBackup,
    'storefront-editor': enStorefrontEditor,
    coupons: enCoupons,
  },
  ar: {
    common: arCommon,
    dashboard: arDashboard,
    customize: arCustomize,
    storefront: arStorefront,
    checkout: arCheckout,
    settings: arSettings,
    'product-card': arProductCard,
    cart: arCart,
    notifications: arNotifications,
    print: arPrint,
    'user-menu': arUserMenu,
    'order-tracking': arOrderTracking,
    'customer-auth': arCustomerAuth,
    'customer-profile': arCustomerProfile,
    'order-status': arOrderStatus,
    revenue: arRevenue,
    'delivery-pricing': arDeliveryPricing,
    backup: arBackup,
    'storefront-editor': arStorefrontEditor,
    coupons: arCoupons,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: Object.keys(resources.fr),

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'delivery-app-lang',
    },

    interpolation: { escapeValue: false },
    returnNull: false,
    keySeparator: '.',
    nsSeparator: ':',

    react: { useSuspense: false },
  });

i18n.on('languageChanged', (lng: string) => {
  document.documentElement.dir = isRTL(lng) ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  if (isRTL(lng)) {
    document.documentElement.style.setProperty('--font-body', "'Tajawal', 'Manrope', sans-serif");
  } else {
    document.documentElement.style.removeProperty('--font-body');
  }
});

document.documentElement.dir = isRTL(i18n.language) ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;

export default i18n;
