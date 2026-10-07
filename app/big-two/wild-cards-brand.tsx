import './wild-cards-brand.css';

/** Shared wordmark: crisp at every size, with the complete accessible title. */
export function WildCardsBrand({compact=false}:{compact?:boolean}){
 return <span className={`wc-brand ${compact?'wc-brand-compact':''}`} role="img" aria-label="BIG 2: Wild Cards"><span className="wc-brand-main" aria-hidden="true">BIG <span className="wc-brand-two">2</span><span className="wc-brand-colon">:</span></span><span className="wc-brand-sub" aria-hidden="true">Wild Cards</span></span>;
}
