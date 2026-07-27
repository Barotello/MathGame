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
2. Oyuncu isterse doğrudan kelime tahmini yapar.
3. Oyuncu **Harf Aç** düğmesine basarsa kapalı kutular yaklaşık 700–900 ms döner.
4. Henüz açılmamış konumlardan biri rastgele seçilir ve doğru harf kendi yerinde kilitlenir.
5. Diğer kapalı kutular tekrar `?` durumuna döner.
6. Oyuncu ekrandaki Türkçe klavyeyle cevabı girip **Tahmin Et** düğmesine basar.
7. Doğru tahminde başarı animasyonu gösterilir ve sıradaki kelimeye geçilir.
8. Yanlış tahminde kutular kısa bir sarsılma animasyonu yapar; tur bitmez.

Terminoloji kararı:

- Sistemin doğru harfi göstermesini sağlayan düğme: **Harf Aç**
- Oyuncunun cevabı göndermesini sağlayan düğme: **Tahmin Et**

Bu iki eylemi aynı isimle sunmak kullanıcıyı yanıltacağı için ayrı tutulmalıdır.

## 3. İlk sürüm oyun kuralları

### 3.1 Önerilen MVP kuralları

- İlk içerik paketi yalnızca 3 harfli kelimelerden oluşur.
- Her turda tek bir açıklama ve tek doğru cevap vardır.
- Üç harfli bir kelimede en fazla **2 harf açılabilir**.
- İlk harf açma 50, ikinci harf açma 100 puan düşürür.
- Doğru cevap temel olarak 300 puan verir.
- Yanlış tam kelime tahmini 25 puan düşürür; puan sıfırın altına inmez.
- Zaman sınırı MVP'de kullanılmaz. Önce oyunun anlaşılır ve eğlenceli olup olmadığı test edilir.
- Doğru cevaptan sonra oyuncu **Sonraki Kelime** düğmesine basar.
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

1. Geri düğmesi, mod adı ve toplam puan
2. Kategori etiketi
3. Büyük açıklama kartı
4. Harf kutuları
5. Kalan harf açma hakkı
6. **Harf Aç** düğmesi
7. Oyuncunun girdiği tahmin satırı
8. Türkçe ekran klavyesi
9. **Sil** ve **Tahmin Et** kontrolleri
10. Başarı/yanlış cevap geri bildirimi

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

- Animasyon sürerken ikinci kez **Harf Aç** veya **Tahmin Et** çalışmaz.
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
  wrongGuessCount: number;
  roundScore: number;
  status: 'playing' | 'revealing' | 'solved';
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

Mevcut `App.tsx` iki mod arasında geçiş yapmaktadır. Yeni modla birlikte tip şu yönde genişletilir:

```ts
type AppMode = 'classic' | 'wall-breaker' | 'word-wheel';
```

Üç mod oluşacağı için Ayarlar içinde tek tek büyüyen mod satırları yerine küçük bir **Oyun Modları** ekranı önerilir:

```text
Oyun Modları
  Klasik Hedef Sayı
  Duvar Yıkma
  Kelime Çarkı
```

MVP'nin hızlı teslimi için önce Ayarlar ekranına “Kelime Çarkı” kartı eklenebilir. Sonraki arayüz düzenlemesinde üç mod ortak seçim ekranına taşınabilir.

Kelime modundan çıkmak klasik oyunun seviyesini, kalan süresini veya Duvar Yıkma kaydını değiştirmemelidir.

## 9. İlerleme kaydı

İlk sürümde aşağıdakiler yerel olarak kaydedilir:

```ts
type WordWheelProgress = {
  schemaVersion: 1;
  totalSolved: number;
  totalScore: number;
  bestRoundScore: number;
  solvedWordIds: string[];
  recentWordIds: string[];
};
```

`recentWordIds` son 10 kelimeyi tutarak hemen tekrar seçilmelerini engeller. Tüm uygun kelimeler oynandığında havuz yeniden açılır; son birkaç kelime yine korunur.

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
- 10 örnek kelimeyle veri doğrulama kontrolü kur.

Çıkış ölçütü: `ARI`, `DİŞ`, `GÖL` ve `KUŞ` gibi Türkçe karakterli cevaplar doğru karşılaştırılmalı; açılmış bir konum ikinci kez seçilmemelidir.

### Aşama 2 — İlk oynanabilir ekran

- Açıklama kartı, üç kutu ve oyun içi klavyeyi oluştur.
- Harf girişi, silme ve tahmin gönderme akışını bağla.
- Doğru/yanlış durumlarını göster.
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
- Doğru kelime yalnızca boşluk ve harf büyüklüğü farkıyla yanlış sayılmaz.
- Yanlış cevap puanı sıfırın altına indirmez.
- Son kelimeler hemen tekrar seçilmez.
- Moddan çıkıp dönünce kayıt bozulmaz.
- Küçük telefon, tablet, yatay ekran ve web görünümü kontrol edilir.
- Ekran okuyucu kutuları “Birinci harf kapalı” veya “İkinci harf Ö” biçiminde okuyabilir.

## 13. MVP kabul kriterleri

- Uygulamada Kelime Çarkı moduna girilebilir ve geri çıkılabilir.
- Üstte sade Türkçe açıklama gösterilir.
- Üç harfli cevap için üç ayrı kutu oluşturulur.
- Harf Aç eyleminde kapalı kutular döner ve yalnızca bir doğru harf yerinde açılır.
- Oyuncu ekrandaki Türkçe klavyeyle üç harfli tahmin girebilir.
- Doğru ve yanlış tahmin açık biçimde ayrılır.
- Doğru cevap puanlanır ve sonraki kelimeye geçilir.
- Üç harfli kelimede üçüncü harf otomatik açılmaz.
- En az 40 doğrulanmış kelime bulunur.
- İlerleme diğer oyun modlarından ayrı kaydedilir.
- Yeni paket eklenerek kutu sayısı kod mimarisini değiştirmeden artırılabilir.

## 14. Uygulamadan önce kapatılacak küçük ürün kararları

İlk prototip yukarıdaki önerilen ayarlarla yapılabilir. Kullanıcı testinden önce şu kararlar kesinleştirilmelidir:

1. Harf açmak yalnızca puan mı düşürecek, yoksa tur başına jeton mu kullanacak?
2. Oyuncu yanlış tahminde sınırsız devam mı edecek, üç can sistemi mi olacak?
3. Doğru cevaptan sonra otomatik geçiş mi, “Sonraki Kelime” düğmesi mi kullanılacak? Öneri: düğme.
4. Kelime kategorisi açıklamanın üstünde gösterilecek mi? Öneri: ilk sürümde evet.
5. Modun kesin adı “Kelime Çarkı” mı olacak?

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
