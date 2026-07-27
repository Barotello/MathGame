# Hedef Sayı — V2 “Bir İşlem” Modu Ürün ve Teknik Planı

**Doküman sürümü:** 1.0  
**Hazırlanma tarihi:** 27 Temmuz 2026  
**Durum:** Planlama / entegrasyon yapılmayacak  
**Hedef sürüm:** Uygulama V2  
**Hedef platformlar:** iOS, Android ve mevcut Expo web uyumluluğu  
**Ana ilke:** “Bir İşlem” modu klasik oyun ve Duvar Yıkma modundan bağımsız ilerler; yalnızca güvenli ve saf matematik/tema yardımcılarını paylaşır.

---

## 1. Amaç ve kapsam

Bu doküman, geleneksel “Bir İşlem” mantığını mevcut **Hedef Sayı** uygulamasına ikinci sürümde eklemek için ürün kararlarını ve teknik yol haritasını tanımlar.

Oyuncuya altı başlangıç sayısı ve üç basamaklı bir hedef verilir. Oyuncu başlangıç sayılarını en fazla birer kez kullanarak `+`, `−`, `×` ve `÷` işlemleriyle hedefe tam olarak ulaşmaya veya mümkün olan en yakın sonucu üretmeye çalışır.

Bu aşamada:

- Uygulama koduna, ekranlarına, kayıtlarına veya menülerine müdahale edilmeyecek.
- Yeni bağımlılık kurulmayacak.
- V1 davranışları değiştirilmeyecek.
- Yalnızca V2 uygulamasına temel olacak kararlar, sınırlar ve kabul ölçütleri belirlenecek.

## 2. Mevcut projeyle ilişki

Proje bugün Expo 57, React Native 0.86, React 19 ve TypeScript 6 kullanıyor. Uygulamada iki mod bulunuyor:

- **Klasik:** Komşu hücrelerden yol çizip soldan sağa işlem yaparak hedefe ulaşma.
- **Duvar Yıkma:** Aynı sınıftaki komşu hücrelerle zincir kurup duvara hasar verme.

“Bir İşlem” benzer matematik sembolleri kullansa da mevcut klasik modun farklı bir görünümü değildir. Temel fark şudur:

| Konu | Mevcut klasik mod | V2 Bir İşlem modu |
|---|---|---|
| Sayı düzeni | 3×3 ve daha büyük komşuluk tahtası | Altı bağımsız sayı taşı |
| Seçim | Yatay/dikey komşu yol | Havuzdaki herhangi iki sayı |
| Hesap | Tek bir soldan sağa akümülatör | İki sayı birleşir, sonuç havuza döner |
| Sayı kullanımı | Hücre yol içinde bir kez | Her kaynak sayı en fazla bir kez; ara sonuç tekrar kullanılabilir |
| Başarı | Hedefe tam ulaşma | Tam sonuç veya süre sonunda en yakın sonuç |
| İfade yapısı | Doğrusal işlem listesi | Parantezleri koruyan ifade ağacı |

Bu nedenle mevcut `GameScreen`, klasik `Level` tipi ve yol tabanlı `solver` doğrudan genişletilmemelidir. Ayrı mod sınırı korunmalıdır.

## 3. Önerilen oyun kuralları

### 3.1 Standart tur

1. Oyuncuya altı pozitif tam sayı gösterilir.
2. Sistem `100–999` arasında bir hedef üretir.
3. Süre ilk oynanabilir sürümde **60 saniyedir**.
4. Oyuncu havuzdan iki sayı seçer ve dört işlemden birini uygular.
5. Seçilen iki sayı tüketilir; işlem sonucu yeni bir taş olarak havuza eklenir.
6. Kaynak sayıların her biri en fazla bir kez kullanılabilir.
7. Bir ara sonuç, sonraki işlemlerde bir kez tüketilene kadar normal sayı gibi kullanılabilir.
8. Altı sayının tamamını kullanmak zorunlu değildir.
9. Hedefe ulaşıldığında tur anında başarıyla biter.
10. Süre bittiğinde oyuncunun tur boyunca oluşturduğu hedefe en yakın geçerli sonuç değerlendirilir.

### 3.2 Matematiksel güvenlik kuralları

V2 ilk sürümü için önerilen varsayılan kural seti:

- Sıfıra bölme yasaktır.
- Bölme yalnızca pozitif tam sayı sonuç veriyorsa geçerlidir.
- Çıkarma yalnızca pozitif sonuç veriyorsa geçerlidir.
- `0`, negatif sayı ve kesir ara sonuç olarak üretilmez.
- Değişmeli işlemlerde (`+`, `×`) operand sırası oyuncuya tekrar seçtirilmez.
- Çıkarma ve bölmede sıra arayüzde açıkça gösterilir: `A − B`, `A ÷ B`.
- Mutlak ara sonuç üst sınırı ilk sürümde `999.999` olur.
- En az bir işlem yapılmadan başlangıç sayısının hedefe eşit olması geçerli tur sayılmaz; üretici zaten bu durumu oluşturmamalıdır.

Bu sınırlamalar hem klasik oyun hissini korur hem de mobil arayüzde gereksiz kesir/işaret karmaşasını engeller. İleri zorlukta negatif veya rasyonel ara sonuçlar ayrı bir kural profiliyle açılabilir; V2 MVP’ye dahil edilmemelidir.

### 3.3 Sayı üretim profili

Önerilen standart havuz:

- **Küçük sayılar:** `1–10`; tekrar bulunabilir.
- **Büyük sayılar:** `25, 50, 75, 100`; aynı turda aynı büyük sayı tekrar seçilmez.
- **Standart dağılım:** Beş küçük + bir büyük sayı.

Zorluk profilleri:

| Profil | Sayı dağılımı | Hedef | Süre | Amaç |
|---|---|---:|---:|---|
| Eğitim | 6 küçük | 100–399 | Süresiz / 90 sn | Arayüzü öğretmek |
| Kolay | 5 küçük + 1 büyük | 100–499 | 75 sn | 2–3 işlemli çözüm |
| Standart | 5 küçük + 1 büyük | 100–999 | 60 sn | 3–5 işlemli çözüm |
| Zor | 4 küçük + 2 büyük | 300–999 | 45 sn | Düşük dallanmalı 4–5 işlem |
| Usta | Seed tabanlı kontrollü dağılım | 100–999 | 30–45 sn | Az ve gizli çözüm |

Sayı havuzu ve süre değerleri uzaktan değişen içerik yerine sürümlü bir `RuleProfile` içinde tutulmalıdır. Böylece denge değişiklikleri kayıt uyumluluğunu bozmaz.

## 4. Tur ve etkileşim akışı

Önerilen mobil akış:

```text
Mod seçimi
  → Zorluk seçimi
  → Altı sayı + hedef gösterimi
  → Kısa geri sayım (3, 2, 1)
  → İki sayı seç
  → İşlem seç
  → Sonucu havuza ekle
  → Hedef bulundu mu?
      ├─ Evet: turu bitir ve çözümü göster
      └─ Hayır: hamleye devam et / geri al / gönder
  → Süre sonu veya oyuncunun “Sonucu Gönder” seçimi
  → Sonuç, puan, en iyi çözüm ve tekrar oyna
```

### 4.1 Önerilen giriş modeli

Sürükleme yerine **dokun–dokun–işlem** modeli kullanılmalıdır:

1. İlk sayı taşı seçilir.
2. İkinci sayı taşı seçilir.
3. Geçerli işlemler dört düğmeli bir panelde açılır.
4. İşlem seçilince iki taş kısa animasyonla birleşir ve sonuç taşı oluşur.

Bu yöntem erişilebilirlik, tek elle kullanım, operand sırasının anlaşılması ve geri alma bakımından daha güvenlidir. İleride sürükle-bırak bir alternatif olarak test edilebilir ancak MVP’yi bloke etmemelidir.

### 4.2 Temel kontroller

- **Geri Al:** Son birleşmeyi geri çevirir; iki operandı havuza döndürür.
- **Temizle:** Turu aynı sayılar ve aynı hedefle başlangıç durumuna getirir; süreyi geri almaz.
- **Sonucu Gönder:** O ana kadarki en yakın sonucu kilitler.
- **Duraklat:** Süreyi ve etkileşimi durdurur; sayıların üstünü örter.
- **Çözüm:** Yalnızca tur bittikten sonra görünür.

Her hamle sonrası ifade örneğin `((75 × 8) + (9 × 3))` biçiminde korunmalı; yalnızca son sayısal sonuç gösterilmemelidir.

## 5. Puanlama ve başarı ölçümü

Puanlama hem hedefe yakınlığı hem süreyi hem de işlem verimliliğini ödüllendirmelidir.

### 5.1 Sonuç derecesi

```text
Fark = |Hedef − Oyuncu Sonucu|
```

| Fark | Sonuç etiketi | Temel puan |
|---:|---|---:|
| 0 | Tam İsabet | 1.000 |
| 1 | Bir Uzakta | 800 |
| 2–5 | Çok Yakın | 600 |
| 6–10 | Yakın | 350 |
| 11–25 | Deneme | 150 |
| 26+ | Tamamlanamadı | 0 |

### 5.2 Bonuslar

- **Süre bonusu:** `round(kalanSüre / toplamSüre × 400)`; yalnızca fark `0–10` ise.
- **Verimlilik bonusu:** Çözümleyicinin bulduğu en az işlem sayısıyla tam sonuçta `200`; her ek işlem için `50` azalır.
- **İpucusuz bonus:** İpucu kullanılmadıysa `100`.
- **Günlük seri:** Puanı şişirmek yerine ayrı seri sayacı olarak tutulur.

İlk denge testinden önce puanlar kesin ürün sözü sayılmamalıdır. Telemetri veya kontrollü kullanıcı testi sonucunda eşikler revize edilebilir.

## 6. İpucu ve öğretici sistemi

İlk açılışta etkileşimli üç adımlı öğretici gerekir:

1. İki sayı seç.
2. İşlem seç ve sonucu havuza geri koy.
3. Oluşan sonucu başka bir sayıyla birleştir.

Kademeli ipuçları:

- **İpucu 1:** Kullanılması faydalı bir kaynak sayıyı vurgular.
- **İpucu 2:** İlk doğru sayı çiftini vurgular.
- **İpucu 3:** İşlemi gösterir.
- **İpucu 4:** Tam çözümün kalan adımlarını oynatır; tur puanı yalnızca pratik olarak kaydedilir.

İpucu, çözümleyicinin kanonik çözüm ağacından üretilmelidir; arayüze sabit metin gömülmemelidir.

## 7. Teknik mimari

Önerilen bağımsız klasör yapısı:

```text
src/modes/numbers-round/
  NumbersRoundScreen.tsx
  NumbersPool.tsx
  NumberToken.tsx
  TargetCard.tsx
  OperationPicker.tsx
  RoundResultModal.tsx
  TutorialOverlay.tsx
  numbersRoundEngine.ts
  numbersRoundSolver.ts
  numbersRoundGenerator.ts
  numbersRoundScoring.ts
  useNumbersRoundProgress.ts
  types.ts
  __tests__/
```

Ortaklaştırma ancak ikinci gerçek kullanım doğrulandıktan sonra yapılmalıdır:

```text
src/game/math/
  values.ts         # kesin sayı işlemleri
  operators.ts      # ortak işlem sembolleri ve hesap yardımcıları
```

Klasik `src/game/engine.ts` dosyasını çok modlu koşullarla büyütmek önerilmez. Önce yeni mod kendi motoruyla çalışmalı; gerçekten aynı olan saf fonksiyonlar daha sonra ortak alana çıkarılmalıdır.

### 7.1 Yeniden kullanılabilecek parçalar

| Mevcut parça | Kullanım kararı |
|---|---|
| `src/game/mathValue.ts` | Kesin hesap altyapısı için yeniden kullanılabilir; MVP tam sayıyla sınırlı kalır |
| `src/types/game.ts` içindeki `Operator` | Geçici olarak paylaşılabilir; uzun vadede ortak matematik tipine taşınabilir |
| Tema ve renkler | Doğrudan paylaşılır |
| Haptik ve modal tasarım dili | Davranış örneği olarak paylaşılır |
| Klasik `calculate` | Kural bağımlılığı nedeniyle doğrudan kullanılmaz |
| Klasik `solver` | Komşu yol aradığı için kullanılmaz |
| Klasik ilerleme kaydı | Kesinlikle paylaşılmaz |
| Duvar Yıkma durumu/motoru | Paylaşılmaz |

### 7.2 Önerilen veri modeli

```ts
type NumbersRoundRules = {
  id: string;
  timeLimitSeconds: number;
  targetMin: number;
  targetMax: number;
  requirePositiveResults: boolean;
  requireExactDivision: boolean;
  maxIntermediateValue: number;
};

type ExpressionNode =
  | { kind: 'source'; id: string; value: number }
  | {
      kind: 'operation';
      id: string;
      operator: '+' | '−' | '×' | '÷';
      left: ExpressionNode;
      right: ExpressionNode;
      value: number;
    };

type NumbersRoundPuzzle = {
  id: string;
  seed: string;
  rulesId: string;
  sources: number[];
  target: number;
  knownSolution: ExpressionNode;
  optimalOperationCount: number;
  difficultyScore: number;
  generatorVersion: number;
};

type NumbersRoundState = {
  puzzle: NumbersRoundPuzzle;
  pool: ExpressionNode[];
  history: ExpressionNode[][];
  bestAttempt: ExpressionNode | null;
  secondsRemaining: number;
  status: 'ready' | 'playing' | 'paused' | 'completed' | 'expired';
};
```

`ExpressionNode` kullanılması kritik bir karardır. Yalnızca hamle metni saklamak; parantezleri, operand sahipliğini, geri alma işlemini ve çözüm doğrulamasını kırılgan hâle getirir.

## 8. Oyun motoru davranışı

Motor, React bileşenlerinden bağımsız saf fonksiyonlar içermelidir:

- `canCombine(left, right, operator, rules)`
- `combine(left, right, operator, rules)`
- `undo(state)`
- `getClosestExpression(pool, history, target)`
- `getDistance(value, target)`
- `formatExpression(node)`
- `validateExpression(node, sourceIds, rules)`

Bir işlem şu kontrollerden geçmelidir:

1. İki farklı ve halen aktif havuz öğesi seçilmiş mi?
2. Sıfıra bölme var mı?
3. Bölme tam sonuç veriyor mu?
4. Çıkarma sonucu pozitif mi?
5. Sonuç üst sınırı aşıyor mu?
6. İfade ağacındaki kaynak kimlikleri benzersiz mi?

UI hiçbir zaman sonucu kendi başına hesaplamamalı; motorun döndürdüğü yeni durumu göstermelidir.

## 9. Çözümleyici tasarımı

Mevcut yol tabanlı DFS yerine **alt küme dinamik programlama** önerilir.

Altı kaynak sayı için her kaynak bir bit ile temsil edilir. Her alt kümede ulaşılabilen değerler ve bu değerlere ait en iyi ifadeler saklanır:

```text
DP[maske][değer] = en iyi ifade + işlem sayısı
```

Her maske iki ayrık alt maskeye bölünür; bu iki alt maskenin sonuçları dört işlemle birleştirilir. Budama kuralları:

- Aynı maske ve aynı değer için yalnızca kanonik en iyi ifade tutulur.
- `+` ve `×` için simetrik operand sıraları tekrar aranmaz.
- Geçersiz bölme, pozitif olmayan sonuç ve üst sınır elenir.
- Tam çözüm bulunamazsa hedefe en yakın değer, sonra az işlem, sonra düşük ara değer ölçütleriyle sıralanır.

Altı sayı için durum alanı mobil cihazda yönetilebilirdir. Yine de çözümleyici tur sırasında her dokunuşta baştan çalıştırılmamalı; bulmaca üretilirken analiz sonucu paketlenmeli veya arka planda bir kez hesaplanmalıdır.

Çözümleyicinin sorumlulukları:

- Üretilen hedefin ulaşılabilir olduğunu doğrulamak.
- En az işlem sayısını bulmak.
- Alternatif çözüm sayısını yaklaşık/limitli olarak ölçmek.
- Kademeli ipucu üretmek.
- Süre sonunda en yakın teorik sonucu göstermek.
- Testlerde motorun reddettiği ifadeleri çözüm olarak kabul etmemek.

## 10. Bulmaca üretimi ve zorluk

Üretim “hedefi rastgele seç, sonra çözülebilir mi bak” yaklaşımına dayanmamalıdır. Önerilen süreç:

1. Seed ile altı kaynak sayı üret.
2. Bu sayılardan kurallara uygun bir ifade ağacı oluştur.
3. Ağacın sonucunu hedef adayı yap.
4. Hedef `100–999` aralığında değilse adayı reddet.
5. Çözümleyiciyle hedefi yeniden doğrula.
6. Çok kolay, anlamsız veya aşırı çok çözümlü adayları zorluk profiline göre ele.
7. Bulmacayı `generatorVersion` ile kaydet.

Önerilen zorluk sinyalleri:

- En az işlem sayısı
- Tam çözüm sayısı veya limitli çözüm yoğunluğu
- Çarpma/bölme zorunluluğu
- Büyük sayı kullanım zorunluluğu
- İlk doğru hamlenin olası hamlelere oranı
- Hedefe çok yakın fakat yanlış “tuzak” sonuç sayısı
- En büyük ara sonuç

Zorluk yalnızca hedefin büyüklüğüne göre belirlenmemelidir.

## 11. Mod girişi ve navigasyon

V2’de `AppMode` aşağıdaki gibi genişleyebilir:

```ts
type AppMode = 'classic' | 'wall-breaker' | 'numbers-round';
```

Ancak ayarlar ekranında art arda mod kartları büyütmek yerine bir **Oyun Modları** ekranına geçilmesi önerilir:

```text
Oyun Modları
  ├─ Klasik Hedef Sayı
  ├─ Bir İşlem
  └─ Duvar Yıkma
```

Uygulama yine son açık klasik seviyeyi korumalıdır. “Bir İşlem” modundan geri dönmek klasik ilerlemeyi, süreyi veya seçili seviyeyi sıfırlamamalıdır.

## 12. Kayıt ve sürümleme

Önerilen ayrı AsyncStorage anahtarı:

```text
hedef-sayi-numbers-round-v1
```

Asgari kayıt alanları:

```ts
type NumbersRoundProgress = {
  schemaVersion: 1;
  totalRoundsPlayed: number;
  exactSolutions: number;
  bestScore: number;
  bestExactTimeSeconds: number | null;
  currentDailyStreak: number;
  longestDailyStreak: number;
  lastDailyCompletedDate: string | null;
  difficultyStats: Record<string, {
    played: number;
    exact: number;
    bestScore: number;
  }>;
};
```

Devam eden turu kaydetmek MVP için gerekli değildir. Uygulama kapanırsa tur iptal sayılabilir. Daha sonra oturum kurtarma eklenirse mutlak bitiş zamanı saklanmalı; yalnızca kalan saniyeyi kaydetmek süre hilesine açıktır.

## 13. Günlük oyun ve tekrar oynanabilirlik

İlk oynanabilir sürümde iki alt mod yeterlidir:

- **Serbest Oyun:** Her tur yeni seed; seçilen zorlukta sınırsız oyun.
- **Günün İşlemi:** Yerel tarihe ve `generatorVersion` değerine bağlı ortak seed; günde bir puanlı deneme.

Günlük seed örneği:

```text
numbers-round:v1:2026-07-27:standard
```

Aynı bulmacanın gelecekte algoritma değişince farklılaşmaması için üretici sürümü seed ve kayıtla birlikte tutulmalıdır.

Çevrim içi liderlik tablosu V2 MVP dışında kalmalıdır. Eklenirse istemcinin yalnızca skoru göndermesi yeterli değildir; seed, hamle listesi ve süre olayları sunucuda doğrulanmalıdır.

## 14. Görsel tasarım ve erişilebilirlik

- Mevcut Doğa Camı ve Sıcak Kâğıt temaları korunur.
- Altı kaynak sayı ile ara sonuçlar görsel olarak ayrılır; ara sonuçta küçük ifade/“sonuç” işareti bulunur.
- Seçili birinci ve ikinci operand farklı kenarlık durumlarıyla gösterilir.
- İşlem düğmeleri en az `44×44 pt` dokunma alanına sahip olur.
- Renk tek başına durum iletmez; şekil, sıra numarası ve metin de kullanılır.
- Ekran okuyucu etiketi örneği: “Birinci sayı 75 seçildi”, “75 bölü 3, sonuç 25”.
- Hareket azaltma ayarında birleşme animasyonu kısa opaklık geçişine dönüşür.
- Sürenin son 10 saniyesinde yalnızca renk değişimi yapılmaz; metin ve isteğe bağlı haptik kullanılır.
- Süresiz pratik modu erişilebilirlik seçeneği değil, herkese açık eğitim seçeneği olarak sunulur.

## 15. Ses, haptik ve geri bildirim

- Sayı seçimi: hafif haptik.
- Geçerli işlem: kısa birleşme sesi ve orta haptik.
- Geçersiz işlem: taşları tüketmeden kısa hata titreşimi ve neden metni.
- Tam isabet: belirgin fakat kısa başarı sekansı.
- Yakın sonuç: başarısızlık dili yerine “Hedefe 3 kaldı” gibi ilerleme dili.

Ses kapalıyken hiçbir bilgi kaybolmamalıdır.

## 16. Test stratejisi

### 16.1 Birim testleri

- Dört işlemin geçerli örnekleri
- Sıfıra bölme reddi
- Tam olmayan bölme reddi
- Sıfır/negatif çıkarma reddi
- Aynı kaynak kimliğinin iki kez kullanılamaması
- Ara sonuç üst sınırı
- Geri almanın havuzu birebir kurması
- İfade biçimlendirme ve parantezler
- Puan eşikleri
- Seed tekrar üretilebilirliği

### 16.2 Çözümleyici testleri

- Bilinen bulmacada tam çözüm bulma
- Tüm kaynakları kullanmadan çözüm bulma
- Aynı değerli iki farklı kaynak taşı doğru ayırma
- Değişmeli işlem tekrarlarını kanonikleştirme
- Çözümsüz hedefte en yakın sonucu bulma
- Motorla aynı kural setini uygulama
- Sabit seed kümesinde performans sınırı

### 16.3 Entegrasyon ve manuel testler

- Modlar arasında ilerleme kaybı olmadan geçiş
- Arka plana alınca zamanlayıcının doğru davranması
- Hızlı çift dokunma ve aynı taşı iki kez seçme
- Geri al/temizle/süre sonu yarış durumları
- Küçük telefon, tablet, yatay ekran ve web
- Her iki tema, büyük metin ve ekran okuyucu
- 100 ardışık turda bellek ve etkileşim performansı

## 17. Analitik ve denge ölçümleri

Kullanıcı onayı ve gizlilik politikasına uygun olarak yalnızca ürün dengesi için gerekli olaylar düşünülmelidir:

- `numbers_round_started`
- `numbers_round_move_committed`
- `numbers_round_hint_used`
- `numbers_round_completed`
- `numbers_round_abandoned`

Ölçülecek temel değerler:

- Tam çözüm oranı
- Ortalama hedef farkı
- İlk hamleye kadar geçen süre
- Ortalama hamle sayısı
- Hangi zorlukta tur terk edildiği
- İpucu basamağı kullanım oranı
- Çözümleyicinin zorluk puanı ile gerçek başarı oranı ilişkisi

Ham ifade veya kişisel veri gönderilmesi gerekmiyorsa gönderilmemelidir. Çevrim dışı oyun analitiksiz tamamen çalışmalıdır.

## 18. Aşamalı geliştirme planı

### Aşama 0 — Karar doğrulama

- Bu dokümandaki kural setini ürün kararı olarak onayla.
- 60 saniye, sayı dağılımı ve puan eşiklerini kâğıt prototiple test et.
- Dokun–dokun–işlem akışını düşük ayrıntılı prototiple doğrula.

**Çıkış ölçütü:** Beş kullanıcıdan en az dördü yardım almadan ilk işlemi kurabilmeli.

### Aşama 1 — Matematik çekirdeği

- Tipler, saf motor ve ifade ağacı
- Alt küme DP çözümleyici
- Seed tabanlı üretici
- Puanlama
- Birim ve performans testleri

**Çıkış ölçütü:** Sabit test havuzundaki tüm bulmacalar doğrulanmalı; motor ve çözümleyici kural uyuşmazlığı olmamalı.

### Aşama 2 — Dikey oynanabilir dilim

- Tek ekran, altı taş, hedef ve süre
- Dokun–dokun–işlem akışı
- Geri al, temizle, gönder
- Sonuç kartı ve çözüm gösterimi
- Tek tema ve yerel geçici durum

**Çıkış ölçütü:** Gerçek cihazda 20 ardışık tur çökme veya kilitlenme olmadan tamamlanmalı.

### Aşama 3 — Ürün entegrasyonu

- Oyun Modları ekranı
- İki tema
- Ayrı AsyncStorage kaydı
- Eğitim ve kademeli ipucu
- Erişilebilirlik ve hareket azaltma

**Çıkış ölçütü:** Klasik oyun ve Duvar Yıkma kayıtlarında regresyon olmamalı.

### Aşama 4 — İçerik ve denge

- Beş zorluk profili
- Serbest Oyun ve Günün İşlemi
- Zorluk kalibrasyonu
- Ses, haptik ve son animasyonlar
- Kontrollü beta ölçümleri

**Çıkış ölçütü:** Her zorluk için hedeflenen başarı aralığı tanımlanıp beta verisiyle doğrulanmalı.

### Aşama 5 — V2 sonrası seçenekler

- Günlük liderlik tablosu
- Arkadaşla aynı seed
- Asenkron düello
- Negatif/kesirli ileri kural profilleri
- Sezonluk bulmaca paketleri

Bu özellikler ilk V2 teslimatını bloke etmemelidir.

## 19. MVP kabul kriterleri

- Oyuncuya altı sayı ve `100–999` arası hedef verilir.
- Her kaynak sayı en fazla bir kez kullanılabilir.
- İki aktif havuz öğesi dört işlemle birleştirilebilir.
- Sonuç taşı havuza geri döner ve ifade ağacını korur.
- Geçersiz bölme, sıfıra bölme, pozitif olmayan sonuç ve üst sınır reddedilir.
- Tüm sayıları kullanmadan hedefe ulaşmak mümkündür.
- Tam hedef anında algılanır.
- Süre sonunda oyuncunun tur içinde elde ettiği en yakın sonuç bulunur.
- Geri al, temizle, gönder ve duraklat tutarlı çalışır.
- Üretilen puanlı her bulmaca çözümleyici tarafından doğrulanmıştır.
- Çözüm ve ipuçları gerçek kaynak kimliklerini birer kez kullanır.
- Kayıt anahtarı diğer modlardan ayrıdır.
- Moddan çıkmak klasik ve Duvar Yıkma durumunu değiştirmez.
- Büyük metin, ekran okuyucu ve hareket azaltma ile tur tamamlanabilir.
- iOS, Android ve web için TypeScript kontrolü geçer.

## 20. Riskler ve azaltma planı

| Risk | Etki | Azaltma |
|---|---|---|
| Mevcut klasik motoru zorla yeniden kullanmak | Kural karmaşası ve regresyon | Bağımsız motor, yalnızca saf matematik yardımcılarını paylaşma |
| İfade yerine sadece sayı saklamak | Geri alma ve doğrulama hataları | Kaynak kimlikli ifade ağacı |
| Rastgele hedef üretmek | Çözümsüz veya kalitesiz turlar | Önce çözüm üretme + DP doğrulama |
| Çok kolay tam çözüm | Tekrarlanabilirliğin düşmesi | Çözüm sayısı ve ilk hamle dallanmasıyla filtreleme |
| Mobilde operand sırası belirsizliği | Yanlış çıkarma/bölme | 1 ve 2 sıra işareti, işlem önizlemesi |
| Zamanlayıcı yarış durumları | Süre sonrası hamle kabulü | Tek durum makinesi ve zaman damgası tabanlı sayaç |
| Kayıtların birbirine karışması | İlerleme kaybı | Ayrı anahtar ve şema sürümü |
| Çözümleyici ile motorun farklı kuralları | Geçersiz ipucu/bulmaca | Ortak kural nesnesi ve çapraz testler |
| Puan sömürüsü | Dengesiz sıralama | Kanonik hamle kaydı ve ileride sunucu doğrulaması |

## 21. V2 öncesi netleştirilecek ürün kararları

Uygulamaya başlamadan önce aşağıdaki kararlar kapatılmalıdır:

1. Standart süre 45 mi 60 saniye mi olacak?
2. Geleneksel yakınlık puanı mı, bu dokümandaki oyunlaştırılmış puan mı kullanılacak?
3. Aynı tur içinde “Sonucu Gönder” geri alınabilir mi? Öneri: hayır.
4. Günün İşlemi tek deneme mi, sınırsız pratik + ilk deneme puanı mı? Öneri: ikincisi.
5. Standart dağılım her zaman 5 küçük + 1 büyük mi olacak, oyuncu büyük sayı adedini seçebilecek mi?
6. Tur sona erdiğinde yalnızca bir optimal çözüm mü, oyuncunun çözümüne en yakın öğretici çözüm mü gösterilecek?
7. V2 yayın kapsamı yalnız Serbest Oyun mu, Günün İşlemi de zorunlu mu?

## 22. Önerilen ilk uygulama görevi

V2 geliştirmesi başladığında ilk görev ekran yapmak değil, aşağıdaki başsız teknik dilimi tamamlamak olmalıdır:

1. `ExpressionNode`, kural ve bulmaca tiplerini oluştur.
2. İki düğümü güvenli biçimde birleştiren saf motoru yaz.
3. Kaynak kimliği benzersizliğini doğrula.
4. Altı sayı için alt küme DP çözümleyiciyi yaz.
5. Tam hedef, en yakın hedef ve en az işlem sayısını döndür.
6. En az 50 sabit bulmacalık test kümesi oluştur.
7. Seed tabanlı üreticinin bu testlerde tekrarlanabilirliğini doğrula.
8. Ancak bundan sonra etkileşim ekranına geç.

Bu sıra, görsel prototip ilerlemişken temel kural veya çözümleyici hatası nedeniyle ekranın yeniden yazılması riskini azaltır.

## 23. Sonuç ve önerilen kapsam

“Bir İşlem” modu mevcut uygulamanın matematik temasına doğal biçimde uyuyor; fakat mevcut komşu-yol oyununun içine eklenen bir seçenek olarak tasarlanmamalıdır. En güvenli yapı, bağımsız ekran/durum/kayıt sınırı ve ortak saf matematik yardımcılarıdır.

V2 için önerilen gerçekçi kapsam:

- Altı sayı ve üç basamaklı hedef
- Pozitif tam sayı ara sonuçları
- Dört işlem
- 60 saniyelik standart tur
- Dokun–dokun–işlem arayüzü
- İfade ağacı, geri al ve en yakın sonuç
- Doğrulanmış seed tabanlı üretim
- Serbest Oyun, eğitim ve ayrı yerel kayıt
- Mevcut iki temayla erişilebilir mobil deneyim

Günün İşlemi zorluk ve takvim davranışı test edildikten sonra aynı V2 içinde eklenebilir. Liderlik tablosu, çevrim içi düello, negatif ve kesirli gelişmiş kurallar sonraki sürüme bırakılmalıdır.

