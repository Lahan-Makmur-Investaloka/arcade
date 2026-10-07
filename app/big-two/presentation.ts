export const CAST=[
 {id:'timmy',name:'Timmy',color:'#38b9e9',value:'Terpercaya'},
 {id:'eldric',name:'Eldric',color:'#ffba43',value:'Eksploratif'},
 {id:'kirana',name:'Kirana',color:'#55d6a3',value:'Kolaboratif'},
 {id:'adelia',name:'Adelia',color:'#c39dff',value:'Adaptif'},
 {id:'dylan',name:'Dylan',color:'#ff5c76',value:'Determinasi'},
] as const;
export const ART='/big-two/';
export function seatCast(player:number){return [player,...Array.from({length:4},(_,i)=>(player+i+1)%5).slice(0,3)].map(i=>CAST[i]);}
export const RULES=[
 ['Tujuan','Habiskan 13 kartumu lebih dulu. Empat pemain bergiliran searah jarum jam.'],
 ['Pembukaan','Pemegang 3♦ memulai. Kartu itu harus ikut pada langkah pembuka.'],
 ['Urutan kartu','3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2. Untuk angka sama: ♦ < ♣ < ♥ < ♠.'],
 ['Cara membalas','Mainkan jumlah kartu yang sama dengan kombinasi yang lebih kuat, atau pilih Pass. Tidak ada two pair.'],
 ['Lima kartu','Straight < Flush < Full house < Four of a kind + 1 kartu < Straight flush.'],
 ['Straight','A–2–3–4–5 paling rendah, lalu 2–3–4–5–6. 10–J–Q–K–A paling tinggi. Tidak boleh berputar seperti Q–K–A–2–3.'],
 ['Penentu seri','Single dan pair: angka lalu lambang tertinggi. Straight: angka ujung lalu lambangnya. Flush: lambang dahulu, lalu angka. Full house: angka triple. Four of a kind: angka empat kartu.'],
 ['Setelah tiga Pass','Pemain yang terakhir membanting membuka putaran baru dengan kombinasi apa pun. Pemain yang Pass boleh membalas lagi saat gilirannya kembali.'],
 ['Skor ronde','Ronde selesai saat satu pemain habis. Sisa 1–9 kartu: −1 per kartu; 10–12: −2; 13: −3. Pemenang mendapat total poin lawan.'],
] as const;
