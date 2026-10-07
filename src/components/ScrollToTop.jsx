import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { TAB_PATHS } from "@/lib/tabPaths";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;

    // Alt menü sekmeleri bellekte kalır: başa dönülmez, kaydırma konumunu sekme yığını geri getirir.
    if (TAB_PATHS.includes(pathname)) return;

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key, navigationType]);

  return null;
}