import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mergeSaved, NasaMedia, restoreSaved } from "../lib/media";

const KEY = "@build-rocket/expedition/v1";
export function useExpedition() {
  const [saved, setSaved] = useState<NasaMedia[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (live) {
          setSaved(restoreSaved(value));
          setReady(true);
        }
      })
      .catch(() => {
        if (live) setError("Não foi possível recuperar sua expedição.");
      });
    return () => {
      live = false;
    };
  }, [attempt]);
  const toggle = useCallback(
    (item: NasaMedia) => {
      if (!ready) return;
      setSaved((current) => mergeSaved(current, item));
    },
    [ready],
  );
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(saved)))
      .then(() => setError(null))
      .catch(() =>
        setError(
          "Sua descoberta está nesta sessão, mas não foi salva no aparelho.",
        ),
      );
  }, [saved, ready]);
  const retry = useCallback(() => {
    setError(null);
    if (ready) setSaved((current) => [...current]);
    else setAttempt((current) => current + 1);
  }, [ready]);
  return { saved, ready, error, toggle, retry };
}
