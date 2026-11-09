// Scoped to the shadow root. Colors can be tuned with --adf-* custom properties on the container,
// except the label, which keeps fixed, readable colors.
export const CSS = `
:host{all:initial;display:block;font-family:var(--adf-font,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-size:14px;line-height:1.4;
--bg:var(--adf-bg,#fff);--fg:var(--adf-fg,#1d1d1f);--mu:var(--adf-muted,#6b6b73);--bd:var(--adf-border,#e3e3e8);--ac:var(--adf-accent,#a100a1);--hv:var(--adf-hover,#f6f6f8);--lb:#1d1d1f;--lf:#fff}
:host([data-theme=dark]){--bg:var(--adf-bg,#1c1c1f);--fg:var(--adf-fg,#f2f2f4);--mu:var(--adf-muted,#a3a3ad);--bd:var(--adf-border,#34343a);--ac:var(--adf-accent,#f08ff0);--hv:var(--adf-hover,#26262a);--lb:#f2f2f4;--lf:#1d1d1f}
@media (prefers-color-scheme:dark){:host([data-theme=auto]){--bg:var(--adf-bg,#1c1c1f);--fg:var(--adf-fg,#f2f2f4);--mu:var(--adf-muted,#a3a3ad);--bd:var(--adf-border,#34343a);--ac:var(--adf-accent,#f08ff0);--hv:var(--adf-hover,#26262a);--lb:#f2f2f4;--lf:#1d1d1f}}
*{box-sizing:border-box}
.r{color:var(--fg);margin:0}
.h{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:0 0 8px;font-size:12px;color:var(--mu)}
.l{display:inline-block!important;visibility:visible!important;opacity:1!important;position:static!important;padding:2px 7px;border-radius:4px;background:var(--lb);color:var(--lf);font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:none}
.t{display:inline-block;padding:2px 7px;border-radius:4px;border:1px dashed var(--mu);font-size:11px;font-weight:600}
ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))}
li{margin:0;padding:0;min-width:0}
a{display:flex;gap:10px;align-items:flex-start;height:100%;padding:10px;border:1px solid var(--bd);border-radius:var(--adf-radius,10px);background:var(--bg);color:inherit;text-decoration:none}
a:hover{background:var(--hv)}
a:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.i{flex:none;width:64px;height:64px;border-radius:8px;object-fit:contain;background:#fff;border:1px solid var(--bd)}
.ph{flex:none;width:64px;height:64px;border-radius:8px;background:var(--hv);border:1px solid var(--bd)}
.b{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;text-align:start}
.n{font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.m{font-size:12px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.p{font-weight:700;color:var(--fg)}
.w{font-size:12px;color:var(--mu)}
.s{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
`;
