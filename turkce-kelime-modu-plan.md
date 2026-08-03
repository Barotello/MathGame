# Türkçe Kelime Modu — Ürün ve Uygulama Planı

## 1. Kısa karar

Bu mod için Unity kullanılmayacak. Mevcut uygulama zaten **React Native + Expo + TypeScript** ile yazılmıştır ve Android, iOS ve web hedeflerini aynı kod tabanından çalıştırmaktadır. Yeni kelime modu da aynı teknolojiyle, mevcut uygulamanın içine bağımsız bir mod olarak eklenecektir.

Çalışma adı: **Kelime Çarkı**.

İlk sürüm 3 harfli Türkçe kelimelerle başlayacak; veri modeli ve arayüz baştan 4, 5 ve daha uzun kelimelere büyüyebilecek şekilde kurulacaktır.

## 2. Temel oyun fikri

Ekranın üstünde kısa ve anlaşılır bir kelime açıklaması bulunur. Ortada, kelimenin her harfi için bir kutu gösterilir. İlk sürümde üç kutu vardır.

Örnek:

```text
BAL YAPAN KÜÇÜK BÖCEK

[ ? ] [ ? ] [ ? ]

      HARF AÇ

Türkçe klavye / kelime girişi
```

Cevap: `ARI`

Ana tur akışı:

1. Oyuncuya açıklama ve kapalı harf kutuları gösterilir.
2. Oyuncu oyun içi Türkçe klavyeden harfleri sırayla seçer; seçilen harfler doğrudan kutulara yerleşir.
3. Oyuncu **Harf Aç** düğmesine basarsa kapalı kutular yaklaşık 700–900 ms döner.
4. Henüz açılmamış konumlardan biri rastgele seçilir ve doğru harf kendi yerinde kilitlenir.
5. Diğer kapalı kutular tekrar `?` durumuna döner.
6. Tüm kutular dolduğunda **Cevapla** düğmesi etkinleşir; oyuncu göndermeden önce harfleri silebilir ve düzeltebilir.
7. Doğru tahminde başarı animasyonu gösterilir ve oyuncu **Sonraki Kelime** düğmesiyle devam eder.
8. Yanlış tahminde kutular kısa bir sarsılma animasyonu yapar, doğru cevap gösterilir ve o kelime kapanır. Aynı kelime için ikinci veya üçüncü tahmin hakkı verilmez.
9. Kelime oturumu 2 dakika sürer. Süre dolduğunda yeni kelime akışı durur ve tur özeti gösterilir.

Terminoloji kararı:

- Sistemin doğru harfi göstermesini sağlayan düğme: **Harf Aç**
- Oyuncunun cevabı yalnızca **Cevapla** düğmesine bastığında gönderilir.

Bu nedenle arayüzde ayrıca **Tahmin Et** düğmesi veya ayrı tahmin kutusu bulunmaz.

## 3. İlk sürüm oyun kuralları

### 3.1 Önerilen MVP kuralları

- Bölüm 1 kısa ve kolay, ağırlıklı olarak 3 harfli kelimelerden oluşur; sonraki bölümlerde kelime uzunluğu ve zorluk artar.
- Her turda tek bir açıklama ve tek doğru cevap vardır.
- Üç harfli bir kelimede en fazla **2 harf açılabilir**.
- Açılan her harf 100 puan düşürür.
- Kelimenin başlangıç puanı harf sayısına göre hesaplanır: her harf 100 puandır. Örneğin 3 harfli kelime 300, 4 harfli kelime 400 ve 5 harfli kelime 500 puan verir.
- Her kelime için yalnızca bir tam tahmin hakkı vardır. Yanlış cevapta kelime kapanır, doğru cevap gösterilir ve o kelimeden puan kazanılmaz.
- Her oyun oturumu 120 saniye sürer. Süre dolduğunda girişler kilitlenir ve doğru, yanlış ve tur puanı özeti gösterilir.
- Oyun 10 bölümden oluşur ve her bölümde 10 farklı kelime oynanır.
- Bölüm 1 en kolay kelime havuzundan başlar; kelime uzunluğu ve içerik zorluğu her bölümde kademeli olarak artar.
- Bölüm 1'in 10 kelimesi tek uzunluğa sabitlenmez: 3 adet 3 harfli, 4 adet 4 harfli ve 3 adet 5 harfli kelime seçilir.
- Bir kelime doğru veya yanlış sonuçlandığında bölüm sayacında tamamlanmış kabul edilir. Onuncu kelimeden sonra sonraki bölüm açılır.
- Bölüm 10'un onuncu kelimesinden sonra ana ilerleme tamamlanır ve genel sonuç gösterilir.
- Doğru cevaptan sonra oyuncu **Sonraki Kelime** düğmesine basar.
- Yanlış cevaptan sonra oyuncu da **Sonraki Kelime** düğmesiyle süre devam ederken yeni kelimeye geçer.
- Tüm harfleri otomatik açan bir özellik bulunmaz; son adımda oyuncunun tahmin yapması gerekir.

Puanlar ilk kullanıcı testinden sonra değiştirilebilir; kod içinde dağınık sabitler yerine tek bir kural nesnesinde tutulmalıdır.

### 3.2 Örnek başlangıç kelimeleri

| Cevap | Basit açıklama | Kategori |
|---|---|---|
| ARI | Bal yapan küçük böcek | Hayvan |
| ÇAY | Sıcak içilen, demlenen içecek | Yiyecek ve içecek |
| KAR | Kışın gökten yağan beyaz taneler | Doğa |
| GÖL | Etrafı karayla çevrili su | Doğa |
| TAŞ | Yerde bulunan sert cisim | Nesne |
| KUŞ | Kanatlarıyla uçabilen hayvan | Hayvan |
| DİŞ | Ağzımızda yiyecekleri parçalayan yapı | Vücut |
| GÜL | Güzel kokulu, dikenli olabilen çiçek | Bitki |
| MUZ | Sarı kabuklu uzun meyve | Yiyecek ve içecek |
| TOP | Yuvarlak oyun aracı | Oyun |

“Araçların dönmesini sağlayan cisim” açıklamasının cevabı `TEKER` gibi daha uzun bir kelime olduğu için sonraki kelime uzunluğu paketine uygundur.

İçerik ilk sürümde en az 40–60 kelime içermelidir. Aynı kelime kısa aralıkla tekrar seçilmemelidir.

## 4. Ekran taslağı

Ekran yukarıdan aşağıya şu bölümlerden oluşur:

1. Geri düğmesi, mod adı ve her yeni turda sıfırlanan toplam puan
2. On bölümün tamamlanma, aktif ve kilit durumlarını gösteren açılır **Bölümler** alanı
3. Aktif bölüm, bölüm içindeki kelime sırası ve kalan süre
4. Kategori etiketi
5. Büyük açıklama kartı
6. Harf kutuları
7. Kalan harf açma hakkı
8. **Harf Aç** düğmesi
9. Türkçe ekran klavyesi
10. **Sil** kontrolü
11. Başarı/yanlış cevap geri bildirimi
12. Oturumdaki doğru, yanlış ve puan özeti

Türkçe klavye şu harfleri doğrudan desteklemelidir:

```text
ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ
```

Mobil cihazın sistem klavyesini açmak yerine oyun içi klavye önerilir. Böylece Türkçe karakterler her cihazda görünür, giriş uzunluğu kontrol edilir ve ekran oyun hissini korur.

## 5. Animasyon davranışı

Unity veya 3D motor gerekmez. Expo/React Native'in yerleşik `Animated` API'si bu ekran için yeterlidir.

Harf açma animasyonu:

1. Açılmamış kutular dikey eksende kayan rastgele Türkçe harfleri hızlıca gösterir.
2. Animasyonun son 200 ms bölümünde hareket yavaşlar.
3. Seçilen kutu doğru harfte durur ve hafifçe büyüyüp eski boyutuna gelir.
4. Diğer kutular `?` işaretine döner.
5. Mobilde hafif haptik geri bildirim verilir; webde atlanır.

Kurallar:

- Animasyon veya cevap kontrolü sürerken ikinci bir giriş çalışmaz.
- Açılmış harfler sonraki dönüşlerde sabit kalır.
- “Hareketi azalt” seçeneği eklenirse dönme yerine kısa solma geçişi kullanılır.
- Animasyon yalnızca görseldir; açılacak konum animasyon başlamadan oyun motoru tarafından belirlenir.

## 6. Kelime ve durum modeli

Önerilen temel tipler:

```ts
type WordEntry = {
  id: string;
  answer: string;
  clue: string;
  category: 'hayvan' | 'doğa' | 'nesne' | 'yiyecek' | 'vücut' | 'oyun';
  difficulty: 1 | 2 | 3;
  enabled: boolean;
};

type WordRoundState = {
  wordId: string;
  revealedIndexes: number[];
  guess: string;
  attempted: boolean;
  roundScore: number;
  status: 'playing' | 'revealing' | 'checking' | 'solved' | 'failed' | 'finished';
};

type WordSessionState = {
  durationSeconds: 120;
  secondsRemaining: number;
  solvedCount: number;
  failedCount: number;
  score: number;
};
```

Kelime uzunluğu kutu sayısından ayrıca saklanmamalıdır; `Array.from(answer)` üzerinden hesaplanmalıdır. Bu yaklaşım Türkçe karakterlerin harf konumlarını güvenli biçimde ele alır ve ileride 4–8 harfe geçişi kolaylaştırır.

Metin karşılaştırması Türkçe yerel ayarı dikkate almalıdır:

```ts
value.trim().toLocaleUpperCase('tr-TR')
```

Özellikle `i → İ` ve `ı → I` dönüşümleri sıradan İngilizce büyük harf dönüşümüne bırakılmamalıdır.

## 7. Önerilen klasör yapısı

```text
src/modes/word-wheel/
  WordWheelScreen.tsx
  WordSlots.tsx
  LetterSlot.tsx
  TurkishKeyboard.tsx
  WordResultCard.tsx
  wordWheelEngine.ts
  wordSelection.ts
  useWordWheelProgress.ts
  types.ts
  data/
    threeLetterWords.ts
```

Sorumluluk sınırları:

- `wordWheelEngine.ts`: tahmin normalleştirme, cevap kontrolü, harf açma ve puanlama
- `wordSelection.ts`: tekrarları azaltarak sıradaki kelimeyi seçme
- `threeLetterWords.ts`: yalnızca doğrulanmış kelime içeriği
- React bileşenleri: durumu hesaplamaz, motorun sonucunu gösterir
- `useWordWheelProgress.ts`: bu moda ait ilerlemeyi ayrı kaydeder

Önerilen AsyncStorage anahtarı:

```text
hedef-sayi-word-wheel-v1
```

## 8. Mevcut uygulamaya bağlantı

Mevcut `App.tsx` iki ana oyun alanı arasında geçiş yapmaktadır:

```ts
type AppMode = 'classic' | 'word-wheel';
```

Ayarlar içindeki **Ana Oyunlar** alanı iki modu birlikte gösterir:

```text
Oyun Modları
  Klasik Hedef Sayı
  Kelime Çarkı
```

Kelime modundan çıkmak klasik oyunun seviyesini veya kalan süresini değiştirmemelidir.

## 9. İlerleme kaydı

İlk sürümde aşağıdakiler yerel olarak kaydedilir:

```ts
type WordWheelProgress = {
  schemaVersion: 2;
  totalSolved: number;
  totalPlayed: number;
  totalScore: number;
  bestRoundScore: number;
  solvedWordIds: string[];
  recentWordIds: string[];
  currentLevel: number;
  levelWordIndex: number;
  currentLevelWordIds: string[];
  completedLevels: number[];
};
```

`currentLevelWordIds`, aktif bölüm için seçilen 10 kelimeyi saklar. Böylece uygulamadan çıkılıp dönüldüğünde aynı bölüm ve kelime sırası korunur. `recentWordIds` son 10 kelimeyi tutarak bölüm geçişlerinde kısa aralıklı tekrarları engeller.

Kelime bankası; harf uzunluğu, `difficulty` değeri ve kararlı alfabetik sıra dikkate alınarak 10 zorluk havuzuna ayrılır. Her bölüm kendi havuzundan 10 farklı kelime seçer. Bu sayede Bölüm 1 gündelik ve kısa kelimelerle başlar, sonraki bölümlerde daha uzun ve zor kelimelere geçilir.

## 10. İçerik kalite kuralları

Her kelime yayınlanmadan önce şu kontrollerden geçmelidir:

- Güncel ve yaygın Türkçe bir kelime olması
- Açıklamanın cevabın kendisini veya aynı kökten açık bir biçimini içermemesi
- Açıklamanın tek bir cevaba mümkün olduğunca güçlü biçimde işaret etmesi
- Yaşa uygun, kısa ve sade dil kullanması
- Cevabın noktalama, boşluk veya tire içermemesi
- Kelime uzunluğunun içerik paketiyle eşleşmesi
- `İ, I, Ğ, Ü, Ş, Ö, Ç` karakterlerinin doğru yazılması
- Argo, tartışmalı özel ad ve bölgesel kullanımların ilk pakette bulunmaması

Kelime listesi koddan bağımsız bir dizi olarak tutulacağı için daha sonra JSON veya uzaktan içerik sistemine taşınabilir. İlk sürümde sunucu veya veritabanı gerekli değildir.

## 11. Aşamalı uygulama planı

### Aşama 1 — Başsız oyun çekirdeği

- Tipleri ve kelime veri şemasını oluştur.
- Türkçe büyük/küçük harf normalleştirmesini yaz.
- Harf açılacak konumu seçen saf fonksiyonu yaz.
- Tahmin doğrulama ve puanlama fonksiyonlarını yaz.
- 100 puanlık sabit harf açma maliyetini ve 120 saniyelik oturum kuralını tek bir kural modülünde tut.
- 10 örnek kelimeyle veri doğrulama kontrolü kur.

Çıkış ölçütü: `ARI`, `DİŞ`, `GÖL` ve `KUŞ` gibi Türkçe karakterli cevaplar doğru karşılaştırılmalı; açılmış bir konum ikinci kez seçilmemelidir.

### Aşama 2 — İlk oynanabilir ekran

- Açıklama kartı, üç kutu ve oyun içi klavyeyi oluştur.
- Harf girişi, silme ve **Cevapla** ile tahmin gönderme akışını bağla.
- Doğru/yanlış durumlarını göster.
- Yanlış cevapta kelimeyi kapatıp doğru cevabı göster; aynı kelimede tekrar tahmine izin verme.
- 2 dakikalık geri sayım ve süre sonu özetini ekle.
- Harf açma animasyonunu ekle.
- Geri çıkış ve yeni kelime geçişini ekle.

Çıkış ölçütü: Android, iOS düzeni ve web üzerinde art arda 20 kelime oynanabilmeli; hızlı çift dokunma durumu bozmamalıdır.

### Aşama 3 — Uygulama entegrasyonu

- `AppMode` tipine yeni modu ekle.
- Ayarlar veya Oyun Modları ekranından giriş ekle.
- Ayrı AsyncStorage ilerleme kaydını bağla.
- Mevcut Doğa Camı ve Sıcak Kâğıt temalarını uygula.
- Haptik, erişilebilirlik etiketleri ve hareket azaltma davranışını ekle.

Çıkış ölçütü: Modlar arasında geçişte hiçbir modun ilerlemesi veya mevcut turu bozulmamalıdır.

### Aşama 4 — İçerik ve dengeleme

- En az 40–60 adet doğrulanmış 3 harfli kelime ekle.
- Kategori dağılımını dengeli hâle getir.
- Tekrar önleme algoritmasını tamamla.
- Puan ve harf açma maliyetlerini gerçek kullanıcılarla test et.
- 10 bölümün her biri için 10 kelimelik grupları ve zorluk artışını doğrula.
- İlk kullanım öğreticisini ekle.

Çıkış ölçütü: Yeni kullanıcı yardım almadan bir harf açabilmeli, kelime girebilmeli ve sonraki tura geçebilmelidir.

### Aşama 5 — Daha uzun kelimeler

- 4, 5 ve 6 harfli ayrı içerik paketleri ekle.
- Kutuları ekran genişliğine göre dinamik boyutlandır.
- Uzunluğa göre açılabilecek azami harf sayısını kurala bağla.
- Seviye veya zorluk seçimini ekle.

Önerilen açma sınırları:

| Kelime uzunluğu | En fazla açılan harf |
|---:|---:|
| 3 | 2 |
| 4 | 2 |
| 5 | 3 |
| 6 | 3 |
| 7–8 | 4 |

## 12. Doğrulama ve test listesi

- `npm run typecheck` hatasız tamamlanır.
- Türkçe `i/İ` ve `ı/I` dönüşümleri test edilir.
- Açılmış harf tekrar açılmaz.
- Animasyon sırasında düğmeler ikinci işlem başlatmaz.
- Eksik uzunlukta tahmin gönderilemez.
- Tahmin yalnızca etkin **Cevapla** düğmesine basıldığında bir kez gönderilir.
- Yanlış tahminden sonra aynı kelime yeniden düzenlenemez veya tekrar gönderilemez.
- Sayaç 2:00'dan 0:00'a iner; süre dolunca klavye ve harf açma işlemleri kilitlenir.
- Doğru kelime yalnızca boşluk ve harf büyüklüğü farkıyla yanlış sayılmaz.
- Yanlış cevap puanı sıfırın altına indirmez.
- Son kelimeler hemen tekrar seçilmez.
- Her bölüm tam olarak 10 farklı kelime sunar.
- Bölüm 10'a kadar zorluk havuzları kademeli biçimde ilerler.
- Aktif bölüm ve bölüm içindeki kelime sırası uygulamadan çıkıp dönünce korunur; tur puanı her yeni turda sıfırlanır.
- Moddan çıkıp dönünce kayıt bozulmaz.
- Küçük telefon, tablet, yatay ekran ve web görünümü kontrol edilir.
- Ekran okuyucu kutuları “Birinci harf kapalı” veya “İkinci harf Ö” biçiminde okuyabilir.

## 13. MVP kabul kriterleri

- Uygulamada Kelime Çarkı moduna girilebilir ve geri çıkılabilir.
- Üstte sade Türkçe açıklama gösterilir.
- Cevabın harf sayısı kadar kutu dinamik olarak oluşturulur.
- Harf Aç eyleminde kapalı kutular döner ve yalnızca bir doğru harf yerinde açılır.
- Oyuncu ekrandaki Türkçe klavyeyle aktif bölümün kelimesini girebilir.
- Son harf girildiğinde cevap otomatik gönderilmez; silme ve düzeltme kullanılabilir.
- Doğru ve yanlış tahmin açık biçimde ayrılır.
- Yanlış tahminde doğru cevap gösterilir ve aynı kelime için yeni hak verilmez.
- Doğru cevap puanlanır ve sonraki kelimeye geçilir.
- Her harf açma işlemi 100 puan düşürür.
- Oyun 2 dakikalık oturum sonunda durur ve tur özeti gösterir.
- Oyun 10 bölümden oluşur; her bölümde 10 farklı kelime vardır.
- Bölümler alanında tamamlanan, aktif ve kilitli bölümler görülebilir.
- Tur toplam puanı oyun ekranında her zaman görülebilir ve yeni turda sıfırlanır.
- Doğru cevapta kazanılan tur puanı yukarı hareket ederek toplam puan alanına eklenir.
- Üç harfli kelimede üçüncü harf otomatik açılmaz.
- En az 40 doğrulanmış kelime bulunur.
- İlerleme diğer oyun modlarından ayrı kaydedilir.
- Yeni paket eklenerek kutu sayısı kod mimarisini değiştirmeden artırılabilir.

## 14. Kesinleşen ürün kararları

1. Harf açmak jeton kullanmaz; açılan her harf mevcut kelime puanından 100 puan düşürür.
2. Üç can sistemi veya sınırsız tekrar yoktur. Her kelime için tek tam tahmin hakkı vardır.
3. Son harf girildiğinde **Cevapla** düğmesi etkinleşir; oyuncu gönderene kadar harflerini düzenleyebilir.
4. Doğru veya yanlış sonuçtan sonra sıradaki kelimeye **Sonraki Kelime** düğmesiyle geçilir.
5. Her oturum 2 dakika sürer; süre dolunca tur özeti gösterilir.
6. Kelime kategorisi açıklamanın üstünde gösterilir.
7. Modun adı **Kelime Çarkı**dır.
8. Ana ilerleme 10 bölümden oluşur; her bölüm 10 kelimedir ve zorluk bölüm numarasıyla artar.
9. Tur toplam puanı oyun ekranında ayrı bir alanda gösterilir ve her yeni turda 0'dan başlar.

## 15. Önerilen ilk geliştirme görevi

İlk kodlama işi animasyon değil, şu küçük dikey dilim olmalıdır:

1. `WordEntry` ve `WordRoundState` tiplerini oluştur.
2. 10 kelimelik doğrulanmış örnek veri ekle.
3. Türkçe normalleştirme ve cevap kontrolünü yaz.
4. Daha önce açılmamış rastgele konumu seçen motoru yaz.
5. Sabit bir `ARI` turunu üç kutu ve klavyeyle oynanabilir yap.
6. Ardından dönme animasyonunu ekle.
7. Son olarak mod navigasyonu ve kalıcı kaydı bağla.

Bu sıra, animasyon tamamlandıktan sonra temel oyun kuralını yeniden yazma riskini azaltır.
