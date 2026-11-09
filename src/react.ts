import { createElement, useEffect, useRef, useState, type ReactElement } from "react";
import { recommend } from "./recommend";
import { render } from "./render";
import type { RecommendOptions, Recommendations, RenderOptions } from "./types";

export type AdfactenRecommendationsProps = RenderOptions & {
  /** Cards you already fetched (for example on your server). When set, nothing is requested. */
  result?: Recommendations | null;
  /** Otherwise the component fetches cards for this query. */
  request?: RecommendOptions;
  /** Called with the fetched cards (or null). */
  onResult?: (result: Recommendations | null) => void;
  className?: string;
};

/** Renders sponsored cards with the mandatory label. Renders nothing when there are no cards. */
export function AdfactenRecommendations(props: AdfactenRecommendationsProps): ReactElement {
  const { result, request, onResult, className, theme, lang, onClick } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [fetched, setFetched] = useState<Recommendations | null>(null);
  const reqKey = request ? JSON.stringify([request.key, request.placement, request.query, request.lang, request.country,
    request.currency, request.priceMax, request.limit, request.test, request.agentCheckout]) : "";
  const reqRef = useRef(request);
  reqRef.current = request;
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    const req = reqRef.current;
    if (result !== undefined || !req) return;
    const ctrl = new AbortController();
    void recommend({ ...req, signal: ctrl.signal }).then((r) => {
      if (ctrl.signal.aborted) return;
      setFetched(r);
      onResultRef.current?.(r);
    });
    return () => ctrl.abort();
  }, [reqKey, result]);

  const shown = result !== undefined ? result : fetched;
  useEffect(() => {
    if (!ref.current) return;
    const h = render(ref.current, shown, { theme, lang, onClick: (item) => onClickRef.current?.(item) });
    return () => h.destroy();
  }, [shown, theme, lang]);

  return createElement("div", { ref, className, hidden: !shown || undefined });
}
