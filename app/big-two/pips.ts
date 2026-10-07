// Traditional two-column playing-card layouts. Indices are separate from body pips.
export type Pip = readonly [x:number,y:number];
const rows=(ys:number[]):Pip[]=>ys.flatMap(y=>[[25,y],[75,y]] as Pip[]);
export const PIP_LAYOUTS:Record<string,readonly Pip[]>={
 'A':[[50,50]],
 '2':[[50,12],[50,88]],
 '3':[[50,12],[50,50],[50,88]],
 '4':rows([12,88]),
 '5':[...rows([12,88]),[50,50]],
 '6':rows([12,50,88]),
 '7':[...rows([12,50,88]),[50,31]],
 '8':[...rows([12,50,88]),[50,31],[50,69]],
 '9':[...rows([12,37,63,88]),[50,50]],
 '10':[...rows([12,37,63,88]),[50,25],[50,75]],
};
