// Server-only bank. The first option is canonical; engine randomizes all options per session.
import { addExpansion450 } from './expansion-450.mjs';
// Original Indonesian wording; sources link to primary reference material.
export const QUESTIONS=[];
function add(tier,category,source,lines){for(const line of lines.trim().split('\n')){const [text,a,b,c,d,explanation,hint]=line.split('|');QUESTIONS.push({id:`qw-${QUESTIONS.length+1}`,tier,category,text,options:[a,b,c,d],explanation,hint,source});}}
const nasa=(planet,path='facts')=>({title:`NASA · ${planet}`,url:`https://science.nasa.gov/${planet}/${path}/`});
const si={title:'BIPM · Satuan dasar SI',url:'https://www.bipm.org/en/measurement-units/si-base-units'};
const water={title:'USGS · Siklus air',url:'https://www.usgs.gov/water-science-school/water-cycle'};
const glossary={title:'USGS · Istilah siklus air',url:'https://www.usgs.gov/glossary/glossary-water-cycle-terms'};
const density={title:'USGS · Massa jenis air',url:'https://www.usgs.gov/water-science-school/science/water-density'};
const mdn=(page)=>({title:`MDN · ${page}`,url:`https://developer.mozilla.org/en-US/docs/Glossary/${page}`});
const heritage=(id,title)=>({title:`UNESCO · ${title}`,url:`https://whc.unesco.org/en/list/${id}/`});
add(1,'Antariksa',nasa('mercury'),`
Planet paling dekat dengan Matahari adalah…|Merkurius|Venus|Mars|Jupiter|Orbit Merkurius berada paling dekat dengan Matahari.|Cari planet sebelum Venus.
`);
add(2,'Antariksa',nasa('mercury'),`
Satu tahun Merkurius berlangsung sekitar berapa hari Bumi?|88|365|225|687|Merkurius menyelesaikan orbit dalam sekitar 88 hari Bumi.|Orbit dekat Matahari berlangsung singkat.
`);
add(3,'Antariksa',nasa('mercury'),`
Lapisan gas sangat tipis di Merkurius disebut…|Eksosfer|Hidrosfer|Litosfer|Biosfer|Merkurius memiliki eksosfer yang sangat tipis.|Istilahnya juga dipakai untuk bagian terluar atmosfer.
`);
add(1,'Antariksa',nasa('venus','venus-facts'),`
Planet terpanas di Tata Surya adalah…|Venus|Merkurius|Mars|Neptunus|Atmosfer tebal Venus menahan panas sangat kuat.|Terbaik menahan panas, bukan paling dekat Matahari.
`);
add(2,'Antariksa',nasa('venus','venus-facts'),`
Gas utama atmosfer Venus adalah…|Karbon dioksida|Oksigen|Helium|Hidrogen|Atmosfer Venus didominasi karbon dioksida.|Gas ini juga dikenal dalam pembahasan efek rumah kaca.
`);
add(3,'Antariksa',nasa('venus','venus-facts'),`
Dibanding satu tahun Venus, satu rotasi Venus pada porosnya berlangsung…|Lebih lama|Setengahnya|Sama lama|Sepersepuluhnya|Rotasi Venus sekitar 243 hari Bumi; orbitnya sekitar 225 hari.|Bandingkan 243 dengan 225.
`);
add(1,'Antariksa',nasa('mars'),`
Planet yang dijuluki Planet Merah adalah…|Mars|Saturnus|Bumi|Uranus|Permukaan Mars mengandung mineral besi teroksidasi yang memberi warna kemerahan.|Warnanya mengingatkan pada karat.
`);
add(2,'Antariksa',nasa('mars'),`
Phobos dan Deimos adalah satelit alami planet…|Mars|Bumi|Venus|Merkurius|Kedua satelit kecil tersebut mengorbit Mars.|Induknya dikenal sebagai Planet Merah.
`);
add(3,'Antariksa',nasa('mars'),`
Olympus Mons berada di planet…|Mars|Venus|Merkurius|Bumi|Olympus Mons adalah gunung berapi raksasa di Mars.|Planetnya memiliki dua bulan kecil.
`);
add(1,'Antariksa',nasa('jupiter','jupiter-facts'),`
Planet terbesar di Tata Surya adalah…|Jupiter|Saturnus|Neptunus|Bumi|Jupiter merupakan planet terbesar dalam Tata Surya.|Planet ini berada setelah Mars.
`);
add(2,'Antariksa',nasa('jupiter','jupiter-facts'),`
Bintik Merah Besar di Jupiter merupakan…|Badai raksasa|Gunung berapi|Kawah padat|Lautan lava|Bintik Merah Besar adalah sistem badai di atmosfer Jupiter.|Jupiter merupakan planet gas.
`);
add(3,'Antariksa',nasa('jupiter','jupiter-facts'),`
Satelit terbesar di Tata Surya adalah…|Ganymede|Titan|Bulan|Europa|Ganymede, satelit Jupiter, adalah yang terbesar di Tata Surya.|Satelit ini mengorbit planet terbesar.
`);
add(1,'Antariksa',nasa('saturn'),`
Planet dengan sistem cincin paling mencolok adalah…|Saturnus|Mars|Venus|Merkurius|Saturnus dikenal lewat cincin lebar dan terangnya.|Planetnya berada setelah Jupiter.
`);
add(2,'Antariksa',nasa('saturn'),`
Sebagian besar bahan cincin Saturnus berupa…|Es dengan batuan dan debu|Besi cair|Gas oksigen|Air cair|Cincin Saturnus tersusun terutama dari potongan es, disertai batuan dan debu.|Bahan utamanya membeku.
`);
add(3,'Antariksa',nasa('saturn'),`
Massa jenis rata-rata Saturnus dibandingkan air adalah…|Lebih rendah|Sama persis|Dua kali lebih tinggi|Sepuluh kali lebih tinggi|Saturnus memiliki massa jenis rata-rata lebih rendah daripada air.|Ukuran besar tidak selalu berarti padat.
`);
add(1,'Sains sehari-hari',water,`
Perubahan air cair menjadi uap disebut…|Penguapan|Pembekuan|Pengembunan|Pencairan|Penguapan mengubah air cair menjadi gas.|Terjadi saat jemuran mengering.
Air yang turun dari awan sebagai hujan termasuk…|Presipitasi|Infiltrasi|Transpirasi|Sublimasi|Presipitasi adalah air yang jatuh dari atmosfer ke permukaan.|Istilah ini juga mencakup salju.
`);
add(2,'Sains sehari-hari',water,`
Uap air menjadi titik air pada gelas dingin melalui…|Kondensasi|Sublimasi|Infiltrasi|Transpirasi|Kondensasi mengubah uap air menjadi cairan.|Arah perubahan berlawanan dengan penguapan.
`);
add(2,'Sains sehari-hari',glossary,`
Masuknya air dari permukaan ke dalam tanah disebut…|Infiltrasi|Presipitasi|Kondensasi|Sublimasi|Infiltrasi terjadi saat air meresap ke tanah.|Perhatikan arah gerak air: ke dalam tanah.
Pelepasan uap air oleh tumbuhan disebut…|Transpirasi|Sedimentasi|Kristalisasi|Infiltrasi|Tumbuhan melepas uap air melalui proses transpirasi.|Daun menjadi salah satu jalurnya.
`);
add(3,'Sains sehari-hari',glossary,`
Perubahan es langsung menjadi uap tanpa mencair disebut…|Sublimasi|Kondensasi|Infiltrasi|Presipitasi|Sublimasi mengubah padatan langsung menjadi gas.|Perubahan ini melewati fase cair.
`);
add(1,'Sains sehari-hari',density,`
Es dapat mengapung di air karena massa jenisnya…|Lebih rendah daripada air cair|Lebih tinggi daripada air cair|Selalu nol|Sama dengan besi|Es kurang padat dibanding air cair sehingga mengapung.|Bandingkan massa pada volume yang sama.
`);
add(3,'Sains sehari-hari',density,`
Rumus massa jenis adalah…|Massa dibagi volume|Volume dibagi massa|Massa dikali waktu|Volume dikali waktu|Massa jenis menyatakan massa per satuan volume.|Satuannya dapat berupa kg per meter kubik.
`);
add(1,'Pengukuran',si,`
Satuan dasar SI untuk panjang adalah…|Meter|Liter|Gram|Detik|Meter digunakan sebagai satuan dasar panjang.|Penggaris mengukur besaran ini.
Satuan dasar SI untuk massa adalah…|Kilogram|Newton|Liter|Watt|Satuan dasar massa dalam SI adalah kilogram.|Bedakan massa dari gaya berat.
`);
add(2,'Pengukuran',si,`
Satuan dasar SI untuk arus listrik adalah…|Ampere|Volt|Ohm|Watt|Ampere merupakan satuan dasar arus listrik.|Simbol satuannya adalah A.
`);
add(3,'Pengukuran',si,`
Satuan dasar SI untuk intensitas cahaya adalah…|Candela|Lux|Lumen|Watt|Intensitas cahaya menggunakan satuan dasar candela.|Simbolnya cd.
`);
add(1,'Warisan Indonesia',heritage(592,'Borobudur'),`
Borobudur merupakan candi bercorak…|Buddha|Hindu|Romawi|Yunani|Borobudur adalah monumen Buddha di Jawa Tengah.|Stupa menjadi salah satu ciri bangunannya.
`);
add(2,'Warisan Indonesia',heritage(592,'Borobudur'),`
Borobudur berada di provinsi…|Jawa Tengah|Jawa Barat|Jawa Timur|Bali|Kompleks Borobudur berada di Jawa Tengah.|Lokasinya berada di kawasan Magelang.
`);
add(3,'Warisan Indonesia',heritage(592,'Borobudur'),`
Berapa stupa berlubang yang mengelilingi stupa utama Borobudur?|72|27|108|45|Bagian atas Borobudur memiliki 72 stupa berlubang.|Jumlahnya kelipatan delapan dan sembilan.
`);
add(1,'Warisan Indonesia',heritage(642,'Prambanan'),`
Prambanan merupakan kompleks candi bercorak…|Hindu|Buddha|Romawi|Mesir Kuno|Prambanan merupakan kompleks candi Hindu.|Tiga dewa utamanya antara lain Siwa.
`);
add(2,'Warisan Indonesia',heritage(642,'Prambanan'),`
Relief Prambanan menggambarkan epos…|Ramayana|Iliad|Odyssey|Gilgamesh|Relief Prambanan memuat kisah Ramayana.|Kisah Rama dan Sinta.
`);
add(3,'Warisan Indonesia',heritage(642,'Prambanan'),`
Tiga candi utama Prambanan dipersembahkan untuk…|Siwa, Wisnu, Brahma|Zeus, Hera, Apollo|Ra, Osiris, Isis|Odin, Thor, Loki|Kompleks utama Prambanan memuliakan Siwa, Wisnu, dan Brahma.|Cari tiga dewa dalam tradisi Hindu.
`);
add(1,'Alam Indonesia',heritage(609,'Taman Nasional Komodo'),`
Komodo termasuk kelompok hewan…|Reptil|Mamalia|Amfibi|Burung|Komodo merupakan kadal besar, bagian dari reptil.|Kulit bersisik merupakan salah satu petunjuk.
`);
add(2,'Alam Indonesia',heritage(609,'Taman Nasional Komodo'),`
Pulau mana termasuk tiga pulau utama Taman Nasional Komodo?|Padar|Madura|Bangka|Bintan|Tiga pulau utamanya adalah Komodo, Rinca, dan Padar.|Pulau ini berada dekat Rinca.
`);
add(3,'Alam Indonesia',heritage(609,'Taman Nasional Komodo'),`
Taman Nasional Komodo berada di antara pulau…|Sumbawa dan Flores|Jawa dan Sumatra|Bali dan Jawa|Sulawesi dan Papua|Kompleks kepulauan ini terletak di antara Sumbawa dan Flores.|Keduanya berada di Nusa Tenggara.
`);
add(1,'Teknologi',mdn('HTML'),`
HTML terutama digunakan untuk menentukan…|Struktur konten web|Tegangan listrik|Kecepatan prosesor|Kapasitas baterai|HTML memberi struktur dan makna pada konten halaman web.|Pikirkan judul, paragraf, dan tautan.
`);
add(2,'Teknologi',mdn('HTML'),`
Kepanjangan HTML adalah…|HyperText Markup Language|High Transfer Machine Link|Hyper Tool Memory Logic|Host Terminal Main Language|HTML adalah singkatan HyperText Markup Language.|HTML merupakan bahasa markup.
`);
add(1,'Teknologi',mdn('CSS'),`
Teknologi yang mengatur warna dan tata letak halaman web adalah…|CSS|DNS|SMTP|USB|CSS mengatur penyajian visual dokumen web.|Nama lengkapnya menyebut lembar gaya.
`);
add(3,'Teknologi',mdn('CSS'),`
Kepanjangan CSS adalah…|Cascading Style Sheets|Computer Storage System|Central Script Service|Coded Security Standard|CSS adalah Cascading Style Sheets.|Kata terakhirnya berarti lembaran.
`);
add(2,'Teknologi',mdn('DNS'),`
DNS membantu browser menerjemahkan nama domain menjadi…|Alamat IP|Kata sandi|Format gambar|Nomor seri layar|DNS memetakan nama domain ke sumber daya seperti alamat IP.|Alamat ini menunjuk tujuan di jaringan.
`);
add(3,'Teknologi',mdn('DNS'),`
Reverse DNS lookup mencari…|Nama domain dari alamat IP|Kata sandi dari nama pengguna|Warna dari kode gambar|Lokasi GPS dari baterai|Reverse DNS melakukan pemetaan balik dari IP ke nama domain.|Balik arah proses DNS biasa.
`);
add(2,'Teknologi',mdn('HTTP'),`
Huruf S pada HTTPS menunjukkan penggunaan koneksi…|Aman dengan enkripsi TLS|Tanpa internet|Khusus satelit|Selalu tanpa biaya|HTTPS menggunakan saluran TLS untuk mengamankan transportasi HTTP.|Perlindungan berlaku pada komunikasi data.
`);
add(3,'Teknologi',mdn('HTTP'),`
Protokol yang mengamankan saluran HTTPS adalah…|TLS|FTP|SMTP|DHCP|HTTPS mengangkut HTTP melalui saluran TLS.|Singkatannya berasal dari Transport Layer Security.
`);
add(1,'Dunia', {title:'PBB · Tentang PBB',url:'https://www.un.org/en/about-us'},`
Organisasi internasional yang disingkat PBB dalam bahasa Indonesia adalah…|Perserikatan Bangsa-Bangsa|Perhimpunan Bank Bersama|Persatuan Benua Barat|Pusat Bahasa Bersama|PBB adalah nama Indonesia untuk United Nations.|Organisasi ini mempertemukan berbagai negara.
`);
add(2,'Dunia',{title:'PBB · Sejarah',url:'https://www.un.org/en/about-us/history-of-the-un'},`
PBB mulai berdiri pada tahun…|1945|1918|1965|1991|PBB resmi terbentuk pada 1945.|Tahun yang sama dengan berakhirnya Perang Dunia II.
`);
add(3,'Dunia',{title:'PBB · Bahasa resmi',url:'https://www.un.org/en/our-work/official-languages'},`
Manakah yang termasuk enam bahasa resmi PBB?|Arab|Jerman|Portugis|Jepang|Enam bahasa resminya: Arab, Mandarin, Inggris, Prancis, Rusia, dan Spanyol.|Bahasa ini banyak digunakan di Timur Tengah.
`);
add(1,'Antariksa',nasa('earth'),`
Planet tempat manusia tinggal berada pada urutan ke berapa dari Matahari?|Ketiga|Kedua|Keempat|Kelima|Bumi merupakan planet ketiga dari Matahari.|Hitung setelah Merkurius dan Venus.
`);
add(2,'Antariksa',nasa('earth'),`
Sekitar berapa persen permukaan Bumi tertutup air?|71%|21%|41%|91%|Air menutupi sekitar 71 persen permukaan Bumi.|Lebih dari dua pertiga permukaan.
`);
add(3,'Antariksa',nasa('earth'),`
Gas terbanyak di atmosfer Bumi adalah…|Nitrogen|Oksigen|Karbon dioksida|Argon|Nitrogen menyusun sekitar 78 persen atmosfer Bumi.|Gas terbanyak bukan gas yang dipakai tubuh untuk bernapas.
`);
add(1,'Antariksa',nasa('sun'),`
Matahari termasuk benda langit jenis…|Bintang|Planet|Satelit|Asteroid|Matahari merupakan bintang di pusat Tata Surya.|Benda ini menghasilkan energinya sendiri.
`);
add(2,'Antariksa',nasa('sun'),`
Energi Matahari terutama dihasilkan melalui…|Fusi nuklir|Pembakaran kayu|Gesekan planet|Pantulan Bulan|Inti Matahari menghasilkan energi melalui fusi nuklir.|Inti atom ringan bergabung.
`);
add(3,'Antariksa',nasa('sun'),`
Dalam fusi utama di inti Matahari, hidrogen berubah menjadi…|Helium|Besi|Uranium|Karbon dioksida|Fusi hidrogen menghasilkan helium serta melepaskan energi.|Unsur hasilnya memiliki nomor atom dua.
`);
add(1,'Antariksa',nasa('moon'),`
Bulan merupakan satelit alami…|Bumi|Matahari|Venus|Merkurius|Bulan mengorbit Bumi sebagai satelit alaminya.|Planet yang sama dengan tempat tinggal kita.
`);
add(2,'Antariksa',nasa('moon'),`
Mengapa dari Bumi kita melihat sisi Bulan yang hampir sama?|Rotasi dan orbitnya tersinkron|Bulan sama sekali tidak berputar|Bulan berbentuk datar|Bumi tidak berputar|Rotasi Bulan berlangsung seirama dengan orbitnya mengelilingi Bumi.|Satu putaran pada poros cocok dengan satu orbit.
`);
add(3,'Antariksa',nasa('uranus'),`
Planet yang poros rotasinya sangat miring sehingga tampak menggelinding adalah…|Uranus|Jupiter|Merkurius|Mars|Kemiringan poros Uranus sekitar 98 derajat.|Planet raksasa es sebelum Neptunus.
`);
add(1,'Antariksa',nasa('neptune'),`
Dari delapan planet, yang paling jauh dari Matahari adalah…|Neptunus|Jupiter|Saturnus|Mars|Neptunus menempati urutan kedelapan.|Planet ini berada setelah Uranus.
`);
add(2,'Antariksa',nasa('neptune'),`
Neptunus digolongkan sebagai…|Raksasa es|Planet kerdil|Planet batuan|Bintang merah|Neptunus dan Uranus termasuk raksasa es.|Kelompoknya sama dengan Uranus.
`);
add(3,'Antariksa',nasa('neptune'),`
Satu orbit Neptunus mengelilingi Matahari memakan sekitar…|165 tahun Bumi|12 tahun Bumi|29 tahun Bumi|1 tahun Bumi|Neptunus memerlukan sekitar 165 tahun Bumi untuk satu orbit.|Planet terluar memerlukan lebih dari satu abad.
`);
add(1,'Seni Indonesia',{title:'UNESCO · Wayang',url:'https://ich.unesco.org/en/RL/wayang-puppet-theatre-00063'},`
Orang yang memainkan dan membawakan cerita wayang disebut…|Dalang|Dirigen|Kurator|Arsitek|Dalang menggerakkan wayang dan membawakan pertunjukan.|Perannya menghidupkan tokoh-tokoh wayang.
`);
add(2,'Sains sehari-hari',{title:'USGS · Penguapan',url:'https://www.usgs.gov/water-science-school/science/evaporation-and-water-cycle'},`
Sumber energi utama yang menggerakkan penguapan dalam siklus air adalah…|Matahari|Cahaya Bulan|Pasang surut saja|Medan magnet saja|Energi Matahari menyediakan panas untuk penguapan air.|Sumber panas ini terasa pada siang hari.
`);
add(3,'Antariksa',{title:'NASA · Tata Surya',url:'https://science.nasa.gov/solar-system/solar-system-facts/'},`
Tata Surya berada dalam galaksi…|Bima Sakti|Andromeda|Triangulum|Sombrero|Tata Surya merupakan bagian dari galaksi Bima Sakti atau Milky Way.|Nama Inggrisnya mengandung kata susu.
`);
const rings={title:'IOC · Cincin Olimpiade',url:'https://www.olympics.com/ioc/olympic-rings'};
add(1,'Olahraga',rings,`
Berapa jumlah cincin pada lambang Olimpiade?|5|4|6|7|Lambang Olimpiade terdiri dari lima cincin saling terkait.|Tiga di atas dan dua di bawah.
`);
add(2,'Olahraga',rings,`
Warna yang tidak ada pada lima cincin Olimpiade adalah…|Ungu|Biru|Hijau|Merah|Cincin berwarna biru, kuning, hitam, hijau, dan merah.|Warna hasil campuran merah dan biru tidak dipakai.
`);
add(3,'Olahraga',{title:'IOC · Warna cincin',url:'https://www.olympics.com/en/news/which-colour-represents-asia-in-olympic-rings'},`
Menurut IOC, satu warna cincin Olimpiade mewakili satu benua tertentu. Pernyataan ini…|Tidak benar|Benar untuk semua warna|Benar hanya untuk biru|Benar hanya untuk merah|IOC tidak menetapkan satu warna cincin untuk satu benua tertentu.|Bedakan simbol keseluruhan dari arti tiap warna.
`);
add(2,'Olahraga',{title:'World Athletics · Marathon',url:'https://worldathletics.org/disciplines/road-running/marathon'},`
Jarak resmi lomba maraton adalah…|42,195 km|40 km|21,1 km|50 km|Maraton menempuh jarak resmi 42,195 kilometer.|Sedikit lebih dari 42 kilometer.
`);
const dna={title:'NHGRI · DNA',url:'https://www.genome.gov/genetics-glossary/Deoxyribonucleic-Acid-DNA'};
add(1,'Biologi',dna,`
Molekul yang menyimpan informasi genetik disebut…|DNA|Air|Glukosa|Garam|Urutan basa DNA menyimpan informasi biologis.|Singkatannya terdiri dari tiga huruf.
`);
add(2,'Biologi',dna,`
Bentuk DNA lazim digambarkan sebagai…|Heliks ganda|Kubus tunggal|Cincin persegi|Lempeng datar|Dua untai DNA melilit membentuk heliks ganda.|Bayangkan tangga yang terpilin.
`);
add(3,'Biologi',{title:'NHGRI · Pasangan basa',url:'https://www.genome.gov/genetics-glossary/Base-Pair'},`
Dalam DNA beruntai ganda, adenina berpasangan dengan…|Timina|Guanina|Sitosina|Uracil|Pasangan basa DNA adalah A–T dan C–G.|Pasangannya disingkat T.
`);
const zone={title:'BMKG · Tanda waktu Indonesia',url:'https://content.bmkg.go.id/wp-content/uploads/tanda_waktu_indonesia_rev4.pdf'};
add(1,'Indonesia',zone,`
Indonesia dibagi menjadi berapa zona waktu standar?|3|2|4|5|Indonesia menggunakan WIB, WITA, dan WIT.|Hitung singkatan WIB, WITA, WIT.
`);
add(2,'Indonesia',zone,`
Saat pukul 09.00 WIB, waktu di zona WIT adalah…|11.00|08.00|10.00|12.00|WIT dua jam lebih cepat daripada WIB.|Selisih UTC+9 dan UTC+7 adalah dua jam.
`);
add(3,'Indonesia',zone,`
Pukul 23.30 UTC pada hari Senin sama dengan waktu WITA…|Selasa 07.30|Senin 07.30|Selasa 08.30|Senin 15.30|WITA adalah UTC+8; tambah delapan jam dan ganti hari.|Perhatikan pergantian tengah malam.
`);
const pacific={title:'NOAA · Samudra Pasifik',url:'https://oceanexplorer.noaa.gov/ocean-fact/pacific-size/'};
add(1,'Geografi',pacific,`
Samudra terluas di Bumi adalah…|Pasifik|Atlantik|Hindia|Arktik|Pasifik merupakan cekungan samudra terluas di Bumi.|Membentang antara Asia dan Amerika.
`);
add(2,'Geografi',pacific,`
Samudra terluas kedua setelah Pasifik adalah…|Atlantik|Arktik|Hindia|Selatan|Atlantik menempati urutan kedua dalam luas samudra.|Berada antara Amerika dengan Eropa dan Afrika.
`);
add(3,'Geografi',{title:'NOAA · Palung Mariana',url:'https://www.ncei.noaa.gov/news/planet-postcard-mariana-trench'},`
Nama bagian laut terdalam yang dikenal di Palung Mariana adalah…|Challenger Deep|Java Deep|Puerto Rico Trench|Tonga Ridge|Challenger Deep terletak di Palung Mariana, Samudra Pasifik.|Namanya memakai kata yang berarti penantang.
`);
add(3,'Pangan',{title:'FAO · Legum dan pulses',url:'https://www.fao.org/world-pulses-day/news-detail/what-is-the-difference-between-legumes-and-pulses/en'},`
Istilah pangan “pulses” merujuk khusus pada…|Biji legum kering untuk pangan|Semua sayuran hijau|Semua biji penghasil minyak|Semua buah berbiji tunggal|Pulses adalah biji legum pangan yang dipanen kering, bukan tanaman yang terutama untuk minyak.|Kuncinya legum dan panen kering.
`);
add(1,'Cuaca',{title:'BMKG',url:'https://www.bmkg.go.id/'},`
Lembaga Indonesia yang memberikan prakiraan cuaca adalah…|BMKG|BPS|BPOM|BNN|BMKG menyediakan informasi cuaca, iklim, dan geofisika.|Nama lembaganya memuat kata Meteorologi.
`);
const food=(slug,title)=>({title:`Indonesia Travel · ${title}`,url:`https://www.indonesia.travel/gb/en/travel-ideas/gastronomy/${slug}`});
add(1,'Kuliner Indonesia',food('rendang-the-legendary-dish-from-west-sumatra','Rendang'),`
Rendang dikenal berasal dari tradisi daerah…|Sumatra Barat|Sulawesi Utara|Jawa Barat|Kalimantan Selatan|Rendang merupakan hidangan khas tradisi Minangkabau di Sumatra Barat.|Daerahnya terkenal dengan rumah gadang.
`);
add(1,'Kuliner Indonesia',food('papeda','Papeda'),`
Bahan utama papeda adalah…|Sagu|Terigu|Jagung|Kentang|Papeda dibuat dari sagu dan dikenal di Papua serta Maluku.|Pati dari pohon menjadi bahan dasarnya.
`);
add(2,'Kuliner Indonesia',food('yogyakarta---gudeg','Gudeg'),`
Bahan utama gudeg tradisional adalah…|Nangka muda|Pepaya muda|Durian muda|Mangga muda|Gudeg dibuat dengan nangka muda yang dimasak bersama bumbu.|Nama lokal bahan ini adalah gori.
`);
add(2,'Kuliner Indonesia',food('papeda-ikan-kuah-kuning','Ikan kuah kuning'),`
Bumbu pemberi warna kuning pada ikan kuah kuning adalah…|Kunyit|Kencur|Lengkuas|Jahe putih|Kunyit memberi warna khas kuah kuning.|Rimpang ini berwarna kuning jingga di bagian dalam.
`);
add(3,'Kuliner Indonesia',food('sago-flour','Tepung sagu'),`
Pati sagu diekstrak terutama dari bagian pohon…|Batang|Daun|Bunga|Kulit buah|Tepung sagu berasal dari pati di batang pohon sagu.|Bagian ini menjadi penyangga utama pohon.
`);
add(3,'Kuliner Indonesia',{title:'Indonesia Travel · Gudeg',url:'https://www.indonesia.travel/gb/en/destination/java/yogyakarta/gudeg'},`
Gudeg manggar memakai bahan khas berupa…|Bunga kelapa muda|Biji durian|Daun singkong|Kulit manggis|Manggar adalah bunga kelapa muda yang digunakan dalam varian gudeg.|Manggar berasal dari pohon kelapa.
`);
const reasoning={title:'Perhitungan dan penalaran soal orisinal TEKAD'};
add(1,'Logika & angka',reasoning,`
Empat kotak masing-masing berisi 6 pensil. Total pensilnya…|24|10|20|28|Empat kali enam sama dengan 24.|Kalikan jumlah kotak dengan isinya.
Separuh dari 90 adalah…|45|30|40|50|90 dibagi dua adalah 45.|Bagi menjadi dua bagian sama besar.
Rapat mulai 09.00 dan selesai 09.45. Durasinya…|45 menit|30 menit|60 menit|90 menit|Selisih waktu tersebut adalah 45 menit.|Jamnya sama, bandingkan menitnya.
Satu lusin berarti…|12 buah|10 buah|20 buah|24 buah|Lusin adalah satuan hitung berisi 12.|Dua lusin berisi 24.
Urutan naik 3, 6, 9, 12 dilanjutkan dengan…|15|14|16|18|Setiap langkah menambah tiga.|Tambahkan selisih yang tetap.
Ada 20 kursi dan 17 terisi. Kursi kosongnya…|3|2|4|7|20 dikurangi 17 sama dengan tiga.|Kurangi jumlah kursi yang terisi.
25% dari 100 adalah…|25|50|75|10|25 persen berarti 25 per seratus.|Angka dasarnya tepat seratus.
Dua setengah jam sama dengan…|150 menit|120 menit|130 menit|180 menit|2 × 60 + 30 = 150 menit.|Satu jam terdiri dari 60 menit.
Sebuah persegi memiliki berapa sisi?|4|3|5|6|Persegi memiliki empat sisi sama panjang.|Bayangkan batas kotak.
Dari bilangan berikut, mana yang genap?|18|13|17|21|18 habis dibagi dua.|Periksa digit terakhirnya.
Uang Rp50.000 dipakai Rp18.000. Sisanya…|Rp32.000|Rp28.000|Rp38.000|Rp42.000|50.000 − 18.000 = 32.000.|Kurangi 20.000 lalu tambahkan 2.000.
Tiga botol masing-masing 500 ml berisi total…|1.500 ml|1.000 ml|2.000 ml|750 ml|3 × 500 = 1.500 mililiter.|Jumlahkan isi ketiga botol.
Jika hari ini Rabu, dua hari lagi adalah…|Jumat|Kamis|Sabtu|Minggu|Satu hari kemudian Kamis, lalu Jumat.|Maju dua langkah dalam pekan.
Bangun yang tidak memiliki sudut adalah…|Lingkaran|Persegi|Segitiga|Trapesium|Tepi lingkaran melengkung tanpa sudut.|Bayangkan bentuk roda.
Nilai terbesar dari pilihan ini adalah…|0,8|0,08|0,18|0,5|0,8 sama dengan delapan per sepuluh.|Samakan banyak angka di belakang koma.
60 benda dibagi rata kepada 5 orang. Tiap orang mendapat…|12|10|15|20|60 ÷ 5 = 12.|Cari angka yang jika dikali lima menjadi 60.
Bilangan romawi V bernilai…|5|4|6|10|V adalah lambang bilangan lima.|X melambangkan dua kali nilai V.
Dari 10 tugas, 7 selesai. Persentase yang selesai…|70%|30%|7%|17%|7 dari 10 sama dengan 70 dari 100.|Kalikan pembilang dan penyebut dengan sepuluh.
Panjang 2 meter sama dengan…|200 cm|20 cm|2.000 cm|120 cm|Satu meter berisi 100 sentimeter.|Kalikan dua dengan seratus.
Jumlah sudut siku-siku pada persegi panjang adalah…|4|2|3|1|Keempat sudut persegi panjang adalah siku-siku.|Periksa setiap pojoknya.
Mana pecahan yang sama dengan setengah?|2/4|1/4|3/4|2/3|Dua dari empat bagian sama dengan satu dari dua.|Sederhanakan pembilang dan penyebut.
Tiga buku seharga Rp10.000 per buku dibayar Rp50.000. Kembaliannya…|Rp20.000|Rp10.000|Rp30.000|Rp40.000|Total 30.000, sehingga kembaliannya 20.000.|Hitung total belanja lebih dahulu.
`);
add(2,'Logika & angka',reasoning,`
Harga Rp80.000 didiskon 25%. Harga akhirnya…|Rp60.000|Rp55.000|Rp65.000|Rp75.000|Diskon 20.000; 80.000 − 20.000 = 60.000.|Seperempat harga dipotong.
Rata-rata dari 6, 8, dan 10 adalah…|8|7|9|12|Jumlah 24 dibagi tiga adalah delapan.|Jumlahkan lalu bagi banyak data.
Perbandingan teh dan air 1:4. Untuk 2 liter teh dibutuhkan air…|8 liter|4 liter|6 liter|10 liter|Jumlah air empat kali jumlah teh.|Gunakan faktor pengali yang sama.
Kendaraan melaju tetap 60 km/jam selama 1,5 jam. Jaraknya…|90 km|40 km|75 km|120 km|60 × 1,5 = 90 kilometer.|Jarak adalah kecepatan kali waktu.
Urutan 2, 4, 8, 16 dengan pola dikali dua dilanjutkan…|32|24|30|36|16 dikali dua sama dengan 32.|Gandakan suku terakhir.
Luas persegi panjang 8 m × 5 m adalah…|40 m²|26 m²|13 m²|80 m²|Luas = panjang × lebar = 40.|Jangan tertukar dengan keliling.
Peluang angka genap pada dadu biasa yang adil adalah…|1/2|1/6|1/3|2/3|Ada tiga angka genap dari enam kemungkinan.|Hitung 2, 4, dan 6.
Jika 3x + 5 = 20, nilai x adalah…|5|3|7|15|Kurangi lima lalu bagi tiga: x = 5.|Pisahkan x dari bilangan lain.
Barang naik dari 100 menjadi 120. Persentase kenaikannya…|20%|16%|25%|12%|Kenaikan 20 dibagi nilai awal 100 menjadi 20%.|Gunakan nilai awal sebagai pembagi.
Rapat 75 menit dimulai 13.40. Selesai pukul…|14.55|14.45|15.05|15.15|Tambah satu jam dan 15 menit menjadi 14.55.|75 menit adalah satu jam 15 menit.
Median dari 2, 4, 7, 9, 11 adalah…|7|6|8|9|Median adalah nilai tengah data terurut.|Ambil posisi ketiga.
Keliling persegi dengan sisi 7 cm adalah…|28 cm|49 cm|14 cm|21 cm|Keliling persegi = empat kali sisi.|Jumlahkan empat sisinya.
Dua pertiga dari 90 adalah…|60|30|45|75|90 dibagi tiga lalu dikali dua menjadi 60.|Cari sepertiganya terlebih dahulu.
Ada 5 merah dan 3 biru dalam kantong. Peluang mengambil biru secara acak…|3/8|3/5|5/8|1/3|Tiga benda biru dari delapan benda.|Jumlah seluruh benda menjadi penyebut.
12 pekerja dibagi menjadi kelompok berisi 3 orang. Ada…|4 kelompok|3 kelompok|6 kelompok|9 kelompok|12 ÷ 3 = 4 kelompok.|Bagi total orang dengan ukuran kelompok.
Satu berkas 2,5 MB. Empat berkas berukuran sama menjadi…|10 MB|6,5 MB|8 MB|12,5 MB|2,5 dikali empat sama dengan sepuluh.|Dua berkas berukuran lima MB.
Dari 40 orang, 15 naik bus. Berapa yang tidak naik bus?|25|20|15|35|40 − 15 = 25 orang.|Kurangi pengguna bus dari total.
Setelah diskon 10%, harga Rp200.000 menjadi…|Rp180.000|Rp190.000|Rp160.000|Rp170.000|Sepuluh persen 200.000 adalah 20.000.|Kurangi sepersepuluh harga awal.
Rasio 12:18 paling sederhana adalah…|2:3|3:4|4:5|1:2|Keduanya dibagi enam menghasilkan 2:3.|Gunakan faktor persekutuan terbesar.
Suhu naik dari −3°C menjadi 5°C. Kenaikannya…|8°C|2°C|5°C|−8°C|5 − (−3) = 8 derajat.|Hitung jarak melewati nol.
Sebuah segitiga bersudut 50° dan 60°. Sudut ketiganya…|70°|80°|90°|110°|Jumlah sudut segitiga 180°, jadi 180 − 110 = 70.|Jumlahkan dua sudut yang diketahui.
Mesin mencetak 8 lembar per menit. Dalam 7 menit tercetak…|56 lembar|48 lembar|54 lembar|64 lembar|8 × 7 = 56 lembar.|Kalikan laju dengan durasi.
`);
add(3,'Logika & angka',reasoning,`
Harga turun 20%, lalu naik 20% dari harga baru. Dibanding awal, harga akhirnya…|Turun 4%|Tetap|Naik 4%|Turun 8%|100 × 0,8 × 1,2 = 96, sehingga turun 4%.|Kenaikan dihitung dari harga yang sudah turun.
Dua dadu adil dilempar. Peluang jumlahnya 7 adalah…|1/6|1/12|1/3|7/36|Enam pasangan dari 36 hasil memberi jumlah tujuh.|Pasang 1 dengan 6, 2 dengan 5, dan seterusnya.
Pekerja A selesai 6 jam, B selesai 3 jam. Bersama dengan laju tetap perlu…|2 jam|3 jam|4 jam|4,5 jam|Laju gabungan 1/6 + 1/3 = 1/2 pekerjaan per jam.|Jumlahkan laju, bukan durasi.
Rata-rata empat nilai 80. Nilai kelima 100. Rata-rata barunya…|84|90|82|88|Total baru 320 + 100 = 420; dibagi lima menjadi 84.|Kembalikan rata-rata ke total dulu.
Suatu kode terdiri dari 3 digit 0–9, boleh berulang dan diawali nol. Banyak kode…|1.000|900|720|100|Tiap posisi punya sepuluh pilihan: 10³ = 1.000.|Pilihan setiap posisi saling bebas.
Harga setelah diskon 25% adalah Rp90.000. Harga awalnya…|Rp120.000|Rp112.500|Rp115.000|Rp135.000|90.000 adalah 75% harga awal; bagi 0,75 menjadi 120.000.|Harga yang tersisa adalah tiga perempat.
Dari 30 orang, 18 suka teh, 16 kopi, 8 keduanya. Tidak suka keduanya…|4 orang|2 orang|6 orang|8 orang|Penyuka minimal satu = 18 + 16 − 8 = 26; sisanya empat.|Jangan hitung penyuka keduanya dua kali.
Dua koin adil dilempar. Peluang minimal satu gambar…|3/4|1/2|1/4|1|Hanya angka–angka tidak memenuhi; tiga dari empat hasil memenuhi.|Gunakan satu dikurangi peluang tidak ada gambar.
Jarak pergi-pulang sama; kecepatan pergi 40, pulang 60 km/jam. Rata-ratanya…|48 km/jam|50 km/jam|45 km/jam|52 km/jam|Misalkan tiap arah 120 km: total 240 km dalam lima jam = 48.|Rata-rata kecepatan memakai total jarak dibagi total waktu.
Bunga sederhana 10% per tahun atas 1.000 poin selama 2 tahun menghasilkan saldo…|1.200 poin|1.210 poin|1.100 poin|1.020 poin|Tambahan tetap 100 poin tiap tahun, total 200.|Bunga sederhana tidak berbunga lagi.
Luas lingkaran berjari-jari 7 cm, dengan π = 22/7, adalah…|154 cm²|44 cm²|49 cm²|308 cm²|πr² = 22/7 × 49 = 154.|Gunakan kuadrat jari-jari, bukan diameter.
Tiga orang dipilih dari 5 orang tanpa memperhatikan urutan. Banyak cara…|10|15|20|60|Kombinasi 5 pilih 3 = 5!/(3!2!) = 10.|Urutan terpilih tidak membuat kelompok baru.
Sisi kubus menjadi dua kali semula. Volumenya menjadi…|8 kali|2 kali|4 kali|6 kali|Volume bergantung pangkat tiga: 2³ = 8.|Panjang, lebar, dan tinggi masing-masing berlipat dua.
Pola selisih ganjil 1, 4, 9, 16 dilanjutkan dengan…|25|24|26|32|Selisih 3, 5, 7, lalu 9 menghasilkan 25.|Bilangan-bilangan ini juga merupakan kuadrat.
Lima mesin membuat 5 benda dalam 5 menit. Sepuluh mesin identik membuat 10 benda dalam…|5 menit|10 menit|2,5 menit|20 menit|Tiap mesin membuat satu benda per lima menit; sepuluh mesin bekerja bersamaan.|Benda dan mesin bertambah dengan faktor sama.
Jika semua A adalah B dan tak ada B yang C, maka…|Tak ada A yang C|Semua C adalah A|Sebagian A pasti C|Semua B adalah A|A berada di dalam B, sedangkan B terpisah dari C.|Bayangkan himpunan yang berada dalam himpunan lain.
Pukul 03.30, sudut terkecil antara jarum jam dan menit adalah…|75°|90°|60°|105°|Jarum menit 180°, jarum jam 105°; selisihnya 75°.|Jarum jam sudah bergerak setengah jalan menuju empat.
Bilangan biner 1010 sama dengan desimal…|10|8|9|12|1×8 + 0×4 + 1×2 + 0×1 = 10.|Nilai tempat dari kanan: 1, 2, 4, 8.
Rasio A:B = 2:3 dan B:C = 4:5. Rasio A:C adalah…|8:15|2:5|3:5|4:15|Samakan B menjadi 12: A:B:C = 8:12:15.|Kalikan rasio pertama empat dan kedua tiga.
Dari 1 sampai 30, banyak kelipatan 3 atau 5 adalah…|14|16|12|15|Ada 10 kelipatan tiga, enam kelipatan lima, dan dua irisan: 14.|Kurangi kelipatan 15 yang dihitung dua kali.
Nilai x memenuhi 2(x − 3) = x + 7. Nilai x…|13|7|10|1|2x − 6 = x + 7, sehingga x = 13.|Pindahkan satu x ke kiri dan konstanta ke kanan.
Dari 4 merah dan 2 biru, diambil dua tanpa pengembalian. Peluang keduanya biru…|1/15|1/9|1/6|1/3|Peluangnya 2/6 × 1/5 = 1/15.|Jumlah benda berkurang setelah pengambilan pertama.
Sebuah nilai naik 50% menjadi 90. Agar kembali ke awal, 90 harus turun…|33⅓%|50%|25%|66⅔%|Nilai awal 60. Penurunan 30 dari 90 adalah sepertiga.|Pembagi persentase turun adalah 90.
`);

// Expansion 2: append-only IDs keep persisted runs compatible.
// Each trio contributes one question at each difficulty.
function trio(category,source,lines){lines.trim().split('\n').forEach((line,i)=>add(i+1,category,source,line));}
trio('Alam',{title:'Smithsonian · Ciri serangga',url:'https://naturalhistory.si.edu/education/teaching-resources/life-science/what-insect'},`
Serangga dewasa umumnya memiliki berapa kaki?|6|4|8|10|Serangga memiliki tiga pasang kaki.|Hitung tiga pasang.
Hewan mana yang bukan serangga?|Laba-laba|Semut|Kupu-kupu|Kumbang|Laba-laba memiliki delapan kaki, berbeda dari serangga.|Perhatikan jumlah kaki.
Urutan tiga bagian utama tubuh serangga dari depan adalah…|Kepala, toraks, abdomen|Toraks, kepala, abdomen|Kepala, abdomen, toraks|Abdomen, toraks, kepala|Toraks berada di antara kepala dan abdomen.|Bagian dada berada di tengah.
`);
trio('Bumi',{title:'USGS · Batuan beku',url:'https://www.usgs.gov/faqs/what-are-igneous-rocks'},`
Batuan yang terbentuk ketika lelehan batu mendingin dan memadat disebut…|Batuan beku|Batuan sedimen|Batuan metamorf|Tanah humus|Batuan beku berasal dari pembekuan lelehan batu.|Ingat proses dari cair menjadi padat.
Magma yang mencapai permukaan Bumi disebut…|Lava|Lahar|Humus|Lempung|Lelehan batu di permukaan disebut lava.|Bedakan lelehan batu dari aliran lumpur vulkanik.
Pendinginan magma perlahan di bawah tanah biasanya menghasilkan kristal…|Lebih besar|Selalu tak terlihat|Selalu berbentuk gas|Selalu larut dalam air|Pendinginan lambat memberi kristal waktu untuk tumbuh.|Pertimbangkan waktu pertumbuhan kristal.
`);
trio('Bumi',{title:'USGS · Batuan metamorf',url:'https://www.usgs.gov/faqs/what-are-metamorphic-rocks'},`
Marmer termasuk kelompok batuan…|Metamorf|Beku luar|Beku dalam|Sedimen klastik|Marmer merupakan contoh batuan metamorf.|Batuan ini telah mengalami perubahan.
Saat metamorfisme, batuan berubah terutama oleh panas dan tekanan tanpa…|Meleleh seluruhnya|Mengalami perubahan mineral|Menjadi lebih padat|Mengalami deformasi|Metamorfisme berlangsung tanpa peleburan batuan.|Bedakan metamorfisme dari pembentukan magma.
Susunan mineral sejajar yang memberi pola berlapis pada batuan metamorf disebut…|Foliasi|Evaporasi|Erosi|Sedimentasi|Foliasi terbentuk ketika mineral pipih atau memanjang tersusun sejajar.|Istilah ini terkait susunan seperti lembaran.
`);
trio('Bumi',{title:'USGS · Batuan sedimen',url:'https://www.usgs.gov/faqs/what-are-sedimentary-rocks'},`
Batuan dari endapan yang menumpuk lalu memadat termasuk batuan…|Sedimen|Beku dalam|Beku luar|Metamorf kontak|Batuan sedimen terbentuk dari endapan di permukaan.|Pikirkan pengendapan material.
Batuan sedimen klastik terutama tersusun dari…|Pecahan batuan sebelumnya|Kristal dari lava segar|Logam cair murni|Gas yang membeku|Klastik merujuk pada fragmen batuan yang mengalami pemadatan dan sementasi.|Kata kuncinya adalah fragmen.
Urutan ukuran butir dari paling halus ke paling kasar adalah…|Lempung, lanau, pasir|Pasir, lempung, lanau|Lanau, pasir, lempung|Lempung, pasir, lanau|Lempung lebih halus daripada lanau, dan lanau lebih halus daripada pasir.|Pasir berada di ujung paling kasar dari tiga pilihan bahan.
`);
trio('Laut',{title:'NOAA · Karang',url:'https://oceanservice.noaa.gov/facts/coral.html'},`
Karang yang hidup di laut termasuk…|Hewan|Tumbuhan berbunga|Jamur|Batuan tak hidup|Karang merupakan hewan meskipun biasanya menetap di satu tempat.|Diam di tempat tidak selalu berarti tumbuhan.
Banyak karang hidup bersimbiosis dengan organisme berupa…|Alga|Lumut darat|Pakis|Kaktus|Alga hidup di jaringan banyak karang dan membantu menyediakan makanan.|Organisme ini dapat melakukan fotosintesis.
Istilah sesil pada karang berarti…|Menetap melekat pada tempatnya|Selalu berenang bebas|Hanya hidup di udara|Tidak membutuhkan makanan|Hewan sesil hidup melekat pada substrat.|Bayangkan organisme yang tidak berpindah tempat secara aktif.
`);
trio('Laut',{title:'NOAA · Pasang purnama dan perbani',url:'https://oceanservice.noaa.gov/facts/springtide.html'},`
Naik-turunnya permukaan laut secara berkala dikenal sebagai…|Pasang surut|Abrasi|Sedimentasi|Pelapukan|Pasang surut merupakan perubahan ketinggian muka laut secara berkala.|Pikirkan air laut yang maju lalu mundur.
Pasang purnama atau spring tide terjadi sekitar fase…|Bulan baru dan purnama|Hanya kuartal pertama|Hanya kuartal ketiga|Hanya bulan sabit tipis|Pada bulan baru dan purnama, pengaruh pasang Matahari dan Bulan saling menguatkan.|Dua fase ini berada pada posisi segaris.
Pada pasang perbani, arah ke Matahari dan Bulan dari Bumi membentuk kira-kira…|Sudut 90°|Sudut 0°|Sudut 180°|Sudut 360°|Posisi bersudut siku-siku menghasilkan rentang pasang lebih kecil.|Ingat fase kuartal Bulan.
`);
trio('Alam',{title:'Smithsonian · Fakta kelelawar',url:'https://www.si.edu/spotlight/bats/batfacts'},`
Kelelawar termasuk kelompok…|Mamalia|Burung|Reptil|Amfibi|Kelelawar adalah mamalia yang mampu terbang aktif.|Sayap tidak selalu menandakan burung.
Pernyataan yang benar tentang penglihatan kelelawar adalah…|Kelelawar dapat melihat|Semua kelelawar buta|Matanya hanya hiasan|Hanya anaknya dapat melihat|Anggapan bahwa semua kelelawar buta adalah keliru.|Kemampuan memakai suara tidak menghilangkan penglihatan.
Ekolokasi pada kelelawar pemakan serangga memanfaatkan…|Pantulan suara|Pantulan sinar ultraviolet saja|Perubahan warna sayap|Medan listrik dari tanah|Kelelawar mengirim suara dan menerima gemanya untuk mendeteksi objek.|Bayangkan prinsip sonar.
`);
trio('Alam',{title:'Australian Museum · Platipus',url:'https://australian.museum/learn/animals/mammals/platypus/'},`
Mamalia yang berkembang biak dengan bertelur adalah…|Platipus|Kucing|Kuda|Paus|Platipus termasuk mamalia bertelur.|Hewan ini memiliki moncong menyerupai paruh.
Platipus dan ekidna termasuk kelompok mamalia bernama…|Monotremata|Marsupialia|Primata|Cetacea|Monotremata adalah kelompok mamalia bertelur.|Kelompok ini berbeda dari mamalia berkantung.
Taji berbisa platipus jantan terdapat pada…|Tungkai belakang|Ujung paruh|Ujung ekor|Punggung|Taji yang terhubung dengan kelenjar bisa berada di sekitar pergelangan tungkai belakang.|Letaknya dekat tumit.
`);
trio('Laut',{title:'Smithsonian · Sefalopoda',url:'https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives'},`
Gurita memiliki berapa lengan?|8|6|10|12|Gurita memiliki delapan lengan.|Nama octopus mengandung petunjuk angka.
Berapa jantung yang dimiliki gurita?|3|1|2|4|Dua jantung mengalirkan darah ke insang, satu ke tubuh.|Ada pembagian tugas antara insang dan tubuh.
Unsur logam pada hemosianin yang terkait darah biru gurita adalah…|Tembaga|Besi|Emas|Aluminium|Hemosianin menggunakan tembaga untuk mengikat oksigen.|Berbeda dari besi pada hemoglobin manusia.
`);
trio('Alam',{title:'Smithsonian · Penguin',url:'https://ocean.si.edu/ocean-life/seabirds/penguins'},`
Penguin termasuk kelompok hewan…|Burung|Ikan|Mamalia|Reptil|Penguin merupakan burung laut berbulu.|Perhatikan bulu dan telurnya.
Lapisan yang berperan besar mengisolasi panas tubuh penguin adalah…|Bulu|Sisik keras|Cangkang|Rambut panjang|Bulu penguin membantu menjaga panas tubuh.|Penutup tubuhnya merupakan ciri burung.
Pertukaran panas arus berlawanan pada penguin membantu menghangatkan…|Darah dingin yang kembali dari kaki|Air laut di sekeliling tubuh|Udara di luar sarang|Seluruh bongkahan es|Darah hangat menuju kaki memindahkan panas ke darah yang kembali.|Dua aliran darah saling bertukar panas.
`);
trio('Budaya Dunia',heritage(274,'Machu Picchu'),`
Machu Picchu merupakan peninggalan peradaban…|Inka|Romawi|Mesir Kuno|Viking|Machu Picchu dibangun dalam peradaban Inka.|Peradaban ini berkembang di Amerika Selatan.
Machu Picchu berada di kawasan pegunungan…|Andes|Alpen|Himalaya|Atlas|Situs ini berada di lereng timur Andes.|Pilih pegunungan Amerika Selatan.
Ketinggian Machu Picchu menurut UNESCO sekitar…|2.430 meter|430 meter|7.430 meter|10.430 meter|UNESCO mencatat lokasi Machu Picchu sekitar 2.430 meter di atas laut.|Lebih dari dua kilometer, tetapi bukan tujuh.
`);
trio('Budaya Dunia',heritage(326,'Petra'),`
Kota kuno yang terkenal dengan bangunan dipahat pada tebing adalah…|Petra|Venesia|Amsterdam|Kyoto|Sebagian bangunan Petra dipahat langsung pada batu.|Situs ini dikenal sebagai kota batu.
Petra merupakan kota karavan penting bangsa…|Nabatea|Aztek|Inka|Maya|Bangsa Nabatea mengembangkan Petra sebagai pusat jalur karavan.|Pilih bangsa dari kawasan Arabia.
Petra terletak di antara dua laut yaitu…|Laut Merah dan Laut Mati|Laut Hitam dan Laut Kaspia|Laut Jawa dan Laut Banda|Laut Baltik dan Laut Utara|Letak ini membantu Petra menjadi persimpangan perdagangan.|Keduanya berada di kawasan Timur Tengah.
`);
trio('Budaya Dunia',heritage(252,'Taj Mahal'),`
Taj Mahal berada di negara…|India|Pakistan|Nepal|Iran|Taj Mahal berada di Agra, India.|Negara ini juga memiliki kota Mumbai.
Bahan putih utama mausoleum Taj Mahal adalah…|Marmer|Kayu|Tanah liat|Bambu|Taj Mahal terkenal sebagai mausoleum marmer putih.|Bahan ini juga sering digunakan untuk patung.
Kaisar Mughal yang memerintahkan pembangunan Taj Mahal adalah…|Shah Jahan|Akbar|Babur|Aurangzeb|Shah Jahan membangunnya untuk mengenang istrinya.|Namanya terdiri dari dua kata dan diawali Shah.
`);
trio('Budaya Dunia',heritage(668,'Angkor'),`
Angkor Wat merupakan bagian dari situs…|Angkor|Petra|Pompeii|Machu Picchu|Angkor Wat adalah salah satu kuil terkenal di Angkor.|Nama kawasan muncul dalam nama kuil.
Situs Angkor berkaitan dengan kerajaan…|Khmer|Mughal|Inka|Romawi|Angkor menyimpan peninggalan ibu kota Kerajaan Khmer.|Kerajaan ini berkembang di Asia Tenggara.
Kuil Bayon berada di bagian Angkor yang bernama…|Angkor Thom|Tikal|Bagan|Sukhothai|Bayon merupakan kuil di Angkor Thom.|Namanya masih menggunakan kata Angkor.
`);
trio('Budaya Dunia',heritage(438,'Tembok Besar'),`
Fungsi utama Tembok Besar pada masa pembangunannya adalah…|Pertahanan|Saluran air|Lintasan balap|Observatorium|Benteng-bentengnya membentuk sistem pertahanan.|Pikirkan fungsi tembok militer.
Penguasa yang menyatukan bagian benteng sekitar 220 SM adalah…|Qin Shi Huang|Kublai Khan|Sun Yat-sen|Puyi|Penyatuan benteng awal dilakukan pada masa Qin Shi Huang.|Tokoh ini dikenal sebagai kaisar pertama Tiongkok bersatu.
Pembangunan Tembok Besar berlanjut hingga dinasti yang berkuasa 1368–1644, yaitu…|Ming|Han|Tang|Song|Pembangunannya berlanjut sampai Dinasti Ming.|Dinasti ini mendahului Qing.
`);
trio('Geografi',heritage(1,'Galapagos'),`
Galapagos merupakan sebuah…|Kepulauan|Gurun|Pegunungan daratan|Sungai|Galapagos terdiri dari pulau-pulau dan pulau kecil.|Nama ini merujuk pada sekumpulan pulau.
Kepulauan Galapagos termasuk wilayah negara…|Ekuador|Peru|Brasil|Meksiko|Galapagos berada sekitar 1.000 km dari daratan Ekuador.|Negara ini berada dekat khatulistiwa.
Galapagos terletak sekitar berapa kilometer dari daratan Ekuador?|1.000 km|10 km|100 km|10.000 km|UNESCO menyebut jaraknya sekitar 1.000 km.|Jaraknya kira-kira seribu kilometer.
`);
trio('Geografi',heritage(28,'Yellowstone'),`
Fenomena semburan air panas yang terkenal di Yellowstone disebut…|Geiser|Delta|Stalaktit|Gletser|Yellowstone terkenal dengan konsentrasi geiser.|Semburannya berasal dari panas bawah tanah.
Sebagian besar Yellowstone berada di negara bagian AS…|Wyoming|Florida|Texas|Hawaii|Sekitar 96% kawasan Yellowstone terletak di Wyoming.|Pilih negara bagian pedalaman barat AS.
Yellowstone ditetapkan sebagai taman nasional pada tahun…|1872|1772|1927|1972|Yellowstone berdiri sebagai taman nasional pada 1872.|Tahun tersebut berada pada abad ke-19.
`);
trio('Budaya Dunia',heritage(404,'Akropolis Athena'),`
Akropolis yang terkenal dengan Parthenon berada di kota…|Athena|Roma|Madrid|Paris|Parthenon berada di Akropolis Athena.|Pilih kota Yunani.
Bangunan mana merupakan bagian dari Akropolis Athena?|Parthenon|Colosseum|Pantheon Roma|Alhambra|Parthenon adalah salah satu monumen utama Akropolis.|Namanya mirip Pantheon, tetapi berbeda situs.
Gerbang monumental Akropolis Athena disebut…|Propylaea|Colosseum|Hagia Sophia|Alcazar|Propylaea merupakan pintu masuk monumental yang dirancang Mnesicles.|Istilah ini berhubungan dengan gerbang.
`);
trio('Budaya Dunia',heritage(715,'Rapa Nui'),`
Patung batu besar di Rapa Nui dikenal dengan nama…|Moai|Totem|Obelisk|Menara|Moai menjadi ciri khas peninggalan Rapa Nui.|Namanya terdiri dari empat huruf.
Rapa Nui merupakan nama asli pulau yang juga disebut…|Pulau Paskah|Pulau Komodo|Pulau Bali|Pulau Madagaskar|Rapa Nui dikenal pula sebagai Easter Island atau Pulau Paskah.|Nama alternatifnya terkait sebuah perayaan.
Sebagian besar moai dipahat dari bahan…|Tuf vulkanik|Granit merah|Batu bara|Es padat|UNESCO menyebut tuf vulkanik sebagai bahan utama banyak moai.|Material ini berasal dari aktivitas gunung api.
`);
trio('Budaya Dunia',heritage(166,'Sydney Opera House'),`
Sydney Opera House terutama digunakan untuk…|Pertunjukan seni|Pabrik kapal|Stasiun kereta|Tambang|Gedung ini memiliki ruang pertunjukan utama.|Namanya memberi petunjuk seni panggung.
Arsitek perancang Sydney Opera House adalah…|Jørn Utzon|Antoni Gaudí|Frank Lloyd Wright|Le Corbusier|Desain Jørn Utzon dipilih melalui kompetisi internasional.|Arsitek ini berasal dari Denmark.
Desain Utzon untuk Sydney Opera House dipilih juri pada tahun…|1957|1857|1927|1997|Kompetisi desain menghasilkan pilihan Utzon pada 1957.|Terjadi pada dekade 1950-an.
`);
trio('Teknologi',mdn('URL'),`
Alamat halaman yang tampil pada bilah alamat browser disebut…|URL|RAM|CPU|GPU|URL menunjukkan lokasi sumber daya di internet.|Istilah ini juga sering disebut alamat web.
Kepanjangan URL adalah…|Uniform Resource Locator|Universal Random Link|Unified Reading Language|User Routing List|URL merupakan singkatan Uniform Resource Locator.|Huruf L menunjuk pada penentu lokasi.
Selain halaman web, URL dapat menunjuk langsung ke…|Gambar atau video|Hanya tombol fisik|Hanya nama pemilik komputer|Hanya kapasitas baterai|URL dapat menentukan lokasi berbagai sumber daya internet.|Sumber daya web tidak terbatas pada halaman teks.
`);
trio('Teknologi',mdn('Cookie'),`
Dalam browser, cookie adalah…|Potongan data kecil dari situs|Virus yang selalu berbahaya|Jenis kabel internet|Komponen prosesor|Situs dapat menyimpan informasi kecil melalui browser sebagai cookie.|Namanya makanan, tetapi konteksnya data web.
Contoh penggunaan cookie yang wajar adalah menyimpan…|Preferensi pengguna situs|Suhu prosesor secara fisik|Daya listrik rumah|Kecepatan kipas laptop|Cookie dapat membantu situs mengingat preferensi pengunjung.|Pikirkan pilihan yang ingin diingat situs.
Header respons HTTP untuk meminta browser menyimpan cookie adalah…|Set-Cookie|Content-Type|Accept-Language|Location|Server memakai header Set-Cookie untuk menetapkan cookie.|Namanya secara langsung menyebut cookie.
`);
trio('Teknologi',mdn('Cacheable'),`
Salinan data yang disimpan agar bisa digunakan lagi membantu mengurangi…|Pengambilan ulang data|Ukuran layar fisik|Jumlah tombol keyboard|Daya tampung baterai|Cache memungkinkan respons tersimpan digunakan kembali.|Pikirkan pekerjaan yang tidak perlu diulang.
Respons HTTP yang dapat disimpan untuk dipakai lagi disebut…|Cacheable|Executable|Printable|Bootable|Cacheable berarti respons memenuhi syarat untuk disimpan dalam cache.|Istilahnya berasal dari kata cache.
Pernyataan tentang cache respons HTTP yang benar adalah…|Tidak semua respons dapat di-cache|Semua respons wajib di-cache|Cache selalu menghapus server|Cache hanya untuk audio|Ada ketentuan yang menentukan apakah respons boleh di-cache.|Penyimpanan ulang memerlukan syarat tertentu.
`);
trio('Teknologi',mdn('Lossless_compression'),`
Kompresi lossless memungkinkan data asli dikembalikan…|Secara utuh|Hanya separuh|Tanpa warna|Sebagai teks saja|Lossless mempertahankan seluruh informasi data asli.|Lossless berarti tanpa kehilangan data.
Format gambar yang memakai kompresi lossless adalah…|PNG|MP3|AAC|JPEG biasa|PNG menggunakan kompresi yang memungkinkan data gambar dipulihkan utuh.|Pilih format gambar, bukan audio.
Arsip harus dapat dipulihkan persis sama. Sifat kompresi yang diperlukan adalah…|Reversibel|Membuang data permanen|Menurunkan resolusi wajib|Menghapus detail warna|Kompresi lossless dapat dibalik untuk memperoleh data semula.|Pikirkan proses yang bisa dibalik sepenuhnya.
`);
trio('Teknologi',mdn('Lossy_compression'),`
Kompresi lossy dapat mengurangi ukuran berkas dengan…|Membuang sebagian informasi|Menambah semua detail|Menggandakan data|Memperbesar resolusi otomatis|Lossy menggunakan pendekatan dan penghilangan sebagian data.|Istilah loss menunjukkan adanya kehilangan.
Dampak yang mungkin muncul dari kompresi lossy adalah…|Penurunan kualitas|Layar menjadi lebih besar|Baterai bertambah kapasitas|Kabel berubah jenis|Hilangnya informasi dapat memengaruhi kualitas hasil.|Perhatikan detail yang dibuang.
Mengubah hasil lossy ke format lossless akan…|Tetap tidak memulihkan data yang telah hilang|Mengembalikan semua detail asli|Membatalkan seluruh kompresi sebelumnya|Selalu menggandakan resolusi asli|Format baru tidak menciptakan kembali informasi asli yang telah dibuang.|Wadah baru tidak mengembalikan isi yang hilang.
`);
trio('Teknologi',mdn('JSON'),`
JSON terutama merupakan format untuk…|Pertukaran data|Pendinginan prosesor|Penyimpanan listrik|Penguatan sinyal radio|JSON dipakai untuk merepresentasikan dan bertukar data.|Bayangkan data yang dikirim antaraplikasi.
Kepanjangan JSON adalah…|JavaScript Object Notation|Java Source Open Network|Joint System Online Node|JavaScript Output Number|JSON berarti JavaScript Object Notation.|Kata terakhirnya berarti notasi.
Jenis nilai yang tidak diwakili secara native oleh JSON adalah…|Fungsi|Angka|String|Boolean|JSON mendukung nilai dasar dan struktur data, tetapi bukan fungsi.|Pilih sesuatu yang dapat dijalankan sebagai kode.
`);
trio('Teknologi',{title:'Unicode Consortium · Apa itu Unicode',url:'https://www.unicode.org/standard/WhatIsUnicode.html'},`
Unicode berkaitan terutama dengan representasi…|Karakter teks|Arus listrik|Suhu perangkat|Kapasitas baterai|Unicode memberi identitas numerik pada karakter.|Pikirkan huruf dan simbol.
Unicode membantu pertukaran teks antara…|Berbagai bahasa dan platform|Hanya satu merek komputer|Hanya perangkat tanpa layar|Hanya bahasa Inggris|Unicode dirancang agar representasi karakter konsisten lintas sistem dan bahasa.|Tujuannya adalah kompatibilitas yang luas.
Unicode mengidentifikasi karakter terutama menggunakan…|Nilai numerik unik|Warna layar pengguna|Nama printer|Ukuran jendela|Karakter diberi nomor sehingga sistem dapat mengenalinya secara konsisten.|Pikirkan identitas karakter, bukan penampilannya.
`);
trio('Literasi Digital',{title:'CISA · Kenali dan laporkan phishing',url:'https://www.cisa.gov/secure-our-world/recognize-and-report-phishing'},`
Pesan palsu yang mencoba mengelabui penerima agar memberikan data disebut…|Phishing|Rendering|Caching|Formatting|Phishing memakai penyamaran untuk menipu penerima.|Istilahnya menyerupai kegiatan memancing.
Ciri pesan yang patut dicurigai sebagai phishing adalah…|Desakan mendadak menyerahkan data rahasia|Sapaan biasa tanpa permintaan|Jadwal yang sudah dikonfirmasi|Pengumuman tanpa tautan atau permintaan|Tekanan untuk segera bertindak dapat dipakai agar penerima tidak memeriksa pesan.|Waspadai rasa panik yang sengaja diciptakan.
Pesan mencurigakan mengatasnamakan kantor meminta login lewat tautan. Respons paling tepat…|Verifikasi lewat kanal resmi yang sudah dikenal|Login untuk memastikan|Kirim sandi lewat balasan|Teruskan tautan agar semua mencoba|Verifikasi independen menghindari ketergantungan pada kontak dalam pesan palsu.|Gunakan jalur yang tidak diberikan oleh pengirim mencurigakan.
`);
trio('Literasi Digital',{title:'CISA · Autentikasi multifaktor',url:'https://www.cisa.gov/MFA'},`
MFA meningkatkan keamanan akun dengan menambah…|Faktor verifikasi identitas|Ukuran foto profil|Jumlah iklan|Warna halaman login|MFA menggunakan lebih dari satu faktor untuk memverifikasi pengguna.|Tidak hanya mengandalkan sandi.
Token keamanan fisik termasuk faktor…|Sesuatu yang dimiliki|Sesuatu yang diketahui|Sesuatu yang diingat|Sesuatu yang dibaca|Perangkat token merupakan benda yang dimiliki pengguna.|Bedakan benda dari pengetahuan.
Pasangan mana mewakili dua kategori faktor autentikasi berbeda?|Sandi dan token fisik|Sandi dan PIN|PIN dan jawaban rahasia|Dua sandi berbeda|Sandi adalah faktor pengetahuan, token adalah kepemilikan.|Dua rahasia yang diingat masih satu kategori.
`);
trio('Teknologi',{title:'DENSO WAVE · Fitur QR Code',url:'https://www.qrcode.com/en/about/'},`
QR Code digunakan untuk menyimpan informasi dalam bentuk…|Pola kode yang dapat dipindai|Gelombang suara saja|Suhu warna lampu|Tombol mekanis|Pemindai membaca informasi yang dikodekan dalam simbol QR.|Pikirkan kamera yang membaca pola.
QR Code yang sebagian kotor terkadang tetap terbaca berkat…|Koreksi kesalahan|Pengisian baterai|Pendinginan layar|Penambahan tinta otomatis|Koreksi kesalahan dapat memulihkan sebagian data yang rusak.|Data memiliki redundansi untuk membantu pemulihan.
Orientasi pemindaian QR Code mendukung…|Berbagai arah hingga 360°|Hanya posisi tegak|Hanya posisi terbalik|Hanya kemiringan 45°|QR Code dirancang agar dapat dibaca dari berbagai arah.|Memutar simbol tidak selalu menghalangi pemindaian.
`);
add(1,'Logika & Angka',reasoning,`
Dalam antrean, Budi berada setelah Ani tetapi sebelum Cici. Siapa di tengah?|Budi|Ani|Cici|Tidak ada|Urutannya Ani, Budi, Cici.|Susun ketiganya dari depan.
Menghadap utara lalu berbelok kanan, kita menghadap…|Timur|Barat|Selatan|Utara|Belok kanan dari utara mengarah ke timur.|Bayangkan arah pada peta.
Dalam angka 4.582, digit 5 menempati nilai tempat…|Ratusan|Puluhan|Ribuan|Satuan|Angka itu terdiri dari 4 ribuan, 5 ratusan, 8 puluhan, 2 satuan.|Hitung posisi dari kanan.
Bilangan yang paling dekat dengan 100 adalah…|98|89|107|112|Jarak 98 ke 100 hanya 2.|Bandingkan selisih absolutnya.
Satu kilogram beras dibagi menjadi kantong 250 gram. Diperlukan…|4 kantong|2 kantong|5 kantong|8 kantong|1.000 dibagi 250 adalah 4.|Ubah kilogram ke gram terlebih dahulu.
Simbol operasi pada 9 … 4 = 5 adalah…|Kurang|Tambah|Kali|Bagi|9 dikurangi 4 menghasilkan 5.|Cari operasi yang mengurangi nilai sembilan menjadi lima.
Dari 3, 5, 8, dan 11, bilangan yang bukan prima adalah…|8|3|5|11|8 dapat dibagi 2 dan 4 selain 1 dan dirinya.|Cari yang memiliki lebih dari dua faktor positif.
Sebuah kubus memiliki berapa sisi bidang?|6|4|8|12|Kubus memiliki enam bidang berbentuk persegi.|Bedakan sisi bidang, rusuk, dan titik sudut.
Urutan alfabet nama berikut yang benar adalah…|Adelia, Dylan, Kirana, Timmy|Dylan, Adelia, Kirana, Timmy|Adelia, Kirana, Dylan, Timmy|Timmy, Kirana, Dylan, Adelia|Huruf awal berurutan A, D, K, T.|Bandingkan huruf pertama setiap nama.
Lift dari lantai 2 naik 4 lantai, lalu turun 1 lantai. Berhenti di lantai…|5|3|6|7|2 + 4 − 1 = 5.|Ikuti perpindahan satu per satu.
Lampu berpola merah, biru, merah, biru. Warna berikutnya…|Merah|Biru|Hijau|Kuning|Polanya bergantian merah dan biru.|Dua warna membentuk satu siklus.
Pita 1 meter dipotong 30 cm. Panjang yang tersisa…|70 cm|30 cm|97 cm|130 cm|100 cm dikurangi 30 cm sama dengan 70 cm.|Samakan satuan terlebih dahulu.
Bilangan 3,6 dibulatkan ke bilangan bulat terdekat menjadi…|4|3|5|6|3,6 lebih dekat ke 4 daripada 3.|Perhatikan angka setelah koma.
Setiap paket memerlukan satu map. Ada 9 paket dan 6 map. Kekurangannya…|3 map|2 map|6 map|15 map|Kebutuhan 9 dikurangi persediaan 6 adalah 3.|Hitung selisih kebutuhan dan persediaan.
Ada 8 gelas, dua pecah, kemudian tiga gelas baru ditambahkan. Gelas utuh menjadi…|9|7|10|13|8 − 2 + 3 = 9 gelas utuh.|Gelas pecah tidak ikut dihitung.
Manakah bilangan negatif?|−7|0|7|0,7|−7 berada di bawah nol.|Cari tanda minus.
Satu jam terdiri dari enam interval yang sama. Setiap interval berlangsung…|10 menit|6 menit|12 menit|15 menit|60 menit dibagi enam sama dengan 10 menit.|Bagikan 60 menjadi enam bagian.
Segitiga memiliki berapa titik sudut?|3|2|4|6|Segitiga memiliki tiga titik sudut.|Namanya menyebut jumlah sudut.
Jumlah dokumen Senin 12, Selasa 9, Rabu 15. Hari dengan dokumen terbanyak…|Rabu|Senin|Selasa|Ketiganya sama|15 lebih besar daripada 12 dan 9.|Bandingkan tiga jumlah tersebut.
Dalam urutan 10, 20, 30, 40, bilangan pada posisi kedua adalah…|20|10|30|40|Posisi kedua dihitung setelah bilangan pertama, yaitu 10.|Posisi dan nilai bilangan berbeda.
`);
add(2,'Logika & Angka',reasoning,`
Skala peta 1:100.000. Jarak 3 cm pada peta mewakili…|3 km|300 m|30 km|300 km|3 × 100.000 cm = 300.000 cm = 3 km.|Satu kilometer sama dengan 100.000 cm.
Tiga kegiatan berurutan berdurasi 20, 35, dan 15 menit. Mulai 10.00, selesai…|11.10|10.50|11.00|11.20|Total durasi 70 menit.|Jumlahkan semua durasi sebelum menambah ke waktu awal.
Dari data 2, 3, 3, 5, 7, modusnya adalah…|3|2|4|5|3 muncul paling sering, yaitu dua kali.|Modus adalah nilai paling sering muncul.
Jangkauan data 14, 9, 21, 16 adalah…|12|7|30|60|Nilai terbesar 21 dikurangi terkecil 9 menghasilkan 12.|Jangkauan bukan jumlah semua data.
Bilangan terkecil yang habis dibagi 4 dan 6 adalah…|12|10|18|24|12 merupakan kelipatan persekutuan terkecil 4 dan 6.|Daftarkan kelipatan kedua angka.
24 apel dan 36 jeruk dibagi ke sebanyak mungkin paket identik tanpa sisa. Jumlah paket…|12|6|18|24|FPB dari 24 dan 36 adalah 12.|Cari pembagi bersama yang paling besar.
Volume balok berukuran 4 cm × 3 cm × 2 cm adalah…|24 cm³|18 cm³|12 cm³|9 cm³|Volume balok adalah panjang kali lebar kali tinggi.|Kalikan ketiga ukuran.
Sisi persegi 6 cm. Persegi panjang 9 cm × 4 cm memiliki luas…|Sama dengan persegi|Dua kali persegi|Setengah persegi|Tiga kali persegi|Kedua luas sama-sama 36 cm².|Hitung kedua luas, bukan keliling.
Sebuah baterai berkurang 8 poin persentase tiap jam dari 80%. Setelah 3 jam…|56%|72%|64%|24%|Penurunan total 24 poin, sehingga tersisa 56%.|Poin persentase dikurangkan langsung.
Dari 50 produk, 4 cacat. Persentase produk baik adalah…|92%|96%|8%|46%|46 dari 50 produk baik: 46/50 × 100% = 92%.|Hitung produk baik terlebih dahulu.
Jumlah dua bilangan 30 dan selisihnya 6. Bilangan lebih besar adalah…|18|12|15|24|Bilangan itu 18 dan 12.|Tambahkan jumlah dan selisih, lalu bagi dua.
Pukul 08.00 dua alarm berbunyi bersama. Periodenya 12 dan 18 menit. Bersama lagi pukul…|08.36|08.30|08.24|09.00|KPK 12 dan 18 adalah 36 menit.|Cari kelipatan bersama pertama.
Di suatu kode, A=1, B=2, C=3, dan seterusnya. Jumlah nilai B-A-D adalah…|7|6|8|9|B + A + D = 2 + 1 + 4 = 7.|Ubah tiap huruf menjadi urutan alfabetnya.
Ani lebih tinggi dari Budi. Cici lebih tinggi dari Ani. Yang paling tinggi…|Cici|Ani|Budi|Tidak dapat ditentukan|Cici > Ani > Budi.|Gabungkan dua perbandingan.
Rak berisi 5 baris, tiap baris 8 buku. Dua baris dikosongkan. Buku tersisa…|24|16|30|38|Tersisa tiga baris, masing-masing delapan buku.|Kurangi jumlah baris dahulu.
Dari 120 menit, 35 menit dipakai rapat dan 25 menit istirahat. Waktu kerja tersisa…|60 menit|70 menit|85 menit|95 menit|120 − 35 − 25 = 60.|Kurangi kedua kegiatan dari total waktu.
Tiket dewasa Rp30.000 dan anak Rp20.000. Dua dewasa serta satu anak membayar…|Rp80.000|Rp70.000|Rp90.000|Rp100.000|2 × Rp30.000 + Rp20.000 = Rp80.000.|Jumlahkan sesuai jumlah setiap jenis tiket.
Pecahan 3/4 ditambah 1/8 sama dengan…|7/8|4/12|1/2|5/8|3/4 = 6/8; ditambah 1/8 menjadi 7/8.|Samakan penyebut menjadi delapan.
Ada 18 orang dalam antrean. Rina urutan ke-7 dari depan. Dari belakang ia urutan…|12|11|13|10|18 − 7 + 1 = 12.|Rina sendiri juga harus ikut dihitung.
Sebuah persegi panjang memiliki keliling 30 cm dan panjang 9 cm. Lebarnya…|6 cm|12 cm|15 cm|21 cm|Panjang ditambah lebar adalah 15 cm, jadi lebar 6 cm.|Keliling terdiri dari dua panjang dan dua lebar.
`);
add(3,'Logika & Angka',reasoning,`
Nilai tugas berbobot 40% adalah 80 dan ujian berbobot 60% adalah 90. Nilai akhir…|86|85|84|88|0,4 × 80 + 0,6 × 90 = 32 + 54 = 86.|Gunakan bobot yang berbeda untuk tiap nilai.
Satu keran mengisi bak kosong dalam 4 jam. Saluran membuang bak penuh dalam 6 jam. Keduanya terbuka, bak penuh dalam…|12 jam|2 jam|5 jam|10 jam|Laju bersih 1/4 − 1/6 = 1/12 bak per jam.|Kurangi laju pengisian dengan pembuangan.
Dua kendaraan saling mendekat dari jarak 180 km dengan laju 40 dan 50 km/jam. Bertemu setelah…|2 jam|3 jam|4 jam|1 jam|Laju mendekat gabungan 90 km/jam, sehingga 180/90 = 2.|Untuk saling mendekat, jumlahkan kecepatan.
Enam orang saling berjabat tangan tepat sekali dengan setiap orang lain. Jumlah jabat tangan…|15|30|12|36|Ada 6 × 5 / 2 = 15 pasangan.|Setiap pasangan jangan dihitung dua kali.
Kode memakai dua huruf berbeda dari A, B, C, D, lalu satu digit 0–9. Banyak kode…|120|160|80|40|4 pilihan pertama × 3 kedua × 10 digit = 120.|Huruf tidak boleh berulang, digit bebas.
Dari angka 1, 2, 3 dibuat bilangan tiga digit tanpa pengulangan. Jumlah seluruh bilangan itu…|1.332|666|1.232|1.998|Tiap digit muncul dua kali di setiap posisi: 2 × 6 × 111 = 1.332.|Gunakan simetri posisi ratusan, puluhan, satuan.
Dua dadu adil dilempar. Peluang kedua angka sama adalah…|1/6|1/3|1/12|1/36|Ada enam pasangan kembar dari 36 kemungkinan.|Daftarkan pasangan 1-1 hingga 6-6.
Koin adil dilempar tiga kali. Peluang tepat dua gambar adalah…|3/8|1/2|1/4|7/8|Tiga urutan memenuhi: GGA, GAG, AGG dari delapan urutan.|Posisi satu angka dapat berada di tiga tempat.
Harga 3 buku dan 2 pena Rp34.000. Satu buku dan 2 pena Rp18.000. Harga satu pena…|Rp5.000|Rp4.000|Rp6.000|Rp8.000|Selisih memberi dua buku Rp16.000, lalu dua pena Rp10.000.|Kurangkan kedua pembelian untuk mencari harga buku.
Usia kakak dua kali adik. Enam tahun lagi jumlah usia mereka 42. Usia adik sekarang…|10 tahun|12 tahun|14 tahun|15 tahun|Jumlah sekarang 30; dibagi rasio 2:1 memberi adik 10.|Dalam enam tahun, jumlah usia bertambah dua kali enam.
Rata-rata lima angka 12. Setelah angka 20 dihapus, rata-rata sisanya…|10|8|11|13|Jumlah awal 60, sisanya 40 dibagi empat menjadi 10.|Ubah rata-rata menjadi total terlebih dahulu.
Sebanyak 30% dari bilangan A adalah 45. Nilai 20% dari A adalah…|30|25|35|40|A = 150, sehingga 20% × 150 = 30.|Dua puluh persen adalah dua pertiga dari tiga puluh persen.
Dalam lomba tanpa seri, Anda menyalip pelari urutan kedua. Posisi Anda kini…|Kedua|Pertama|Ketiga|Keempat|Anda mengambil posisi pelari yang disalip, yaitu kedua.|Pelari terdepan belum disalip.
Semua peserta wajib memakai lencana. Dito tidak memakai lencana. Jika aturan selalu dipenuhi, Dito…|Bukan peserta|Pasti panitia|Pasti peserta|Pasti terlambat|Peserta selalu berlencana, jadi yang tidak berlencana bukan peserta.|Gunakan kontraposisi, bukan menebak perannya.
Kotak A bertuliskan “emas di B”, kotak B “emas di sini”. Tepat satu tulisan benar. Emas…|Tidak mungkin memenuhi kondisi itu|Pasti di A|Pasti di B|Pasti di kedua kotak|Kedua tulisan menyatakan hal sama, sehingga nilai kebenarannya selalu sama.|Bandingkan makna dua kalimat, bukan letak tulisannya.
Dalam laci ada kaus kaki merah dan biru. Minimal ambil berapa tanpa melihat agar pasti mendapat sepasang sewarna?|3|2|4|5|Setelah dua warna berbeda, kaus kaki ketiga pasti menyamai salah satunya.|Pertimbangkan kemungkinan terburuk.
Ada 8 tim, masing-masing bertanding sekali melawan setiap tim lain. Total pertandingan…|28|56|32|16|8 × 7 / 2 = 28 pasangan tim.|Pertandingan A-B sama dengan B-A.
Sebuah foto rasio lebar:tinggi 3:2 diperbesar menjadi lebar 24 cm. Luasnya…|384 cm²|576 cm²|288 cm²|192 cm²|Tinggi 16 cm; luas 24 × 16 = 384 cm².|Temukan faktor pembesaran dari rasio.
Bilangan dua digit berjumlah digit 9. Digit puluhan dua kali satuan. Bilangannya…|63|36|72|81|Jika satuan x, puluhan 2x: 3x = 9, sehingga x = 3.|Tempat digit menentukan urutannya.
Rute terpendek pada kisi dari (0,0) ke (2,2), hanya langkah kanan atau atas, ada…|6|4|8|16|Pilih posisi dua langkah kanan dari empat langkah: 4!/(2!2!) = 6.|Setiap rute berisi dua kanan dan dua atas.
`);

// Preserve qw-1 through qw-300 for existing sessions.
addExpansion450(add);
