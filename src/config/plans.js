export const subscriptionPlans = [
  {
    id: "monthly",
    name: "Mensal",
    durationMonths: 1,
    pin: "W42X9W",
    offerCode: import.meta.env.VITE_MONTHLY_OFFER_CODE || "W42X9W",
    price: 100.00,
  },
  {
    id: "semiannual",
    name: "Semestral",
    durationMonths: 6,
    pin: "F9JI2G",
    offerCode:
      import.meta.env.VITE_SEMIANNUAL_OFFER_CODE || "F9JI2G",
    price: 500.00,
  },
  {
    id: "annual",
    name: "Anual",
    durationMonths: 12,
    pin: "53XC54",
    offerCode: import.meta.env.VITE_ANNUAL_OFFER_CODE || "53XC54",
    price: 1000.00,
  },
];
export const config = {
  appName: "AprovaIF",
  questionsUrl:
    "https://apisunsale.azurewebsites.net/api/PublicQuestoes",
  ecommerceUrl:
    "https://pedidoweb-pre.santillanaeducacao.com.br/",
  subscriptionUrl: "https://pre-new-ecommerce-api.santillanaeducacao.com.br",
  verificationTTL: 5 * 60 * 1000,
};
