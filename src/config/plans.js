export const subscriptionPlans = [
  {
    id: "monthly",
    name: "Mensal",
    durationMonths: 1,
    pin: "V53ZTP",
    offerCode: import.meta.env.VITE_MONTHLY_OFFER_CODE || "V53ZTP",
    price: null,
  },
  {
    id: "semiannual",
    name: "Semestral",
    durationMonths: 6,
    pin: "QVNMO9",
    offerCode:
      import.meta.env.VITE_SEMIANNUAL_OFFER_CODE || "QVNMO9",
    price: null,
  },
  {
    id: "annual",
    name: "Anual",
    durationMonths: 12,
    pin: "G4LZK6",
    offerCode: import.meta.env.VITE_ANNUAL_OFFER_CODE || "G4LZK6",
    price: null,
  },
];
export const config = {
  appName: "AprovaIF",
  questionsUrl:
    "https://apisunsale.azurewebsites.net/api/PublicQuestoes",
  ecommerceUrl:
    "https://dev-ecommerceweb.santillanaeducacao.com.br",
  subscriptionUrl: "https://dev-new-ecommerce-api.santillanaeducacao.com.br",
  verificationTTL: 5 * 60 * 1000,
};
