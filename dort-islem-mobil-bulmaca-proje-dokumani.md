# Dört İşlem Mobil Bulmaca Oyunu

## Proje Tasarım ve Teknik Geliştirme Dokümanı

**Doküman sürümü:** 1.2 (Kod Tabanı Birebir Senkronize Sürüm)  
**Son tasarım ve etkileşim güncellemesi:** 25 Temmuz 2026  
**Platformlar:** iOS ve Android  
**Önerilen teknoloji:** React Native + Expo + TypeScript  
**Oyun türü:** Sayı, mantık ve dört işlem tabanlı mobil bulmaca  
**Çalışma adı:** Hedef Sayı  
**Mevcut Kod Tabanı Durumu:** 1–30 Seviyeler (Deha Bölümleri 10 Pisagor, 20 Öklid, 30 El-Hârizmî dahil) tam doğrulanmış çözümleri ve zorluk eğrisiyle aktif olarak kodlanmıştır.

---

## 1. Oyun özeti

Oyuncunun amacı, karelerden oluşan bir sayı tahtasında birbirine komşu sayı ifadelerini seçip toplama, çıkarma, çarpma ve bölme işlemlerini kullanarak bölümün hedef değerine ulaşmaktır. Tahtada doğal sayıların yanında ilerleyen seviyelerde kesirler, üslü ifadeler ve köklü sayılar da bulunur.

İlk bölümlerde tahta 3×3 boyutundadır. Oyuncu ilerledikçe tahta, sayı aileleri, kullanılabilecek işlemler ve çözüm uzunluğu büyür. Yaklaşık 100. seviyede tahta en fazla 20×20 boyutuna ulaşır. Büyük tahtalarda yakınlaştırma, uzaklaştırma ve kaydırma kullanılır. Her 10 seviyede bir, matematik tarihinden önemli bir isme ayrılan özel bir “Deha Bölümü” oynanır.

Her bölüm, sistem tarafından önceden doğrulanmış en az bir çözüme sahip olacak şekilde üretilir. Bu nedenle “rastgele” sayılar tamamen kontrolsüz üretilmez; önce geçerli bir çözüm oluşturulur, daha sonra bu çözüm tahtaya yerleştirilir ve kalan alanlar dikkat dağıtıcı sayılarla doldurulur.

### Temel değer önerisi

- Kuralı birkaç saniyede anlaşılır.
- Kısa oturumlarda oynanabilir.
- Matematik ile stratejiyi birleştirir.
- Her bölüm tekrar üretilebilir ve çok sayıda içerik hazırlanabilir.
- Günlük bulmaca, seri, skor tablosu ve reklamsız premium modele uygundur.

---

## 2. Tasarım hedefleri

1. Oyuncu ilk bölümü açıklama okumadan veya en fazla 30 saniyelik yönlendirmeyle tamamlayabilmelidir.
2. Her bölüm çözülebilir olmalı; şansa bağlı çıkmazlar oluşmamalıdır.
3. İşlem sonucu ve seçilen ifade her an açıkça görülebilmelidir.
4. Küçük telefonlarda 20×20 tahta kullanılabilir kalmalıdır.
5. İlk 10 bölüm öğretici, sonraki bölümler ise giderek stratejik olmalıdır.
6. Oyun çevrimdışı çalışabilmelidir.
7. İçerik üretim sistemi, elle yüzlerce bölüm hazırlamayı gerektirmemelidir.
8. Kesir, üs ve kökler zorluğu artırırken sonuçlar zihinden takip edilebilir kalmalıdır.
9. Tarihsel bilgi oyunu bölmemeli; kısa, isteğe bağlı ve oynanışla ilişkili sunulmalıdır.

---

## 3. Temel oyun mekaniği

### 3.1 Bölüm ekranı

Bölümde şu ana öğeler bulunur:

- Üst sağda ayarlar düğmesi
- Başlığın altında bölüm geçişi, hedef ve süreyi bir araya getiren cam durum kartı
- Ortada karelerden oluşan sayı tahtası
- Komşu hücreye sürüklendiğinde açılan 120° hilal biçimli işlem yayı: `+`, `−`, `×`, `÷`, `%` (kalan/modulo)
- Tamamlanan her işlemi iki ilgili hücrenin arasında gösteren küçük işlem rozeti
- Geri al, temizle ve isteğe bağlı ipucu alanı

Eski **İfaden** ve **Ara sonuç** kartı oyun ekranından kaldırılmıştır. Oyuncunun kurduğu yol, seçili hücreler ve hücreler arasındaki işlem sembolleriyle doğrudan tahta üzerinde okunur.

### 3.2 Ana etkileşim modeli: tek hareketle sürükle ve işlem seç

Mobil oyunun birincil kontrolü, tekrar eden dokunmaları azaltan kesintisiz bir parmak hareketidir:

1. Oyuncu başlangıç sayı hücresine parmağını basar.
2. Parmağını kaldırmadan yatay veya dikey komşu hedef hücreye sürükler.
3. Parmak geçerli komşu hücreye girdiğinde hedef hücre bekleyen seçim olarak vurgulanır.
4. Hedef hücrenin üstünde `+`, `−`, `×`, `÷`, `%` seçenekleri kısa, bombeli ve merkezi açık bir **hilal yayı** üzerinde açılır.
5. Yay 210° ile 330° arasına yerleştirilir; toplam yay açıklığı **120°** olur. Böylece menü geniş veya uzun bir şerit hâline gelmez.
6. Oyuncu parmağını kaldırmadan seçmek istediği işlem düğmesine doğru yukarı sürükler.
7. Geçerli işlemin temas alanına girildiğinde düğme büyüyerek ve ışık alarak vurgulanır.
8. Oyuncu parmağını vurgulanan işlemin üzerinde bıraktığında işlem otomatik uygulanır; ayrıca bir dokunuş gerekmez.
9. Ara sonuç hedefe eşitse bölüm tamamlanır. Değilse aynı akış, seçili yolun son hücresinden devam eder.

Bu model sayı seçimi, komşu seçimi ve işlem seçimini tek kesintisiz harekette birleştirir. Kullanıcı bir işlem için üç ayrı kez dokunmak zorunda kalmaz.

#### 120° işlem yayının davranışı

- Beş işlem düğmesi (`+`, `−`, `×`, `÷`, `%`) 120°’lik yay üzerinde eşit açısal aralıklarla yerleştirilir.
- Her işlem 55×55 pt görünür alana ve yaklaşık 12 pt ek sürükleme yakalama payına sahiptir.
- Yay hedef hücrenin üstünde açılır; ekran veya tahta kenarında taşmayı önlemek için yay merkezi yatay ve dikey olarak sınırlandırılır.
- Bölümde henüz açılmamış işlemler görünür fakat soluk ve pasif durumdadır. Böylece dört işlemin uzamsal konumu seviyeler arasında değişmez.
- Matematiksel olarak geçersiz işlemler de pasiftir ve sürüklemeyle seçilemez.
- Parmak geçerli bir işlemin yakalama alanına girdiğinde yalnızca o işlem aktif vurgulanır.
- Parmak işlem seçmeden bırakılırsa hedef hücre bekleyen durumda kalır; oyuncu işlemi dokunarak seçebilir veya hareketi yeniden deneyebilir.
- Sürükleme işletim sistemi tarafından iptal edilirse işlem yapılmaz ve bekleyen hedef hücre temizlenir.
- İşlem uygulandığında yay kapanır, seçilen hedef hücre yola eklenir ve ara sonuç güncellenir.

#### Dokunma ve erişilebilirlik yedeği

- Kısa dokunma modeli korunur: ilk sayıya dokun, komşu sayıya dokun, ardından yaydaki işleme dokun.
- Klavye, ekran okuyucu, masaüstü web ve hassas motor kontrol ihtiyacı olan kullanıcılar bu yedek akışı kullanabilir.
- Hücrelerin erişilebilirlik açıklaması hem dokunma hem komşuya sürükleme olanağını belirtir.

Örnek:

```text
Hedef: 60
Kesintisiz hareket: 7’den 3’e sürükle → + üzerinde bırak
Devam hareketi: 3’ten 6’ya sürükle → × üzerinde bırak
Hesap: (7 + 3) × 6 = 60
```

### 3.3 Hesaplama sırası

Mobil oyunda anlaşılabilirliği korumak için işlemler **seçim sırasına göre soldan sağa** uygulanır. Matematiksel işlem önceliği kullanılmaz.

```text
7 + 3 × 6
= önce 7 + 3
= sonra 10 × 6
= 60
```

Hesaplama motoru ifadeyi parantezli biçimde korur; fakat ana oyun ekranında ayrı bir ifade veya ara sonuç kartı gösterilmez. Oyuncu işlem sırasını, seçili hücre yolu ve hücreler arasındaki işlem rozetlerinden takip eder. Parantezli gösterim yalnızca öğretici açıklamalar ve erişilebilirlik metni için kullanılabilir:

```text
((7 + 3) × 6) = 60
```

Bu karar, oyuncunun ara sonucu sürekli takip edebilmesini ve mobil arayüzün sade kalmasını sağlar. İleri seviye bir “uzman modu”nda standart işlem önceliği ayrıca sunulabilir; iki sistem aynı seviye içinde karıştırılmamalıdır.

### 3.4 Hücre komşuluğu

Varsayılan kural:

- Yatay ve dikey komşuluk geçerlidir.
- Çapraz seçim ilk seviyelerde geçersizdir.
- Aynı hücre bir ifade içinde yalnızca bir kez kullanılabilir.
- Seçilen hücreler kesintisiz bir yol oluşturmalıdır.

İleri seviyelerde çapraz bağlantı, ışınlanma hücresi veya köprü hücresi gibi özel kurallar bölüm özelliği olarak açılabilir.

### 3.5 Tahtanın davranışı

Önerilen ana modda sayılar işlem sırasında tahtadan silinmez. Oyuncu yanlış bir yol seçerse son adımı geri alabilir veya seçimi temizleyebilir. Bu yaklaşım:

- Deneme yapmayı kolaylaştırır.
- Rastgele sayı yenileme ihtiyacını kaldırır.
- Her bölümün aynı çözüm durumunu korumasını sağlar.
- Geri alma özelliğini anlaşılır hâle getirir.

İleride ayrı bir “Tüketme Modu” eklenebilir. Bu modda kullanılan hücreler kaybolur ve daha stratejik bir oyun oluşur; ancak MVP kapsamında önerilmez.

---

## 4. Geçerli işlem kuralları

### 4.1 Toplama

- Her zaman geçerlidir.
- Sonuç, bölüm için tanımlanan maksimum ara sonuç sınırını aşamaz.

### 4.2 Çıkarma

- İlk 10 seviyede yalnızca sıfır veya pozitif tam sayı sonuçlarına izin verilir.
- Negatif sonuçlar, özel öğretici tamamlandıktan sonra kademeli olarak açılır.

### 4.3 Çarpma

- Sonuç maksimum ara sonuç sınırını aşamaz.
- Büyük sayılı seviyelerde aşırı hızlı büyümeyi önlemek için çarpan ve sonuç sınırları kullanılır.

### 4.4 Bölme

- Sıfıra bölme geçersizdir.
- İlk öğretici seviyelerde yalnızca tam sayı veren bölmelere izin verilir.
- Kesirler açıldıktan sonra kesin rasyonel sonuçlar geçerlidir.
- Ondalık değer hesaplama motorunda saklanmaz; yalnızca isteğe bağlı yaklaşık bilgi olarak gösterilir.

Örnek:

```text
12 ÷ 3 = 4   → geçerli
10 ÷ 4 = 5/2 → kesirler açıldıktan sonra geçerli
8 ÷ 0        → her zaman geçersiz
```

### 4.5 Ara sonuç sınırları

Kontrolsüz sayısal büyümeyi ve teknik taşmayı önlemek için seviyeye göre sınır uygulanır:

| Seviye aralığı | Önerilen mutlak ara sonuç sınırı |
|---|---:|
| 1–20 | 100 |
| 21–50 | 500 |
| 51–80 | 2.000 |
| 81–100 | 10.000 |

### 4.6 Geçersiz işlem geri bildirimi

Geçersiz işlemde:

- Hücre kısa bir yatay titreşim animasyonu yapar.
- Telefon destekliyorsa hafif dokunsal geri bildirim verir.
- Kısa ve açıklayıcı mesaj gösterilir: “Bölme tam sayı vermeli.”
- Oyuncunun mevcut seçimi bozulmaz.

---

### 4.7 Sayı aileleri ve ileri matematik ifadeleri

Tahta yalnızca doğal sayılardan oluşmaz. Sayı türleri aşamalı açılır ve her yeni tür, önce güvenli bir öğretici bölümde tek başına tanıtılır.

| Sayı/ifade türü | Örnek | Önerilen açılma | Temel kural |
|---|---|---:|---|
| Doğal sayılar | `3`, `12`, `40` | Seviye 1 | Başlangıç sistemi |
| Tam sayılar | `−3`, `−12` | Seviye 21+ | Negatif sonuç eğitimi tamamlandıktan sonra |
| Basit kesirler | `1/2`, `3/4` | Seviye 31+ | Tam ve sadeleştirilmiş rasyonel sonuç |
| Bileşik kesirler | `7/3`, `11/4` | Seviye 41+ | Ekranda bileşik kesir olarak korunur |
| Üslü ifadeler | `2²`, `3³`, `5⁰` | Seviye 51+ | Üs, hücrenin değerinin parçasıdır |
| Tam kare kökler | `√4`, `√9`, `√25` | Seviye 61+ | Önce tam sayı değeri veren kökler |
| Sadeleşen kökler | `√8 = 2√2` | Seviye 71+ | Sembolik ve tam biçimde saklanır |
| Karma ifadeler | `(3/2)²`, `√(9/4)` | Seviye 81+ | Yalnızca uzman seviyelerinde |

#### 4.7.1 Kesir kuralları

- Kesirler her zaman sadeleştirilmiş biçimde gösterilir: `6/8 → 3/4`.
- Payda hiçbir zaman sıfır olamaz.
- Negatif işaret payda yerine ifadenin önünde tutulur: `3/−4 → −3/4`.
- Ondalık gösterim yerine tam kesir gösterimi kullanılır; böylece yuvarlama hatası oluşmaz.
- Tam sayıya sadeleşen sonuç tam sayı olarak gösterilir: `8/4 → 2`.
- İlk kesir seviyelerinde payda kümesi `{2, 3, 4, 5, 8, 10}` ile sınırlandırılır.
- Ara sonuçların pay ve paydası, seviye sınırlarını aşarsa işlem pasif duruma gelir.

Örnek:

```text
Hedef: 2
1/2 + 3/4 + 3/4 = 2
```

#### 4.7.2 Üslü ifade kuralları

MVP sonrası ilk uygulamada üs alma, beşinci bir işlem düğmesi değildir. `2³` gibi bir hücre, değeri `8` olan fakat ekranda üslü biçimde gösterilen tek bir sayı ifadesidir. Oyuncu bu hücreyi diğer hücrelerle dört işlemde kullanır.

- Taban ve üs ekranda açıkça ayrılır.
- İlk aşamada üsler `0`, `2` ve `3` ile sınırlandırılır.
- `0⁰` hiçbir seviyede üretilmez.
- Negatif üsler ilk 100 seviyede kullanılmaz.
- Sonucun aşırı büyümesini önlemek için üslü hücrenin hesaplanmış değeri ara sonuç sınırına uymalıdır.
- Bir hücre seçildiğinde küçük önizlemede hem ifade hem değer gösterilebilir: `3³ = 27`.

#### 4.7.3 Köklü sayı kuralları

- İlk kök seviyelerinde yalnızca tam kareler kullanılır: `√16 = 4`.
- İleri seviyelerde `√8`, `3√2` gibi sadeleşen köklü ifadeler açılır.
- Yaklaşık ondalık değerler hesaplama motorunda kullanılmaz.
- Aynı kök tabanına sahip terimler tam olarak birleştirilebilir: `2√3 + √3 = 3√3`.
- Köklerin çarpımı sadeleştirilir: `√2 × √8 = 4`.
- İrrasyonel bir ara sonuç, ancak seviye kuralları izin veriyorsa kabul edilir.
- Karmaşık sayıya yol açan negatif kökler ana oyunda üretilmez.

#### 4.7.4 Tam ve sembolik hesaplama ilkesi

Kesir, üs ve köklerle hesaplama yapılırken JavaScript kayan nokta sayıları doğrudan oyun doğruluğu için kullanılmamalıdır. Oyun motoru değerleri tam/simgesel biçimde saklamalıdır:

```text
1/3 + 1/6 = 1/2       → tam rasyonel hesap
√8                    → 2√2 olarak sadeleştir
√2 × √2 = 2           → sembolik sadeleştirme
0,333...               → hedef karşılaştırmasında kullanılmaz
```

Hedef kontrolü, ekrandaki yazıya veya yaklaşık ondalığa göre değil, normalize edilmiş matematiksel değere göre yapılır.

#### 4.7.5 Karmaşıklık bütçesi

Bir seviyede aynı anda çok fazla yeni kavram kullanılmamalıdır. Önerilen sınırlar:

- Kolay: tek ileri sayı ailesi
- Normal: iki sayı ailesi
- Zor: iki sayı ailesi + dört işlem kısıtı
- Deha Bölümü: temaya uygun en fazla üç sayı ailesi
- Aynı hücre içinde en fazla iki katman: örneğin `(3/2)²`
- İç içe kök, negatif üs ve değişken üs ilk 100 seviyenin dışında tutulur
## 5. Seviye sistemi: 3×3’ten 20×20’ye

Tahtayı her seviyede büyütmek doğru değildir. 3×3’ten 20×20’ye 100 adımda doğrusal geçiş, bazı seviyelerde gereksiz zorluk sıçramaları yaratır. Bunun yerine boyut, çözüm uzunluğu, sayı aralığı ve işlem çeşitliliği ayrı ayrı artırılmalıdır.

### 5.1 Önerilen ilerleme tablosu

| Seviye | Tahta | Sayı aileleri | Açık işlemler | Çözüm uzunluğu | Yeni unsur |
|---|---:|---|---|---:|---|
| 1–3 | 3×3 | Doğal sayılar 1–5 | `+` | 2–3 hücre | Etkileşim eğitimi |
| 4–7 | 3×3 | Doğal sayılar 1–9 | `+`, `−` | 2–4 hücre | Çıkarma |
| 8–10 | 4×4 | Doğal sayılar 1–12 | `+`, `−`, `×` | 3–4 hücre | İlk Deha Bölümü |
| 11–20 | 5×5 | Doğal ve tam sayılar | Dört işlem | 3–5 hücre | Negatif sonuç ve tam bölme |
| 21–30 | 6×6 | Tam sayılar + basit kesirler | Dört işlem | 3–6 hücre | Kesir eğitimi |
| 31–40 | 8×8 | Kesirler + tam sayılar | Dört işlem | 4–6 hücre | Kesir sadeleştirme |
| 41–50 | 10×10 | Kesirler + üslü ifadeler | Dört işlem | 4–7 hücre | Kare ve küp ifadeleri |
| 51–60 | 12×12 | Üsler + tam kare kökler | Dört işlem | 5–7 hücre | Kök eğitimi ve zoom |
| 61–70 | 14×14 | Kökler + kesirler | Dört işlem | 5–8 hücre | Sembolik sadeleştirme |
| 71–80 | 16×16 | Sadeleşen kökler + üsler | Dört işlem | 6–9 hücre | İki ileri sayı ailesi |
| 81–90 | 18×18 | Karma ifadeler | Dört işlem | 6–10 hücre | İşlem ve sayı türü kısıtları |
| 91–100 | 20×20 | Tüm açık sayı aileleri | Dört işlem | 7–12 hücre | Hikâye finali ve karma kurallar |

Bu değerler başlangıç varsayımlarıdır. Oyuncu testlerinden alınan tamamlama oranı, süre ve ipucu kullanımı verilerine göre ayarlanmalıdır.

### 5.2 Zorluk yalnızca tahta büyüklüğü değildir

Zorluk puanı şu bileşenlerden oluşur:

```text
Zorluk =
  tahta yoğunluğu
  + çözüm yolu uzunluğu
  + kullanılan işlem çeşitliliği
  + hedef sayının büyüklüğü
  + dikkat dağıtıcı yolların sayısı
  + özel hücreler
  + hamle veya süre baskısı
```

20×20 bir tahta, çözüm yolu belirginse kolay olabilir. 5×5 bir tahta ise çok sayıda benzer ara sonuç üretiyorsa zor olabilir. Seviye üreticisi bu nedenle yalnızca satır ve sütun sayısına güvenmemelidir.

### 5.3 Bölüm grupları

Her 10 seviye bir bölüm grubu oluşturabilir:

- 1–10: Başlangıç Bahçesi
- 11–20: Mavi Zirveler
- 21–30: Bölme Geçidi
- 31–40: Cam Labirent
- 41–50: Sayı Şehri
- 51–60: Büyük Tahta
- 61–70: Kısıtlı İşlemler
- 71–80: Anahtar Noktalar
- 81–90: Ters Dünya
- 91–100: Ustalık Alanı

Tema adları görsel tasarım sırasında değiştirilebilir.

---

### 5.4 Deha Bölümleri

Her 10. seviye, o ana kadar öğrenilen mekanikleri bir araya getiren özel bir bölüm olur. Bu seviyeler normal bölümden daha güçlü bir görsel kimliğe, kısa bir giriş kartına, özgün bir kurala ve koleksiyon ödülüne sahip olur.

| Seviye | Bölüm adı | Matematikçi | Oynanış teması | Kısa bilgi kartı |
|---:|---|---|---|---|
| 10 | Sayıların Üçgeni | Pisagor | Kare sayılar, üçgensel yerleşim ve `a² + b²` biçimli hedefler | Sisamlı Pisagor, sayı ve geometri çalışmalarında etkili olan okuluyla tanınır. Adını taşıyan teorem daha eski uygarlıklarca bilinse de Pisagor geleneğiyle özdeşleşmiştir. |
| 20 | Elemanlar Kapısı | Öklid | Asal sayılar, çarpanlar, kalansız bölme ve geometrik yollar | İskenderiyeli Öklid, matematik tarihinin en etkili eserlerinden `Elementler` ile tanınır. |
| 30 | Cebrin Anahtarı | El-Hârizmî | Bilinmeyen hücre, ters işlem ve kesirli denklem | El-Hârizmî, Hindu-Arap rakamları üzerine yazdı; cebir kitabının adı “cebir”, adının Latinceleşmiş biçimi ise “algoritma” sözcüğünün kökeniyle ilişkilidir. |
| 40 | Dizinin Bahçesi | Fibonacci | Önceki iki hücrenin toplamı, ardışık yollar ve dizi tamamlama | Leonardo Fibonacci, `Liber Abaci` ile Hindu-Arap sayı sisteminin Avrupa’da yayılmasında önemli rol oynadı; bugün adıyla anılan diziyle de bilinir. |
| 50 | Siraküza Spirali | Arşimet | Kesirler, oranlar, çember biçimli tahta ve yaklaşık hedef aralığı | Arşimet; geometri, alan ve hacim çalışmalarıyla öne çıktı, π için güçlü bir yaklaşım verdi ve büyük sayıları ifade eden bir sistem geliştirdi. |
| 60 | Kuvvetler Bahçesi | Isaac Newton | Üslü ifadeler, kare-küp dönüşümleri ve artan farklar | Newton, diferansiyel ve integral hesabın temellerini geliştirdi; optik ve kütle çekimi üzerine çalışmalarıyla da bilim tarihinde önemli bir yer edindi. |
| 70 | Sonsuz Bağlantılar | Leonhard Euler | Üsler, kökler, bağlantı yolları ve çoklu çözüm | Euler; analiz, sayı teorisi, geometri ve trigonometri dahil çok geniş bir alana büyük katkılar yaptı. |
| 80 | Toplamların Tacı | Carl Friedrich Gauss | Simetrik sayı eşleme, aritmetik diziler ve kısa optimum çözüm | Gauss, sayı teorisinden geometri ve astronomiye kadar birçok alanda çalıştı; 1’den 100’e kadar sayıları eşleyerek hızla topladığı okul hikâyesiyle de tanınır. |
| 90 | Sonsuz Seriler | Srinivasa Ramanujan | Kesir zincirleri, sayı bölüntüleri ve beklenmedik eşitlikler | Ramanujan; analitik sayı teorisi, sürekli kesirler, eliptik fonksiyonlar ve sonsuz serilere önemli katkılar yaptı. |
| 100 | Simetrinin Koruyucusu | Emmy Noether | Tahta simetrisi, sonucu koruyan dönüşümler ve tüm sayı aileleri | Emmy Noether, modern soyut cebirin gelişiminde belirleyici oldu; simetriler ile korunum ilkeleri arasındaki ilişkiyi kuran teoremiyle de tanınır. |

Bu eşleştirmeler oyunlaştırılmış temalardır. Her mekanik, matematikçinin bütün çalışmalarını temsil ettiği iddiasında bulunmaz; yalnızca oyuncuya tarih ile oynanış arasında akılda kalıcı bir bağlantı sunar.

#### 5.4.1 Deha Bölümü akışı

1. Bölümden önce 10–15 saniyelik çizimli hikâye kartı veya interlüt ekranı gösterilir.
2. İlk Deha Bölümü olan Seviye 10 (Pisagor) sonrasında özel **"Pisagor İnterlüdü"** (görsel tam ekran geçiş kartı) devreye girer.
3. Kartta matematikçinin adı, yaşadığı dönem, bölge ve görsel bilgi bulunur.
4. “Daha fazla bilgi” isteğe bağlıdır; oyuncu doğrudan bir sonraki bulmacaya geçebilir.
5. Bölümün özel kuralı tek ekranlık etkileşimli örnekle veya kısıt rozetiyle öğretilir.
6. Bulmaca tamamlanınca oyuncu bir “Bilgi Parçası” ve portre rozeti kazanır.
7. Arşiv ekranında biyografi kartı, bölüm mekaniği ve güvenilir kaynak bağlantısı açılır.

Tarih kartlarında doğrulanmamış efsaneler gerçek gibi sunulmamalı, matematikçilere uydurma sözler söyletilmemeli ve katkılar tek bir kişiye aşırı basitleştirilerek mal edilmemelidir.

#### 5.4.2 Özel bölüm tasarım şablonu

```text
Giriş: Kayıp matematik sayfası bulunur
↓
Kısa biyografi kartı
↓
Matematikçiye bağlı yeni kuralın görsel öğretimi
↓
Normalden daha uzun “boss puzzle”
↓
Çözümün matematiksel fikrini açıklayan sonuç kartı
↓
Arşiv koleksiyonu ve hikâye parçası
```

### 5.5 Hikâye sistemi: Sonsuzluk Arşivi

Önerilen hikâye çerçevesi:

> Evrenin bütün matematiksel fikirlerini saklayan Sonsuzluk Arşivi parçalanmıştır. Sayılar, işlemler ve büyük keşiflere ait sayfalar farklı odalara dağılmıştır. Oyuncu, “Denklem Bekçisi” olarak hedef değerleri yeniden kurar; her 10 seviyede bir kayıp ustanın salonunu onarır ve Arşiv’in neden parçalandığını keşfeder.

Hikâye, matematikçileri zamanda yolculuk yapan kurgusal karakterlere dönüştürmek yerine onların çalışmalarından esinlenen arşiv odaları üzerinden anlatılır. Böylece tarihsel kişiler hakkında yanlış olaylar uydurulmadan güçlü bir atmosfer kurulabilir.

#### 5.5.1 Hikâye perdesi

- **Perde I — Kayıp Semboller, seviye 1–30:** Dört işlem ve sayı düzeni geri getirilir.
- **Perde II — Kırık Biçimler, seviye 31–60:** Kesirler, üsler ve kökler Arşiv’e döner.
- **Perde III — Sonsuz Koridorlar, seviye 61–90:** Farklı sayı aileleri birleşir; Arşiv’in kasıtlı olarak kilitlendiği anlaşılır.
- **Final — Simetri Odası, seviye 91–100:** Oyuncu, sistemin yok edilmediğini; matematiksel bilginin korunması için simetrik parçalara ayrıldığını keşfeder.

#### 5.5.2 Hikâye sunum ilkeleri

- Normal bölümlerde hikâye metni en fazla 1–2 cümledir.
- Büyük anlatı yalnızca 10., 20., 30. gibi dönüm noktalarında ilerler.
- Tüm ara sahneler atlanabilir ve Arşiv ekranından tekrar izlenebilir.
- Seslendirme zorunlu değildir; çizim, kısa metin ve hafif animasyon MVP sonrası yeterlidir.
- Çocuklar ve yetişkinler için sade bir dil kullanılır.
- Biyografi metni ile kurgusal Arşiv anlatısı görsel olarak açıkça ayrılır.
- Portre ve görseller için lisans durumu kayıt altında tutulur.

#### 5.5.3 Tarih içeriği kaynakları

- MacTutor History of Mathematics Archive (University of St Andrews)
- Encyclopædia Britannica biyografi dizini
- Stanford Encyclopedia of Philosophy
- Ulusal ve uluslararası açık matematik tarihi arşivleri

### 5.6 Özel Bölüm Kısıtları (Challenge Rules)

Uygulamanın seviye sisteminde oyun zorluğunu dinamik olarak artıran kısıtlama kuralları tanımlanmıştır:

- **Zorunlu İşlemler (`requiredOperators`):** Bölümü çözebilmek için belirlenen tüm işlem türlerinin en az bir kez kullanılması zorunluluğu.
- **Sıralı İşlem Kuralı (`requiredOperatorSequence`):** İşlemlerin tam olarak verilen matematiksel sırayla (ör. `%` → `+` → `×` → `−` → `÷`) uygulanması kuralı.
- **Sayı Türü Kısıtı (`requiredValueKinds`):** Bölümde kesir veya negatif gibi spesifik sayı ailelerinin kullanılması zorunluluğu.
- **Tam Adımlı Yol Kuralı (`exactPathLength`):** Çözümün tam olarak belirtilen sayıdaki hücre adımı ile tamamlanması şartı.

Biyografi kartlarının doğrulama başlangıç kaynağı olarak University of St Andrews School of Mathematics and Statistics tarafından sürdürülen MacTutor History of Mathematics kullanılabilir:

- [Pisagor](https://mathshistory.st-andrews.ac.uk/Biographies/Pythagoras/)
- [Öklid](https://mathshistory.st-andrews.ac.uk/Biographies/Euclid/)
- [El-Hârizmî](https://mathshistory.st-andrews.ac.uk/Biographies/Al-Khwarizmi/)
- [Fibonacci](https://mathshistory.st-andrews.ac.uk/Biographies/Fibonacci/)
- [Arşimet](https://mathshistory.st-andrews.ac.uk/Biographies/Archimedes/)
- [Isaac Newton](https://mathshistory.st-andrews.ac.uk/Biographies/Newton/)
- [Leonhard Euler](https://mathshistory.st-andrews.ac.uk/Biographies/Euler/)
- [Carl Friedrich Gauss](https://mathshistory.st-andrews.ac.uk/Biographies/Gauss/)
- [Srinivasa Ramanujan](https://mathshistory.st-andrews.ac.uk/Biographies/Ramanujan/)
- [Emmy Noether](https://mathshistory.st-andrews.ac.uk/Biographies/Noether_Emmy/)

Yayın öncesinde her kart en az iki editoryal kaynaktan kontrol edilmeli; tarihsel belirsizlikler “yaklaşık”, “ona atfedilir” veya “adıyla anılır” gibi doğru ifadelerle belirtilmelidir.
## 6. Hedef sayı üretimi

Hedef sayının tamamen rastgele seçilip sonra tahtada çözüm aranması önerilmez. Bu yöntem çözümsüz, aşırı kolay veya hesaplaması pahalı bölümler üretebilir.

### 6.1 Çözümden hedefe üretim

Güvenli üretim sırası:

1. Seviyenin zorluk ayarlarını belirle.
2. Tahtada kesintisiz bir hücre yolu üret.
3. Yol için başlangıç sayısını seç.
4. Geçerli işlemleri ve takip eden sayıları adım adım üret.
5. Her adımın geçerli olduğundan emin ol.
6. Son ara sonucu hedef sayı olarak ata.
7. Çözüm yolunu tahtaya yerleştir.
8. Boş hücreleri dikkat dağıtıcı sayılarla doldur.
9. Çözümleyiciyle bölümü doğrula.
10. Çok kolay, çok zor veya birden fazla kısa çözümü olan bölümü ele ya da yeniden üret.

Bu yöntem hedefin ulaşılabilir olmasını garanti eder.

### 6.2 Hedef sayı aralıkları

| Seviye aralığı | Önerilen hedef aralığı |
|---|---:|
| 1–10 | 5–30 |
| 11–20 | 10–80 |
| 21–40 | 20–150 |
| 41–60 | 50–500 |
| 61–80 | 100–2.000 |
| 81–100 | 250–9.999 |

Hedefin büyük olması tek başına zor olduğu anlamına gelmez. `10 × 100` kolayken `97` gibi asal bir hedef daha zor olabilir. Üretici hedefin çarpanlarını, olası yollarını ve çözüm uzunluğunu birlikte değerlendirmelidir.

### 6.3 Hedef kalitesi kuralları

İyi bir hedef:

- Belirlenen zorluk aralığına uyar.
- En az bir doğrulanmış çözüme sahiptir.
- Tek dokunuşla veya yalnızca iki sayının basit toplamıyla istenmeden çözülemez.
- Görünür tahtada çok fazla tekrar etmez.
- Gereksiz derecede büyük ara sonuç istemez.

---

## 7. Rastgele sayı dağıtımı

### 7.1 Kontrollü rastgelelik

Tahta üç tür hücreyle doldurulur:

- **Çözüm hücreleri:** Üretici tarafından doğrulanmış ana yol.
- **Alternatif yol hücreleri:** Hedefe ulaşabilen, benzer kalitede ikincil yollar.
- **Dikkat dağıtıcı hücreler:** Mantıklı görünen ancak hedefe doğrudan ulaşmayan sayılar.

Önerilen ilk dağılım:

| Hücre türü | Oran |
|---|---:|
| Ana çözüm | Tahtaya göre gerekli hücre sayısı |
| Alternatif çözüm | %0–5 |
| Yakın sonuç üreten dikkat dağıtıcı | %15–25 |
| Nötr rastgele sayı | Kalan alan |

### 7.2 Ağırlıklı sayı seçimi

Tam eşit rastgele dağılım yerine ağırlıklı seçim kullanılır:

- Küçük sayılar daha sık görülür.
- Büyük sayılar seviye ilerledikçe açılır.
- `1` sayısı işlemleri fazla kolaylaştırdığı için sınırlı tutulur.
- `0`, bölme sorunları ve etkisiz işlemler nedeniyle ilk sürümde kullanılmaz.
- Aynı sayının komşu hücrelerde aşırı tekrarı önlenir.
- Hedefin kendisi tahtaya normal bir hücre olarak konmaz.

Örnek ağırlık:

```text
1–5   → %45
6–10  → %30
11–20 → %18
21+   → %7
```

Bu oranlar seviyeye göre değişir.

### 7.3 Seed kullanımı

Her bölüm bir `seed` değeriyle üretilmelidir. Aynı seed ve aynı üretici sürümü aynı tahtayı oluşturur. Bunun faydaları:

- Hatalı bölüm yeniden üretilebilir.
- Günlük bulmaca tüm oyuncular için aynı olabilir.
- Tüm tahta verisini saklamak yerine seed saklanabilir.
- Test ve hata ayıklama kolaylaşır.

Üretici algoritması değiştiğinde `generatorVersion` alanı da kaydedilmelidir.

---

## 8. Çözüm doğrulama ve algoritma yaklaşımı

### 8.1 Temel çözümleyici

Çözümleyici, tahta üzerindeki tüm olası komşu yolları belirli bir maksimum uzunluğa kadar tarar. Her adımda izin verilen işlemleri dener.

Uygun yöntemler:

- Derinlik öncelikli arama (DFS)
- Geri izleme (backtracking)
- Tekrarlanan durumlar için memoization
- Gereksiz dalları kesmek için pruning

### 8.2 Durum tanımı

Bir arama durumu şunları içerir:

```text
mevcut hücre
ara sonuç
kullanılan hücrelerin kümesi
kullanılan işlem sayısı
oluşturulan ifade
```

### 8.3 Basitleştirilmiş sözde kod

```text
solve(board, target, rules):
  solutions = []

  for each cell in board:
    search(
      currentCell = cell,
      currentValue = cell.value,
      visited = {cell.id},
      expression = [cell.value]
    )

  return solutions

search(currentCell, currentValue, visited, expression):
  if currentValue == target and expression has enough numbers:
    save solution

  if expression reached maximum length:
    return

  for each unvisited orthogonal neighbor:
    for each allowed operator:
      nextValue = apply(currentValue, operator, neighbor.value)

      if operation is valid and branch is promising:
        search(neighbor, nextValue, visited + neighbor, expression + operator + neighbor)
```

### 8.4 Dal budama kuralları

- Maksimum çözüm uzunluğu aşıldıysa dur.
- Ara sonuç izin verilen sınırın dışındaysa dur.
- Bölme tam sayı vermiyorsa dalı kapat.
- Negatif sayılar kapalıysa negatif sonuçta dur.
- Aynı `hücre + sonuç + ziyaret durumu` daha iyi bir yolla görüldüyse tekrar arama.
- Yeterli çözüm bulunduysa aramayı erken bitir.

20×20 tahtada bütün yolları sınırsız aramak çok pahalıdır. Maksimum yol uzunluğu, hedefe yakınlık ve çözüm sayısı sınırlandırılmalıdır. Seviye üretimi mümkünse oyun sırasında değil, geliştirme aşamasında veya arka planda yapılmalıdır.

### 8.5 Bölüm kabul ölçütleri

Üretilen bir bölüm ancak şu koşullarda kabul edilir:

- En az bir çözüm vardır.
- En kısa çözüm istenen uzunluk aralığındadır.
- İstenmeyen tek veya iki adımlık çözüm yoktur.
- Çözümde geçersiz işlem bulunmaz.
- Çözüm cihaz performans sınırlarını aşmadan doğrulanabilir.
- Öğretici bölümse amaçlanan işlem çözümde gerçekten kullanılır.

### 8.6 Tek çözüm mü, çoklu çözüm mü?

Her bölümün yalnızca tek çözüme sahip olması şart değildir. Oyuncunun yaratıcı yollar bulması eğlenceli olabilir. Öneri:

- Eğitim bölümlerinde tek ve açık çözüm.
- Normal bölümlerde 1–5 geçerli çözüm.
- Günlük bulmacada en iyi skor için birden fazla çözüm.
- Kısa, kolay ve tasarımı bozan çözümler üretici tarafından elenir.

---

### 8.7 İleri sayı türleri için çözümleyici

Çözümleyici yalnızca `number` değerleriyle çalışmamalıdır. Her ara sonuç normalize edilmiş bir matematiksel değer olmalı ve eşitlik yapısal olarak denetlenmelidir.

Önerilen dahili değer türleri:

```text
Integer(6)
Rational(3, 4)
Radical(coefficient = 2, radicand = 3)
Power(base = Rational(3, 2), exponent = 2)
```

Üslü hücreler mümkün olduğunda arama başlamadan kesin değerine dönüştürülür. Kökler sadeleştirilir; rasyonel sonuçlar en büyük ortak bölen kullanılarak normalize edilir.

Durum anahtarı oluşturulurken gösterim metni değil kanonik değer kullanılır:

```text
2/4, 3/6 ve 1/2  → aynı Rational(1, 2) durumu
√8 ve 2√2        → aynı Radical(2, 2) durumu
2³ ve 8          → aynı sayısal değer, farklı sunum etiketi
```

Sembolik ifadeler arama uzayını hızlı büyütür. Bu nedenle:

- Her seviyede izin verilen sayı aileleri açıkça sınırlandırılır.
- Radikand kümesi küçük tutulur.
- Farklı kök tabanlarının kontrolsüz toplanmasına izin verilmez veya sonuç “desteklenmeyen sembolik ifade” olarak budanır.
- Pay, payda, katsayı ve üs için ayrı büyüklük sınırları kullanılır.
- Deha Bölümleri geliştirme aşamasında önceden üretilip elle doğrulanır.
- Günlük rastgele üretimde yalnızca kanıtlanmış güvenli şablonlar kullanılır.

### 8.8 Hedef değerin biçimi

Hedef yalnızca doğal sayı olmak zorunda değildir:

```text
Hedef: 7/4
Hedef: 3²
Hedef: 2√3
Hedef: √81
```

Ancak hedef kartı ile matematik motoru ayrılmalıdır. Örneğin `3²` ve `9` matematiksel olarak aynı değerdir. Bölüm tasarımcısı iki farklı başarı kuralından birini seçebilir:

- **Değer eşleşmesi:** Herhangi bir eşdeğer ifade kabul edilir; `9`, `3²` hedefini çözer.
- **Biçim eşleşmesi:** Sonuç belirli bir sayı ailesinde olmalıdır; örneğin köklü biçimde bitirme görevi.

Varsayılan ana oyun kuralı değer eşleşmesidir. Biçim eşleşmesi yalnızca açıkça etiketlenmiş özel görevlerde kullanılır.
## 9. Puanlama ve başarı sistemi

### 9.1 Yıldız sistemi

Her bölüm en fazla üç yıldız verir:

- **1 yıldız:** Hedefe ulaş.
- **2 yıldız:** Önerilen maksimum sayı adedini aşma.
- **3 yıldız:** İpucu kullanmadan ve optimum ya da optimuma yakın çöz.

İlk oynanabilir sürümde her bölüm seviyesine göre bir geri sayım taşır. Süre dolduğunda bölüm başarısız olur ve yeniden başlatılır; sayaç başarı veya başarısızlık anında durur. Süre değerleri oyuncu testlerindeki tamamlama oranlarına göre yeniden dengelenmelidir.

### 9.2 Örnek skor formülü

```text
Taban puan           = 1.000
Kullanılmayan adım   = +100 × kalan adım
Hız bonusu           = 0–500
İlk deneme bonusu    = +250
İpucu cezası         = −200 × kullanılan ipucu
Geri alma cezası     = −25 × geri alma
Minimum bölüm skoru  = 100
```

Skor formülü sunucu tarafında rekabetçi özellikler eklenene kadar basit tutulmalıdır.

### 9.3 Seri ve ödüller

- Günlük giriş serisi
- Arka arkaya ipucusuz bölüm tamamlama
- Belirli bir işlemi kullanarak çözme görevi
- Haftalık toplam yıldız hedefi
- Başarım rozetleri

Ödüller para vermeden önce kozmetik tema, ipucu hakkı veya profil rozeti olarak tasarlanabilir.

---

## 10. Zorluk dengesi

### 10.1 Ölçülecek temel veriler

- Bölüm tamamlama oranı
- İlk denemede tamamlama oranı
- Ortalama tamamlama süresi
- Ortalama geri alma sayısı
- İpucu kullanım oranı
- Bölümden çıkış oranı
- Aynı bölümde tekrar deneme sayısı
- Bulunan çözümün optimum çözüme uzaklığı

### 10.2 Hedef aralıklar

| Bölüm türü | Tamamlama oranı | Ortalama süre |
|---|---:|---:|
| Eğitim | %90+ | 20–45 sn |
| Kolay | %75–90 | 30–90 sn |
| Normal | %55–75 | 1–3 dk |
| Zor | %35–55 | 3–6 dk |
| Ustalık | %20–40 | 5–10 dk |

### 10.3 Dinamik zorluk

Ana bölüm haritasında herkes için aynı seviyeler önerilir; böylece test, destek ve karşılaştırma kolaylaşır. Dinamik zorluk şu alanlarda kullanılabilir:

- Günlük antrenman
- Sonsuz mod
- Kişisel önerilen bulmacalar
- İpucunun ayrıntı seviyesi

Oyuncunun haberi olmadan ana bölümü kolaylaştırmak güveni zedeleyebilir.

### 10.4 İpucu kademeleri

1. Çözümün başladığı hücreyi hafifçe vurgula.
2. Kullanılması gereken ilk işlemi göster.
3. Sıradaki hücreyi göster.
4. İfadenin bir bölümünü otomatik kur.

Her ipucu seviyesi ayrı maliyete sahip olabilir. İlk birkaç öğretici bölümde ipuçları ücretsizdir.

---

## 11. UI/UX tasarımı

### 11.1 Bilgi hiyerarşisi

Oyuncunun gözü şu sırayı takip etmelidir:

1. Bölüm, hedef ve süreyi birleştiren durum kartı
2. Seçili hücre yolu
3. Hücrelerin arasındaki tamamlanmış işlem rozetleri
4. Komşuya sürüklendiğinde açılan 120° hilal biçimli işlem yayı
5. Mesaj, geri al ve temizle kontrolleri

Üst sağ alan yalnızca ayarlar düğmesine ayrılır. Ayarlar açıldığında geri sayım durur; oyuncu ipucu görünürlüğünü ve otomatik bölüm geçişini değiştirebilir veya bölümü yeniden başlatabilir. Geliştirme aşamasında aynı panelde 1–20 arasındaki tüm seviyeleri gösteren bir Bölüm Seçici bulunur. Ayarlar panelindeki etkileşimli kontroller klasik Apple sistem mavisini (`#007AFF`) kullanır: açık anahtarların izi mavi ve başparmağı beyazdır; mevcut/tamamlanmış bölüm düğmeleri ile yeniden başlatma düğmesi aynı mavi ailede gösterilir. Pasif ve kilitli durumlar nötr gri kalır. Mevcut bölüm parlak mavi çerçeveyle gösterilir ve bütün bölümlere doğrudan geçilebilir.

### 11.2 Hücre durumları

Her sayı hücresinin görsel durumları:

- Normal
- Basılı
- Seçili
- Seçilebilir komşu
- Geçersiz
- İpucuyla önerilen
- Çözüm tamamlandığında başarılı

Renk tek başına anlam taşımamalıdır. Seçili yol; renk ve kenarlıkla gösterilir. Uygulanan her adımda `+`, `−`, `×` veya `÷` sembolü iki hücrenin geometrik orta noktasında, kontrastlı küçük bir rozet içinde kalıcı olarak görünür. Geri alma, son hücreyle birlikte ilgili işlem rozetini de kaldırır.

### 11.3 Büyük tahta kullanımı

20×20 tahta ekrana tek seferde okunabilir biçimde sığmaz. Bu nedenle:

- İki parmakla yakınlaştırma ve uzaklaştırma
- Boş alandan sürükleyerek kaydırma
- Seçili hücreye otomatik odaklanma
- Minimum ve maksimum zoom sınırı
- Ekranın köşesinde mini harita
- Hedefe ulaşınca seçili yolu merkeze alma

Hücreden başlayan tek parmak sürüklemesi sayı yolu ve işlem seçimine ayrılır. Boş alandan başlayan tek parmak hareketi tahta gezinmesine, iki parmak hareketi yakınlaştırmaya ayrılır. Yaklaşık 7 pt hareket eşiği aşılmadığında hareket kısa dokunma kabul edilir; böylece dokunma yedeği yanlışlıkla sürüklemeye dönüşmez.

120° işlem yayı tahta yakınlaştırıldığında hücreyle birlikte ölçeklenmemelidir. Düğmeler 55×55 pt sabit boyutta kalmalı, yalnızca bağlandıkları hedef hücreye göre yeniden konumlandırılmalıdır. Yay açıkken tahta kaydırılmaz; yakınlaştırma veya sistem iptali gerçekleşirse yay kapanır ve bekleyen hedef seçim iptal edilir.

### 11.4 Erişilebilirlik

- Minimum dokunma alanı yaklaşık 44×44 pt
- Dinamik yazı boyutuna uyumlu menüler
- Renk körlüğüne uygun paletler
- Ses ve titreşimi ayrı kapatma
- Yüksek kontrast modu
- İşlem sembolleri için metin açıklaması
- Sağ ve sol el kullanımına uygun, simetrik hilal biçimli işlem yayı
- Sürüklemeyi kullanamayan oyuncular için tam dokunma ve ekran okuyucu yedeği

### 11.5 Görsel stil

Uygulanan görsel yön, canlı doğa manzaraları üzerinde “liquid glass” hissi veren katmanlı arayüzdür:

- Her bölüm grubunda atmosferi destekleyen özgün doğa manzarası kullanılabilir.
- Oyun tahtası, birleşik bölüm/hedef/süre kartı, ayarlar paneli ve bildirimler buzlu cam yüzeylerde yer alır.
- Cam yüzeylerde arka plan bulanıklığı, yarı saydam koyu yeşil ton, ince beyaz kenarlık ve yumuşak gölge birlikte kullanılır.
- Sayı hücreleri panelden ayrı okunacak kadar opak, manzarayı hissettirecek kadar saydam kalır.
- Seçili hücrelerde açık limon yeşili ışık izi; başarısızlıkta sıcak mercan tonu kullanılır.
- Metnin bulunduğu bölgelerde ayrıca koyu bir kontrast katmanı bulunur.
- Arka plan görsellerinde yazı, logo, insan veya oyunla yarışan yoğun merkez ayrıntısı bulunmaz.
- Tasarım iOS, Android ve web önizlemesinde aynı bilgi hiyerarşisini korur.

#### Dört işlem yayının liquid-glass görünümü

- İşlem düğmeleri beyaz ve sıcak nötr tonlarda mat sıvı-cam yüzeylerdir. Arka planı hafifçe taşıyan düşük yoğunluklu BlurView korunur; daha yüksek yüzey opaklığı ve koyu işlem sembolleri sayesinde düğmeler manzara üzerinde silik kalmaz.
- Her düğmede üstten ince bir parlama, ortada sıcak ışık yıkaması ve altta hafif derinlik gölgesi bulunur.
- Dolu yarım daire panel kullanılmaz. Merkez tamamen açık bırakılır; yalnızca 110 pt yarıçaplı, ince ve beyaz saydam cam hilal bandı düğmeleri birbirine bağlar.
- Dört düğme 55×55 pt boyutundadır. 110 pt yarıçap ve eşit açısal yerleşim, komşu düğmeler arasında belirgin boşluk bırakarak üst üste binmeyi önler.
- Hilal hedef hücreyi örtmez; butonları çevreleyen gölge yumuşak ve kısa menzillidir.
- Parmağın yaklaştığı işlem yay fiziğiyle yaklaşık 9 pt yükselir, `1.35` ölçeğe büyür ve hafif perspektif eğimini sıfırlar. Hareket akıcıdır ve seçimi fiziksel bir yüzeye dokunuyormuş gibi hissettirir.
- Pasif işlemler görünür ve okunabilir kalır ancak etkileşimli düğmelerle karışmayacak ölçüde sakinleştirilir.
- Parlak neon renkler, sert siyah gölgeler, düşük kontrast, aşırı parıltı, yoğun ayrıntı, eski skeuomorfik süsler ve piksel hissi kullanılmaz.
- Kompozisyon minimalist kalır; 120° hilal yerleşimi ve dört sabit işlem konumu korunur.

İlk 10 bölümde referans alınan yeşil tepe atmosferinden üretilmiş özgün ve metinsiz bir manzara kullanılır. 11–20. bölümlerde ise mavi saat ışığında dağ gölü, katmanlı zirveler ve şelale içeren ikinci bir özgün arka plan otomatik olarak devreye girer. Arayüz Expo BlurView ile bulanıklaştırılır; desteklenmeyen veya düşük performanslı cihazlarda yarı saydam panel rengi okunabilir yedek görünüm sağlar. Cam etkisi hiçbir zaman metin kontrastının, minimum dokunma alanının veya sayı okunabilirliğinin önüne geçmemelidir.

### 11.6 Ana ekranlar

```text
Açılış
├── Ana Sayfa
│   ├── Devam Et
│   ├── Bölüm Haritası
│   ├── Günlük Bulmaca
│   ├── Başarımlar
│   ├── Sonsuzluk Arşivi
│   └── Ayarlar
├── Oyun
│   ├── Duraklat
│   ├── İpucu
│   └── Sonuç
└── Mağaza / Premium
```

### 11.7 Matematiksel ifade ve hikâye arayüzü

Kesirler yatay `1/2` metni yerine mümkünse dikey pay–payda düzeninde gösterilir. Üs, tabanın sağ üstünde; kök çizgisi ise kapsadığı değeri açıkça örtecek biçimde çizilir. Hücre yazısı küçültülerek okunamaz hâle getirilmemeli; karma ifade hücreleri büyük tahtalarda özel yakınlaştırma eşiğine sahip olmalıdır.

Bir hücre seçildiğinde erişilebilir önizleme gösterilir:

```text
Görünen ifade: √8
Sadeleşmiş biçim: 2√2
Yaklaşık değer: 2,828  (yalnızca yardımcı bilgi)
```

Yaklaşık değer hiçbir zaman hedef doğruluğunun ölçütü değildir.

Deha Bölümü giriş kartı şu öğeleri içerir:

- Matematikçinin portresi veya lisanslı stilize illüstrasyonu
- Adı ve yaşadığı dönem
- İki cümleyi aşmayan doğrulanmış biyografi
- Bu bölümdeki matematik fikri
- “Bulmacaya Başla” ve “Daha Fazla Bilgi” seçenekleri
- Kurgu metninden farklı renkte “Tarih Notu” etiketi
---

## 12. Örnek bölüm akışı

### 12.0 Uygulanan bölüm paketleri

İlk oynanabilir içerik paketi, MVP önerisine uygun olarak doğrulanmış 10 bölümden oluşur. Her bölüm verisi bilinen hücre yolu ve işlem dizisi taşır; uygulama başlangıcında komşuluk, hücre tekrarı, işlem geçerliliği ve hedef sonucu otomatik olarak doğrulanır.

| Seviye | Ad | Tahta | Hedef | Süre | İşlemler | Bilinen çözüm |
|---:|---|---:|---:|---:|---|---|
| 1 | İlk Kıvılcım | 3×3 | 10 | 60 sn | Toplama | 7 + 3 |
| 2 | İkinci İz | 3×3 | 9 | 55 sn | Toplama | 4 + 5 |
| 3 | Üçlü Yol | 3×3 | 12 | 50 sn | Toplama | 5 + 4 + 3 |
| 4 | Eksilen Işık | 3×3 | 6 | 50 sn | Toplama, çıkarma | 8 − 2 |
| 5 | Denge Noktası | 3×3 | 12 | 45 sn | Toplama, çıkarma | 9 + 7 − 4 |
| 6 | Sessiz Fark | 3×3 | 3 | 40 sn | Toplama, çıkarma | 8 − 5 |
| 7 | Kıvrılan Patika | 3×3 | 15 | 40 sn | Toplama, çıkarma | 6 + 8 + 4 − 3 |
| 8 | Çarpım Kapısı | 4×4 | 24 | 55 sn | Toplama, çıkarma, çarpma | (3 + 1) × 6 |
| 9 | Ustanın Eşiği | 4×4 | 36 | 50 sn | Toplama, çıkarma, çarpma | (8 − 2) × 6 |
| 10 | Sayıların Üçgeni | 4×4 | 25 | 45 sn | Toplama, çıkarma, çarpma | 3² + 4² |

Üretim sürümünde sonraki bölüm kontrolü yalnızca mevcut hedef başarıyla çözüldüğünde etkinleşir. Mevcut geliştirme sürümünde test hızını artırmak için ileri ve geri bölüm kontrolleri kilitsizdir; Ayarlar içindeki Bölüm Seçici üzerinden herhangi bir seviyeye doğrudan gidilebilir. Hedef çözüldüğünde bölüm tamamlandı olarak işaretlenir ve otomatik geçiş açıksa 3 saniye sonra sonraki bölüm açılır. Başarı alanında tekrarlanan başlık ve işlem özeti gösterilmez. Onuncu bölüm Pisagor tarih notunu ve kare sayı gösterimini içeren ilk Deha Bölümü pilotudur.

### 12.1 Uygulanan oyun etkililiği paketi

Sekiz öncelikli iyileştirme mevcut prototipe uygulanmıştır:

1. **Kalıcı ilerleme:** `AsyncStorage` üzerinde `schemaVersion: 1` ile tamamlanan bölümler, son oynanan bölüm, bölüm rekorları ve ayarlar saklanır. Kayıt; en yüksek yıldız, en kısa süre, en kısa yol ve ipucusuz tamamlama bilgisini içerir.
2. **Üç yıldız sistemi:** Hedefi çözmek bir yıldız, ideal hücre uzunluğunu aşmamak ikinci yıldız, süre içinde ipucusuz çözmek üçüncü yıldız verir. Bölüm seçici en iyi yıldız sonucunu gösterir.
3. **Akıcı işlem seçimi:** Hilal menüsündeki düğmeler parmak mesafesine göre kademeli büyür ve aydınlanır. Geçersiz işlem seçildiğinde matematiksel neden mesaj alanında açıklanır. Desteklenen iOS ve Android cihazlarda işlem odağı, başarı, başarısızlık ve ipucu açma için haptik geri bildirim kullanılır.
4. **Aşamalı ipucu:** Çözüm tek seferde verilmez. Başlangıç hücresi, ikinci hücre, işlem sırası ve tam yol olmak üzere dört aşamada açılır; ilk ipucu kullanımı üç yıldız koşulunu etkiler.
5. **Zorluk doğrulaması:** Tahta alanı, ideal yol uzunluğu, açık işlem sayısı ve süre baskısından 0–100 arası zorluk puanı hesaplanır. 11–20 paketi için 5×5 tahta, dört açık işlem ve 3–5 hücrelik ideal yol koşulları uygulama başlangıcında doğrulanır.
6. **Kontrollü otomatik geçiş:** Başarıdan sonra 3 saniyelik canlı geri sayım ve ilerleme çizgisi görünür. Oyuncu **Burada Kal** ile geçişi tek seferlik durdurabilir.
7. **Oyuncu/geliştirici modu:** Geliştirici modunda bütün bölümler ve ileri/geri kontrolleri açıktır. Oyuncu modunda yalnızca tamamlanan bölümler ile sıradaki bölüm erişilebilir; diğerleri kilitli görünür.
8. **Mimari ayrıştırma:** Kalıcı ilerleme `useGameProgress`, zorluk hesabı `difficulty`, ayarlar `SettingsModal`, bölüm ağı `LevelPicker`, ipucu `StagedHint` ve otomatik geçiş `AutoAdvanceBanner` modüllerine ayrılmıştır. `GameScreen` yalnızca oyun oturumunu ve bu parçaların koordinasyonunu yönetir.
### Uygulanan ikinci bölüm paketi: Mavi Zirveler

11–20. seviyeler 5×5 tahtaya geçer, dört işlemin tamamını açar ve çözümleri 3–5 hücre arasında tutar. Süre sınırı 55 saniyeden 32 saniyeye iner. Her bilinen çözüm uygulama başlangıcında aynı doğrulayıcıdan geçirilir. Bu pakette arka plan, yeşil tepelerden mavi saat ışığındaki dağ gölü ve şelale manzarasına geçer.

| Seviye | Ad | Tahta | Hedef | Süre | Bilinen çözüm |
|---:|---|---:|---:|---:|---|
| 11 | Mavi Eşik | 5×5 | 18 | 55 sn | ((8 ÷ 4) × 6) + 6 |
| 12 | Yankılı Patika | 5×5 | 15 | 50 sn | ((9 + 3) × 2) − 9 |
| 13 | Şelale Oranı | 5×5 | 8 | 45 sn | (6 × 4) ÷ 3 |
| 14 | Sis İçindeki Köprü | 5×5 | 20 | 45 sn | ((12 ÷ 3) + 6) × 2 |
| 15 | Derin Su | 5×5 | 7 | 40 sn | ((5 × 6) ÷ 3) − 3 |
| 16 | Zirve Çarpanı | 5×5 | 42 | 40 sn | ((8 + 6) ÷ 2) × 6 |
| 17 | Buzul Dengesi | 5×5 | 16 | 38 sn | ((6 + 1) × 4) − 12 |
| 18 | Gölün Nabzı | 5×5 | 24 | 36 sn | ((9 × 6) ÷ 3) + 6 |
| 19 | Kayıp Yansıma | 5×5 | 11 | 34 sn | (((8 × 5) ÷ 4) + 3) − 2 |
| 20 | Elemanlar Kapısı | 5×5 | 36 | 32 sn | (((8 + 4) ÷ 2) × 7) − 6 |

20. seviye, Öklid’e ayrılan ikinci Deha Bölümüdür. Dört işlemin tamamını tek yol üzerinde kullanan paketin final bulmacasıdır.

### Seviye 1

**Tahta:** 3×3  
**Hedef:** 10  
**Açık işlem:** Toplama  
**Amaç:** Hücre seçme ve komşuluk kuralını öğretmek

```text
┌───┬───┬───┐
│ 2 │ 4 │ 1 │
├───┼───┼───┤
│ 7 │ 3 │ 5 │
├───┼───┼───┤
│ 1 │ 6 │ 2 │
└───┴───┴───┘
```

Örnek çözüm: `7 + 3 = 10`

Akış:

1. `7` hücresi titreşimli bir çerçeveyle gösterilir.
2. Oyuncu `7` hücresine basar ve parmağını kaldırmadan komşu `3` hücresine sürükler.
3. `3` hücresine girildiğinde üstte 120° hilal biçimli işlem yayı açılır; öğretici olarak `+` seçeneği vurgulanır.
4. Oyuncu aynı parmak hareketini `+` düğmesine taşır ve üzerinde bırakır.
5. `7 + 3` işlemi ek dokunuş gerektirmeden otomatik uygulanır.
6. İfade çubuğunda `7 + 3 = 10` görünür.
7. Hedef kartı parlar ve sonuç ekranı açılır.

### Seviye 10 — Pisagor: Sayıların Üçgeni

**Tahta:** 4×4, üçgensel vurgulu yol  
**Hedef:** 25  
**Özel kural:** Çözümde iki kare sayı kullanılmalı  
**Örnek çözüm:** `3² + 4² = 25`

Bölüm öncesinde Pisagor ve okulunun sayı–geometri ilişkisine ilgisini anlatan kısa Tarih Notu gösterilir. Oyuncu bu seviyede ilk kez üslü gösterimi görür; ancak hücrelerin `3² = 9` ve `4² = 16` değer önizlemeleri öğretici olarak açıktır. Bu tek seferlik tanıtım, üslü sayıların normal ilerlemede daha sonra açılmasına hazırlık sağlar.

### Seviye 30 — El-Hârizmî: Cebrin Anahtarı

**Tahta:** 6×6  
**Hedef:** `3/2`  
**Özel kural:** `?` hücresinin değerini doğru işlem yoluyla ortaya çıkar  
**Örnek denklem:** `? + 1/2 = 2`, dolayısıyla `? = 3/2`

Bu bölüm, normal “hedef değeri bul” akışını kısa süreliğine tersine çevirir. Oyuncu bilinmeyeni izole eden yolu kurar. Sonuç kartı, “cebir” ve “algoritma” sözcüklerinin El-Hârizmî’nin çalışmaları ve adıyla olan tarihsel bağını açıklar.

### Seviye 50 — Arşimet: Siraküza Spirali

**Tahta:** 10×10, spiral yol  
**Hedef:** `22/7`  
**Sayı aileleri:** Kesirler ve kare sayılar  
**Özel kural:** Spiral üzerindeki en fazla altı hücreyi kullan

Bu bölüm `22/7` değerini π’nin kendisi olarak değil, tarih boyunca kullanılan bir yaklaşım olarak açıkça etiketler. Tarih kartında Arşimet’in π’yi çokgenlerle sınırlayan yaklaşımından söz edilir; bulmacada kesin kesir hesabı korunur.

### Seviye 18 — Gölün Nabzı

**Tahta:** 5×5  
**Hedef:** 24  
**Açık işlemler:** Dört işlem  
**Örnek çözüm:** `((9 × 6) ÷ 3) + 6 = 24`

Bu bölüm çarpma, tam bölme ve toplamayı 36 saniyelik tek bir yol içinde birleştirir.

### Seviye 46

**Tahta:** 10×10  
**Hedef:** 84  
**Açık işlemler:** Dört işlem  
**Örnek çözüm:** `((18 ÷ 3) + 8) × 6 = 84`

Oyuncu daha geniş tahtada uygun yolu bulmak için gezinir. İpucu yalnızca başlangıç bölgesini gösterir.

### Seviye 100

**Tahta:** 20×20  
**Hedef:** 1.260  
**Çözüm uzunluğu:** 8–12 sayı  
**Ek kurallar:** En az bir bölme kullan, iki engelli hücre bölgesini aş, maksimum 12 sayı kullan  
**Örnek çözüm biçimi:** Üretici ve çözümleyici tarafından doğrulanan uzun bir komşu hücre yolu

Bu seviyede zorluk yalnızca büyük tahtadan değil, işlem kısıtı ve dikkat dağıtıcı alternatiflerden gelir.

---

## 13. Teknik mimari

### 13.1 Teknoloji seçimi

Bu oyun 2D, hücre tabanlı ve arayüz ağırlıklı olduğu için **React Native + Expo + TypeScript** hızlı bir başlangıç sağlar:

- iOS ve Android için tek kod tabanı
- TypeScript ile güvenli veri modelleri
- Expo ile hızlı cihaz testi ve dağıtım
- Animasyon ve dokunma için olgun kütüphaneler
- İlk sürümde oyun motoru öğrenme zorunluluğu yok

Önerilen destekler:

- React Native Reanimated: akıcı animasyonlar
- İlk prototipte React Native PanResponder: hücreden komşuya ve 120° işlem yayına kesintisiz sürükleme
- Büyük tahta aşamasında React Native Gesture Handler: eşzamanlı sürükleme, kaydırma ve zoom
- Zustand veya Redux Toolkit: uygulama durumu
- AsyncStorage: uygulanan yerel ilerleme ve ayar kaydı; SQLite büyük arşiv verileri için gelecekte değerlendirilebilir
- Expo Haptics ve Expo Audio: geri bildirim
- RevenueCat veya mağaza SDK’ları: satın alma yönetimi
- Sentry: hata izleme

20×20 tahtada 400 hücre bulunduğu için her hücrenin yeniden çizilmesini önlemek önemlidir. Performans yetersiz kalırsa tahta görünümü Skia veya özel canvas tabanlı çizime taşınabilir.

### 13.2 Katmanlar

```text
Sunum katmanı
  Ekranlar, hücreler, animasyonlar, erişilebilirlik

Oyun katmanı
  Seçim akışı, işlem kuralları, skor, ipucu

İçerik katmanı
  Seviye tanımları, üretici, çözümleyici, doğrulayıcı

Veri katmanı
  Yerel kayıt, ayarlar, analitik, uzaktan yapılandırma

Platform servisleri
  Ses, titreşim, satın alma, bildirim, bulut kayıt
```

### 13.3 Önerilen klasör yapısı

```text
src/
├── app/
│   ├── navigation/
│   └── providers/
├── screens/
│   ├── HomeScreen.tsx
│   ├── LevelMapScreen.tsx
│   ├── GameScreen.tsx
│   ├── ResultScreen.tsx
│   └── SettingsScreen.tsx
├── components/
│   ├── Board/
│   ├── NumberCell/
│   ├── OperatorPopover/
│   ├── ExpressionBar/
│   └── TargetCard/
├── game/
│   ├── engine/
│   ├── rules/
│   ├── generator/
│   ├── solver/
│   ├── scoring/
│   └── hints/
├── data/
│   ├── levels/
│   ├── storage/
│   └── analytics/
├── store/
├── theme/
├── types/
└── utils/
```

### 13.4 Durum yönetimi

Oyun oturumu için tutulacak temel durum:

- Aktif seviye
- Tahta hücreleri
- Seçili yol
- İşlem bekleyen ikinci hücre
- Sürükleme başlangıç hücresi, bekleyen hedef hücre ve aktif işlem
- 120° işlem yayının açık/kapalı durumu, sabit düğme yerleşimleri ve ekran konumu
- Matematik motorundaki ara sonuç (ekranda ayrı kart olarak gösterilmez)
- Geçen süre
- Geri alma sayısı
- Kullanılan ipuçları
- Oyun durumu: hazırlanıyor, oynanıyor, tamamlandı, duraklatıldı

Oyun hesaplama fonksiyonları mümkün olduğunca saf fonksiyon olmalıdır. Böylece kolayca test edilir ve arayüzden bağımsız çalışır.

### 13.5 Çevrimdışı ve çevrimiçi çalışma

MVP tamamen çevrimdışı oynanabilir. İnternet şu özellikler için daha sonra kullanılabilir:

- Günlük bulmaca indirme
- Bulut kayıt
- Liderlik tablosu
- Analitik
- Uzaktan zorluk ayarı
- Satın alma doğrulama

İnternet yokken ana bölüm ilerlemesi engellenmemelidir.

---

## 14. Veri modelleri

### 14.1 TypeScript veri modeli örneği

```ts
type Operator = 'add' | 'subtract' | 'multiply' | 'divide';
type ValueKind = 'integer' | 'rational' | 'radical' | 'power';

type MathValue =
  | { kind: 'integer'; value: string }
  | { kind: 'rational'; numerator: string; denominator: string }
  | { kind: 'radical'; coefficient: string; radicand: string }
  | { kind: 'power'; base: MathValue; exponent: number };

type TargetMatchMode = 'value' | 'form';

type Position = {
  row: number;
  column: number;
};

type CellType = 'number' | 'blocked' | 'special';

type BoardCell = {
  id: string;
  position: Position;
  type: CellType;
  value?: MathValue;
  specialRule?: 'key' | 'bridge' | 'teleport';
};

type RuleSet = {
  allowedOperators: Operator[];
  allowedValueKinds: ValueKind[];
  allowDiagonal: boolean;
  allowNegativeResults: boolean;
  allowFractionalResults: boolean;
  allowCellReuse: boolean;
  minPathLength: number;
  maxPathLength: number;
  maxAbsoluteIntermediateValue: number;
  maxNumerator?: number;
  maxDenominator?: number;
  allowedRadicands?: number[];
  requiredOperators?: Operator[];
};

type SolutionStep = {
  cellId: string;
  operatorBefore?: Operator;
  valueAfterStep: MathValue;
};

type GeniusChapter = {
  mathematicianId: string;
  chapterTitle: string;
  periodLabel: string;
  shortBiography: string;
  mechanicTheme: string;
  storyText: string;
  sourceUrls: string[];
};
type LevelDefinition = {
  id: string;
  levelNumber: number;
  generatorVersion: number;
  seed: string;
  rows: number;
  columns: number;
  target: MathValue;
  targetMatchMode: TargetMatchMode;
  cells: BoardCell[];
  rules: RuleSet;
  parPathLength: number;
  knownSolutions?: SolutionStep[][];
  difficultyScore: number;
  geniusChapter?: GeniusChapter;
  timeForBonusSeconds?: number;
};

type PlayerLevelProgress = {
  levelId: string;
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  bestTimeMs?: number;
  bestPathLength?: number;
  hintsUsed: number;
  attempts: number;
};

type PlayerProfile = {
  schemaVersion: number;
  playerId: string;
  currentLevel: number;
  totalStars: number;
  hintBalance: number;
  settings: PlayerSettings;
  progress: Record<string, PlayerLevelProgress>;
};
```

### 14.2 Kayıt sürümleme

Yerel kayıt dosyasında `schemaVersion` bulunmalıdır. Veri modeli değiştiğinde eski oyuncu kayıtları migration fonksiyonlarıyla yeni sürüme dönüştürülmelidir. Güncelleme, oyuncunun ilerlemesini silmemelidir.

---

## 15. Test stratejisi

### 15.1 Birim testleri

- Dört işlemin geçerlilik kuralları
- Tam bölme kontrolü
- Negatif ve maksimum sonuç sınırları
- Komşuluk kontrolü
- Aynı hücrenin tekrar kullanım kontrolü
- Soldan sağa hesaplama
- Skor hesabı
- Seed ile tekrar üretilebilirlik
- Kesir sadeleştirme ve işaret normalizasyonu
- Üslü hücrenin kesin değere dönüştürülmesi
- Köklü ifadelerin kanonik sadeleştirilmesi
- Eşdeğer biçimlerin aynı hedef değeri olarak tanınması
- Ondalık yaklaşımın başarı kontrolüne karışmaması

### 15.2 Üretici testleri

- Üretilen 10.000 bölümün tamamında en az bir çözüm bulunması
- Çözüm uzunluğunun seviye ayarına uyması
- Hedefin sayı aralığında olması
- Hedefin doğrudan hücre olarak bulunmaması
- Üretimin performans bütçesi içinde kalması
- Aynı seed’in aynı sonucu vermesi
- Her sayı ailesinin seviye kurallarına uygun üretilmesi
- Sembolik ifade karmaşıklığının belirlenen bütçeyi aşmaması
- Deha Bölümlerinin bilinen çözümlerinin sürüm değişiminde korunması

### 15.3 Arayüz testleri

- Küçük ve büyük ekranlar
- iOS ve Android dokunma farklılıkları
- 3×3 ve 20×20 tahta performansı
- Hücre sürüklemesi ile tahta kaydırmanın çakışmaması
- 7 pt hareket eşiğinde kısa dokunma/sürükleme ayrımı
- 120° yayda işlem yakalama alanları ve otomatik uygulama
- Zoom ile hücre seçiminin çakışmaması
- Ekran döndürme davranışı
- Büyük yazı ve yüksek kontrast
- Düşük performanslı Android cihaz

### 15.4 Başarı ölçütleri

MVP teknik kabul kriterleri:

- Çözümsüz yayınlanmış bölüm oranı: %0
- Normal cihazda giriş geri bildirimi: hissedilir gecikme olmadan
- 20×20 tahtada hedef: 60 FPS; düşük cihazlarda kabul edilebilir minimum 30 FPS
- Çökmesiz oturum oranı: %99,5+
- Kayıt kaybı: kritik hata olarak ele alınır

---

## 16. MVP kapsamı

### 16.1 MVP’ye dahil

- iOS ve Android desteği
- 3×3 ile başlayan ve kontrollü büyüyen tahtalar
- Toplama, çıkarma, çarpma ve tam/kesirli kesin sonuç üreten bölme
- Tam sayı ve rasyonel sayılar için yaklaşık değer kullanmayan kesin hesap motoru
- Doğal sayılar, tam sayılar, basit kesirler ve sınırlı tam kare üs hücreleri
- Seviye 10 için bir Deha Bölümü pilotu, kısa tarih kartı ve Arşiv kaydı
- Komşu hücreleri seçtikten sonra açılan bağlamsal menüden işlem seçerek soldan sağa ifade kurma
- En az 30 elle seçilmiş veya üreticiyle doğrulanmış bölüm
- Hedef, süre, seçili yol ve hücreler arası işlem rozeti gösterimi
- Geri al ve seçimi temizle
- Üç kademeli ipucu
- Yıldız ve temel puan sistemi
- Bölüm haritası
- Yerel ilerleme kaydı
- Temel ses, animasyon ve dokunsal geri bildirim
- Ayarlar ve erişilebilirlik seçenekleri
- Temel analitik ve hata kaydı

### 16.2 MVP’ye dahil değil

- Gerçek zamanlı çok oyunculu mod
- Klan veya arkadaş sistemi
- Kullanıcı tarafından bölüm oluşturma
- Ondalık hedefler
- Sadeleşmeyen sembolik kökler ve iç içe karma ifadeler
- On Deha Bölümünün tamamı ve tam hikâye finali
- Gelişmiş özel hücreler
- Bulut kayıt zorunluluğu
- Dünya liderlik tablosu
- Abonelik sistemi
- 100 seviyenin tamamı
- Karmaşık hikâye modu

MVP’nin amacı içerik miktarını değil, temel işlemin eğlenceli ve anlaşılır olup olmadığını doğrulamaktır.

---

## 17. Yol haritası

### Faz 0 — Tasarım doğrulama, 3–5 gün

- Kağıt veya tıklanabilir prototip
- 10 örnek tahta
- Komşuluk ve işlem sırası testi
- Bağlamsal işlem menüsünün konumu ve kullanım testi
- 5–10 kişiyle kısa kullanılabilirlik testi

**Çıkış kriteri:** Oyuncular yardım almadan en az bir bulmacayı çözebiliyor.

### Faz 1 — Oynanabilir prototip, 1–2 hafta

- Tek oyun ekranı
- 3×3 ve 5×5 tahta
- Dört işlem motoru
- Seçim yolu ve geri alma
- Kazanma kontrolü
- Basit bölüm JSON’ları

**Çıkış kriteri:** 10 bölüm baştan sona oynanabiliyor.

### Faz 2 — MVP üretimi, 4–6 hafta

- 30 bölüm
- Tam sayı ve rasyonel değerler için kesin hesap motoru
- Basit kesir ve tam kare üs hücreleri
- Seviye 10 Deha Bölümü ve temel Sonsuzluk Arşivi ekranı
- Bölüm haritası
- Puan, yıldız, ipucu
- Kayıt sistemi
- Ses ve animasyon
- Cihaz performans iyileştirmeleri
- Analitik ve hata izleme

**Çıkış kriteri:** Kapalı test dağıtımına hazır sürüm.

### Faz 3 — Kapalı beta, 2–3 hafta

- 50–100 test kullanıcısı
- Zorluk ve terk oranı analizi
- Hatalı bölümlerin düzeltilmesi
- Mağaza sayfası hazırlığı
- Gizlilik metni ve yaş derecelendirmesi

**Çıkış kriteri:** Kritik hata yok, ilk 10 bölümde güçlü tutunma sinyali var.

### Faz 4 — İlk yayın, 2 hafta

- 50–60 bölüm
- İlk beş Deha Bölümü ve doğrulanmış biyografi kartları
- Üslü ifadeler ve tam kare kökler
- Hikâyenin ilk iki perdesi
- Android ve iOS mağaza gönderimleri
- Reklamsız satın alma
- Ödüllü ipucu reklamı
- Destek ve geri bildirim kanalı

### Faz 5 — İçerik büyümesi

- 100 seviye ve 20×20 final tahtası
- Sadeleşen köklü sayılar ve güvenli karma ifadeler
- On Deha Bölümünün tamamı
- Sonsuzluk Arşivi hikâye finali
- Koleksiyon kartları ve matematik tarihi arşivi
- Günlük bulmaca
- Sonsuz mod
- Yeni temalar
- Özel hücreler
- Bulut kayıt ve skor tabloları

---

## 18. Riskler ve önlemler

| Risk | Etki | Önlem |
|---|---|---|
| Rastgele üretilen bölüm çözümsüz | Çok yüksek | Önce çözüm üret, sonra tahtayı doldur; otomatik çözümleyiciyle doğrula |
| 20×20 tahta telefonda okunamaz | Yüksek | Zoom, kaydırma, mini harita ve görünür alan odaklı tasarım |
| Arama algoritması yavaşlar | Yüksek | Maksimum yol, pruning, memoization ve önceden üretim |
| Bölme kuralı kafa karıştırır | Orta | Yalnızca tam sayı bölme; anlık açıklayıcı geri bildirim |
| Oyun matematik ödevi gibi hissedilir | Yüksek | Kısa seviyeler, güçlü görsel geri bildirim, tema, başarı ve günlük görev |
| Zorluk aniden yükselir | Yüksek | Parametreleri ayrı artır; telemetriye göre ayarla |
| Çok fazla kısa alternatif çözüm | Orta | Çözümleyiciyle minimum yol kontrolü ve bölüm eleme |
| 400 hücrede performans sorunu | Orta | Gereksiz yeniden çizimi önle; gerekirse canvas/Skia kullan |
| Reklam oyuncu deneyimini bozar | Yüksek | Zorunlu reklamı sınırlı tut; ödüllü reklamı oyuncu başlatsın |
| Çocuklara yönelik kullanımda veri riski | Yüksek | Minimum veri toplama, açık gizlilik politikası, yaşa uygun mağaza ayarları |
| İçerik tekrar hissi verir | Orta | Yeni kurallar, günlük seed, temalar ve görev varyasyonları |
| Kesir ve köklerde yuvarlama hatası | Çok yüksek | Rasyonel ve sembolik kesin hesap; ondalığı yalnızca yardımcı gösterim olarak kullan |
| Sembolik çözümleyicinin arama uzayı patlar | Yüksek | Sayı ailesi bütçesi, kanonik sadeleştirme, pruning ve önceden doğrulanmış şablonlar |
| Tarihsel bilgi hatalı veya aşırı basitleştirilmiş olur | Yüksek | En az iki kaynak, editoryal kontrol, belirsizlikleri açık yazma ve uydurma alıntı kullanmama |
| Hikâye bulmaca akışını yavaşlatır | Orta | Kısa ve atlanabilir kartlar; uzun içeriği isteğe bağlı Arşiv ekranına taşı |

---

## 19. Gelir modeli

### 19.1 Önerilen başlangıç modeli

Ücretsiz indirme + ölçülü reklam + tek seferlik reklamsız satın alma.

- Bölüm aralarında sınırlı geçiş reklamı
- Oyuncunun isteğiyle açılan ödüllü ipucu reklamı
- Tek seferlik “Reklamları Kaldır” satın alması
- Kozmetik tahta ve cam temaları

### 19.2 Kaçınılması gerekenler

- Her başarısız denemeden sonra zorunlu reklam
- Oyuncunun işlem akışını bölen reklam
- Çözülebilmesi için ödeme gerektiren bölüm
- Yanlış dokunmaya neden olan reklam yerleşimi
- Çocukları satın almaya yönlendiren karanlık tasarım kalıpları

### 19.3 İleri dönem seçenekleri

- Sezonluk özel bölüm paketleri
- Premium günlük bulmaca arşivi
- Abonelik: yalnızca düzenli ve anlamlı yeni içerik sağlanabiliyorsa
- Eğitim kurumları için reklamsız sınıf paketi
- Kozmetik tema paketleri

Abonelik MVP’de önerilmez. Önce oyuncu tutunması ve düzenli içerik üretme kapasitesi kanıtlanmalıdır.

---

## 20. Analitik olayları

Oyuncu davranışını anlamak için kişisel veri toplamadan şu olaylar ölçülebilir:

```text
level_started
level_completed
level_abandoned
expression_submitted
invalid_operation_attempted
undo_used
selection_cleared
hint_requested
zoom_used
ad_reward_claimed
purchase_completed
```

Her olayda yalnızca gerekli alanlar tutulmalıdır:

```text
level_id
board_size
difficulty_score
elapsed_time
path_length
hint_count
attempt_count
generator_version
```

Oyuncunun kurduğu her ifadeyi kalıcı olarak saklamak zorunlu değildir. Gizlilik ilkesi gereği amaç için gerekli olmayan veri toplanmamalıdır.

---

## 21. İçerik üretim iş akışı

1. Tasarımcı seviye parametrelerini tanımlar.
2. Üretici aday seed’ler oluşturur.
3. Çözümleyici her adayı test eder.
4. Otomatik kalite puanı verilir.
5. Uygun adaylar bir inceleme ekranına alınır.
6. Tasarımcı bölümün çözümünü ve görünümünü kontrol eder.
7. Onaylanan bölüm sürümlü içerik paketine eklenir.
8. Yayından sonra analitik sonuçlarına göre bölüm ayarlanır.

Ana 100 seviyenin tamamen kontrolsüz biçimde cihazda üretilmesi yerine, önceden üretilmiş ve kalite kontrolünden geçmiş olması önerilir. Sonsuz mod ve günlük antrenman cihazda veya sunucuda seed tabanlı üretilebilir.

---

## 22. Ürün kararları özeti

| Konu | MVP kararı | Tam ürün yönü |
|---|---|---|
| Platform | iOS + Android | Aynı |
| Teknoloji | React Native, Expo, TypeScript | Gerekirse tahta çiziminde Skia |
| Hesaplama | Soldan sağa; işlem sırası hücre arası rozetlerde görünür | Aynı |
| Sayı aileleri | Doğal, tam, basit kesir, sınırlı tam kare üs | Kesir, üs, sadeleşen kök ve güvenli karma ifadeler |
| Matematik motoru | Kesin tam sayı ve rasyonel hesap | Kanonik sembolik kök desteği |
| Komşuluk | Yatay + dikey | Özel bölümde tematik istisnalar |
| Hücre tekrarı | Aynı ifadede yasak | Özel kural dışında aynı |
| Bölme | Sıfıra bölme yasak; sonuç kesin rasyonel olabilir | Aynı |
| Negatif sayı | Seviye 10 sonrasında eğitimle açılır | Karma ifadelerde kullanılabilir |
| Tahta | 3×3’ten kontrollü biçimde büyür | Seviye 100’de 20×20 |
| Büyük tahta kontrolü | Zoom + kaydırma | Zoom + kaydırma + mini harita |
| Deha Bölümü | Seviye 10 pilotu | Her 10 seviyede bir, toplam 10 bölüm |
| Hikâye | Kısa ve atlanabilir Arşiv girişi | Üç perde ve seviye 100 finali |
| Tarih içeriği | Kaynaklı kısa biyografi kartı | Koleksiyon arşivi ve ikinci kaynak kontrolü |
| Seviye üretimi | Önce çözüm, sonra kontrollü rastgele dolgu | Sayı ailesi bütçeli üretici |
| Doğrulama | DFS/backtracking + rasyonel normalizasyon | Sembolik sadeleştirmeli çözümleyici |
| İlerleme | Yıldız, skor ve bölüm haritası | Rozet ve Bilgi Parçası koleksiyonu |
| Kayıt | Önce yerel | Opsiyonel bulut |
| Gelir | Ödüllü reklam + reklamsız tek satın alma | Kozmetik tarih/arşiv temaları |

---

## 23. İlk geliştirme görevi

İlk teknik hedef yalnızca şu dikey dilimi tamamlamaktır:

1. Sabit bir 3×3 tahta ve hedef sayıyı göster.
2. Hücreden başlayan kısa dokunma ile sürüklemeyi 7 pt hareket eşiğinde ayır.
3. Parmağın yatay veya dikey komşu hücreye girişini koordinatlardan belirle.
4. Hedef hücrenin üstünde dört düğmeli, 120° açıklıklı hilal biçimli işlem yayını aç.
5. Parmak geçerli işlem alanına girdiğinde düğmeyi vurgula; parmak bırakıldığında işlemi otomatik uygula.
6. Açılmamış veya matematiksel olarak geçersiz işlemleri pasif tut.
7. Dokunma ve ekran okuyucu yedek akışını koru.
8. Ara sonucu parantezli ifade olarak göster; hedefe ulaşıldığında başarı durumunu çalıştır.
9. Geri al, temizle, süre ve yeniden başlat davranışlarını koru.
10. Gerçek bir iOS veya Android cihazda tek elle sürükleme testleri yap.

Bu küçük sürüm eğlenceli ve anlaşılır değilse 20×20 tahta, mağaza veya yüzlerce bölüm eklemek sorunu çözmez. Önce seçim hissi, matematiksel açıklık ve başarı geri bildirimi doğrulanmalıdır.

---

## 24. Sonuç

Projenin en kritik noktası rastgele sayı üretmek değil, **rastgele görünen fakat çözülebilir ve dengeli bulmacalar üretmektir**. Sağlam bir çözüm üretici ve doğrulayıcı, oyunun içerik motorunu oluşturur. Mobil tarafta en büyük tasarım riski ise 20×20 tahtanın okunabilirliğidir; zoom, kaydırma ve odak yönetimi daha ilk prototipte test edilmelidir.

Başlangıç için en doğru kapsam; 3×3 ve 5×5 tahtalarda çalışan, dört işlemi destekleyen, 10–30 doğrulanmış bölümlük küçük bir prototiptir. Temel etkileşimin eğlenceli olduğu kanıtlandıktan sonra seviye üretimi, büyük tahtalar, günlük bulmaca ve gelir modeli aşamalı olarak eklenebilir.
