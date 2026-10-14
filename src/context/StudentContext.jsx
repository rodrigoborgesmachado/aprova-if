import { createContext, useContext, useEffect, useRef, useState } from "react";
import { verifySubscription } from "../services/subscriptionService";
import { normalizeEmail } from "../utils/normalize";
import { loadProgress, updateExam } from "../services/storageService";
import { config } from "../config/plans";
const StudentContext = createContext(null);
export function StudentProvider({ children }) {
  const [email, setEmail] = useState(() => {
    try {
      return sessionStorage.getItem("aprovaif:email") || "";
    } catch {
      return "";
    }
  });
  const [subscription, setSubscription] = useState({
    status: email ? "checking" : "anonymous",
  });
  const [progress, setProgress] = useState({ exams: {} });
  const [storageError, setStorageError] = useState("");
  const controller = useRef(null);
  const check = async (value = email) => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const normalized = normalizeEmail(value);
    setEmail(normalized);
    try {
      sessionStorage.setItem("aprovaif:email", normalized);
    } catch {
      setSubscription({
        status: "error",
        message:
          "O armazenamento de sessão está indisponível. Permita os dados deste site no navegador e tente novamente.",
      });
      return;
    }
    setSubscription({ status: "checking" });
    try {
      const result = await verifySubscription(normalized, {
        signal: request.signal,
      });
      if (!request.signal.aborted) {
        setSubscription(result);
        return result;
      }
    } catch (error) {
      if (!request.signal.aborted)
        setSubscription({ status: "error", message: error.message });
    }
  };
  useEffect(() => {
    if (email) check(email);
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    if (!email) {
      setProgress({ exams: {} });
      setStorageError("");
      return;
    }
    try {
      setProgress(loadProgress(email));
      setStorageError("");
    } catch (error) {
      setProgress({ exams: {} });
      setStorageError(error.message);
    }
    const sync = (e) => {
      if (e.key === `aprovaif:v1:${email}`) {
        try {
          setProgress(loadProgress(email));
        } catch (error) {
          setStorageError(error.message);
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [email]);
  useEffect(() => {
    if (subscription.status !== "active") return;
    const timer = setTimeout(
      () => check(email),
      Math.max(
        0,
        config.verificationTTL - (Date.now() - subscription.verifiedAt),
      ),
    );
    return () => clearTimeout(timer);
  }, [subscription]);
  const saveExam = (id, updater) => {
    try {
      setProgress(updateExam(email, id, updater));
      setStorageError("");
      return true;
    } catch (error) {
      setStorageError(`Não foi possível salvar o progresso: ${error.message}`);
      return false;
    }
  };
  const logout = () => {
    controller.current?.abort();
    try {
      sessionStorage.removeItem("aprovaif:email");
    } catch {
      /* Session state is still cleared in memory. */
    }
    setEmail("");
    setSubscription({ status: "anonymous" });
    setProgress({ exams: {} });
  };
  return (
    <StudentContext.Provider
      value={{
        email,
        subscription,
        check,
        logout,
        progress,
        saveExam,
        storageError,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
export const useStudent = () => useContext(StudentContext);
