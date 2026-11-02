export function CommandIcon({name}:{name:'hint'|'clear'|'pass'|'play'|'sort'}){
 const paths={
  hint:'M9 18h6M10 21h4M8.5 14.5A6 6 0 1 1 15.5 14.5L15 16H9l-.5-1.5ZM12 2V1M3 5 1.5 3.5M21 5l1.5-1.5',
  clear:'M6 6l12 12M6 18 18 6',
  pass:'M8 12h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  play:'m9 3 11 4-5 14-11-4L9 3ZM10.5 7.5l5 2-2 6-5-2 2-6Z',
  sort:'M4 6h16M4 12h11M4 18h6',
 };
 return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
