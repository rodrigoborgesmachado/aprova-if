import axios from "axios";
import { config, subscriptionPlans } from "../config/plans";
import { normalizeEmail, validEmail } from "../utils/normalize";
export async function verifySubscription(
  email,
  {
    signal,
    client = axios,
    baseUrl = config.subscriptionUrl,
    plans = subscriptionPlans,
  } = {},
) {
  email = normalizeEmail(email);
  if (!validEmail(email)) throw new Error("Informe um email válido.");
  if (!baseUrl)
    throw new Error(
      "A consulta de assinaturas ainda não foi configurada. Defina VITE_ECOMMERCE_API_URL.",
    );
  if (plans.some((p) => !p.offerCode || p.offerCode.startsWith("OFFER_CODE_")))
    throw new Error("Os códigos de oferta ainda precisam ser configurados.");
  let failure;
  for (const plan of plans) {
    try {
      const { data } = await client.post(
        `${baseUrl.replace(/\/$/, "")}/subscription/status`,
        { Email: email, OfferCode: plan.offerCode },
        { signal, timeout: 15000 },
      );
      if (typeof data?.IsActive !== "boolean")
        throw new Error("A API retornou um status de assinatura inválido.");
      if (data.IsActive === true)
        return {
          email,
          plan,
          expiresAt: data.DateExpiration || null,
          verifiedAt: Date.now(),
          status: "active",
        };
    } catch (error) {
      if (signal?.aborted || axios.isCancel(error)) throw error;
      failure = error;
      if (error.response?.status === 429) break;
    }
  }
  if (failure) {
    if (failure.response?.status === 409)
      throw new Error(
        "O Ecommerce retornou conflito (409). A renovação ainda possui uma limitação conhecida. Consulte o suporte do Ecommerce.",
      );
    throw new Error(
      failure.response?.status === 429
        ? "Limite de consultas atingido. Aguarde antes de tentar novamente."
        : "Não foi possível verificar todos os planos. Tente novamente. " +
            (failure.message || ""),
    );
  }
  return { email, status: "inactive", verifiedAt: Date.now() };
}
export function checkout(
  plan,
  {
    navigate = (url) => window.location.assign(url),
    storage = sessionStorage,
    baseUrl = config.ecommerceUrl,
  } = {},
) {
  if (!plan.pin || plan.pin.startsWith("PIN_"))
    throw new Error(
      "O checkout deste plano ainda não está configurado. O PIN de desenvolvimento precisa ser substituído.",
    );
  storage.setItem("aprovaif:selected-plan", plan.id);
  navigate(`${baseUrl.replace(/\/$/, "")}/pin/${encodeURIComponent(plan.pin)}`);
}
