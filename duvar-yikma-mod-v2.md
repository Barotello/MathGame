# Dört İşlem Mobil Bulmaca Oyunu - Ekstra Mod: "Duvar Yıkma" (Wall Breaker)

**Doküman Sürümü:** 2.2 (Uygulama İle Birebir Eşleşen Güncel Sürüm)  
**Son Güncelleme:** 25 Temmuz 2026  
**Entegrasyon Tipi:** Bağımsız Ekstra Mod  
**Hedef Platformlar:** iOS ve Android  
**Ana İlke:** Mevcut tasarım, klasik oyun mantığı, seviyeler ve Deha Bölümleri değiştirilmeden yeni bir mod eklenir.

---

## 1. Moda Genel Bakış

**Duvar Yıkma**, oyunun dört işlem ve kesintisiz parmak sürükleme yaklaşımını casual/arcade strateji yapısıyla birleştiren bağımsız bir moddur.

Klasik oyunda amaç belirli bir yol üzerinden hedef sayıya ulaşmaktır. Bu modda oyuncu 48 karelik sayı matrisinde geçerli bir zincir oluşturur. Seçilen toplama veya çarpma işleminin sonucu duvara hasar olarak gönderilir. Kullanılan kareler kaybolur, hücreler yer çekimiyle düşer ve boşluklar yeni sayılarla dolar.

### Temel Değerler

- **Bağımsız yapı:** Klasik seviyeler, yıldızlar, süreler ve kayıtlar etkilenmez.
- **Arcade hedef:** Oyuncu yalnızca yüksek sonuca değil, uzun ve verimli zincire odaklanır.
- **Risk/ödül:** Uzun zincir puanı yükseltir; negatif sayılar hasarı azaltabilir.
- **Tekrar oynanabilirlik:** Kontrollü tahta üretimi ve yer çekimi her oyunda farklı kararlar oluşturur.
- **Tema uyumu:** Seçili Doğa Camı veya Sıcak Kâğıt teması korunur.

---

## 2. Tahta ve Zincir Kuralları

### 2.1 Uyarlanabilir 48 Karelik Matris

Toplam hücre sayısı her cihazda **48** olarak kalır:

- **Dikey telefon:** 8 satır × 6 sütun
- **Yatay telefon veya tablet:** 6 satır × 8 sütun

Dikey telefonda 8 sütun yerine 6 sütun kullanmak, hücrelerin ve kesir/kök gösterimlerinin okunabilir kalmasını sağlar. Duvar ve HP çubuğu mobilde tahtanın üstünde, geniş yatay ekranlarda tahtanın sağında gösterilebilir.

### 2.2 Zincir Sınıfları

Her hücre sayısal değerinden bağımsız olarak üç zincir sınıfından birini taşır: **Taş, Yaprak veya Kum**. Sınıf, mevcut hücre tasarımını değiştirmek yerine ince kenarlık, küçük nokta veya hafif yüzey tonuyla gösterilir.

Geçerli zincir kuralları:

- Zincir en az 2 hücreden oluşur.
- İlk hücreden sonra yalnızca aynı zincir sınıfındaki hücreler seçilebilir.
- Hücreler yalnızca yatay veya dikey komşu olabilir.
- Aynı hücre bir zincirde ikinci kez kullanılamaz.
- Oyuncu zincir üzerinde bir hücre geri giderse son seçim geri alınır.
- Parmak kaldırıldığında zincir tamamlanır ve işlem uygulanır.

Bu sınıf sistemi olmadan oyuncu her sayıyı birbirine bağlayıp tahtayı yılan şeklinde dolaşarak sürekli 48 hücrelik zincir kurabilir. Sınıflar, uzun zincirleri değerli ve kontrollü hâle getirir.

### 2.3 Perfect Clear

**Perfect Clear**, 48 hücrenin tek bir geçerli zincirde kullanılmasıdır.

- Normal tahtalarda çok nadirdir.
- Özel bonus tahtalarında veya sınıf dönüştüren güçlendirmelerle mümkün olabilir.
- Ödül çarpanı x12.0 olarak korunur.
- Perfect Clear sonrasında tahta tek animasyonla yenilenir.

### 2.4 Sayı Aileleri

#### İlk oynanabilir sürüm

- Pozitif tam sayılar
- Negatif tam sayılar
- Çarpma jokeri olarak 1

#### İleri sürüm

- Kesirler: 1/2, 3/4
- Ondalık denge sayıları: 0.5
- Köklü sayılar: √2, √3

Kesir ve köklü sayılar kayan nokta değerleriyle doğrudan hesaplanmamalıdır. Örneğin √3 × √3 işleminin kesin olarak 3 olabilmesi için rasyonel veya sembolik bir sayı modeli gerekir. Bu model tamamlanana kadar bu sayı aileleri ileri sürüm kapsamında kalır.

---

## 3. İşlem Seçimi ve Hamle Akışı

Ana oyundaki 120° hilal işlem yayı klasik oyunda değişmeden kalır. Duvar Yıkma modunda uzun zincir hareketini kesmemek için işlem hamleden önce sabit bir kontrol üzerinden seçilir:

```text
[ + TOPLAMA ]    [ × ÇARPMA ]
```

1. Oyuncu toplama veya çarpma işlemini seçer.
2. Başlangıç hücresine dokunur ve parmağını kaldırmadan geçerli komşulara sürükler.
3. Zincir kurulurken hücre sayısı, tahmini hasar, çarpan ve tahmini puan canlı güncellenir.
4. Parmak kaldırılınca işlem sonucu hesaplanır.
5. Pozitif sonuç duvara hasar olarak uygulanır.
6. Puan ve kombo geri bildirimi gösterilir.
7. Kullanılan hücreler parçalanır.
8. Hücreler aşağı düşer ve boşluklar kontrollü üreticiyle doldurulur.

İşlem zincir başlamadan değiştirilebilir. Zincir başladıktan sonra parmak kaldırılana veya hamle iptal edilene kadar kilitlenir.

---

## 4. Hasar ve Sayısal Güvenlik

### 4.1 Gerçek Hasar ve Negatif Sonuç Cezası (Penalty)

İşlem sonucuna göre duvara verilen hasar veya ceza şöyle uygulanır:

```text
Pozitif Sonuç = max(0, İşlem Sonucu)
Gerçek Hasar  = min(Pozitif Sonuç, 1.000.000.000)
Ceza (Penalty) = min(max(0, -İşlem Sonucu), 1.000.000.000)
```

- **Pozitif Sonuçlar:** Duvara `Gerçek Hasar` verir ve HP azaltır.
- **Negatif Sonuçlar:** 0 hasar verir; ancak sonucun mutlak değeri kadar **Duvar Gücü Cezası (+HP)** hesaplanır. Bu ceza duvarın maksimum canlılığına eklenir (`wallMaxHealth + penalty`) ve skordan eksiltilir. Kullanılan hücreler tüketilir. Böylece negatif sayılar stratejik bir risk/ödül mekanizmasına dönüşür.

Çarpma zincirinin her ara hesabı da ±1.000.000.000 güvenlik sınırında tutulur. Bu kural Infinity, sayısal taşma ve arayüz bozulmasını engeller.

### 4.2 Skor Hasarı

```text
Skor Hasarı = min(Gerçek Hasar, 5.000)
```

Duvar daha yüksek gerçek hasarla tamamen yıkılabilir; ancak skor astronomik çarpma sonuçları nedeniyle şişmez.

---

## 5. Puanlama ve Zincir Bonusu

Uzun zinciri gerçekten ödüllendirmek için hasar çarpanına karesel zincir bonusu eklenir:

```text
Zincir Bonusu = 4 × (Seçilen Kare Sayısı - 2)²

Toplam Puan =
  yuvarla(Skor Hasarı × Zincir Çarpanı)
  + Zincir Bonusu
```

Minimum zincir 2 hücre olduğu için iki hücrelik hamlede zincir bonusu 0 olur.

### 5.1 Zincir Çarpan Tablosu

| Seçilen Kare Sayısı | Çarpan | Görsel Geri Bildirim |
| :---: | :---: | :--- |
| **2–4** | x1.0 | Normal Vuruş |
| **5–8** | x1.8 | Harika Zincir! |
| **9–15** | x2.5 | Mükemmel Kombo! |
| **16–30** | x4.0 | Efsanevi Vuruş! |
| **31–47** | x7.0 | Nükleer Hasar! |
| **48** | x12.0 | **PERFECT CLEAR** |

### 5.2 Düzeltilmiş Puan Örneği

> **Oyuncu A — kısa ve yüksek hasarlı zincir**  
> 500 + 500 = 1.000  
> Hücre: 2 · Çarpan: x1.0 · Zincir bonusu: 0  
> **Toplam puan: 1.000**

> **Oyuncu B — uzun ve düşük hasarlı zincir**  
> 20+15+10+30+25+40+18+22+35+15+10+10 = 250  
> Hücre: 12 · Çarpan: x2.5 · Hasar puanı: 625  
> Zincir bonusu: 4 × (12-2)² = 400  
> **Toplam puan: 1.025**

Oyuncu B daha düşük hasara rağmen daha iyi zincir kurduğu için Oyuncu A'yı geçer. Puan sistemi “uzun zincir kur” hedefiyle tutarlı hâle gelir.

---

## 6. Stratejik Sayı Kullanımları

- **Toplama ve negatifler:** Negatif hücre toplamı düşürür. Oyuncu yüksek zincir çarpanı için negatif hücreyi bilinçli kullanabilir.
- **Çarpma ve negatifler:** Çift sayıda negatif pozitif, tek sayıda negatif negatif sonuç üretir. Negatif sonuç 0 hasar verdiğinden işaret dengesi önemlidir.
- **Joker 1:** Çarpma sonucunu değiştirmeden zinciri uzatır.
- **Sıfır:** İlk sürümde üretilmez. İleri sürümde yüksek riskli engel olabilir.
- **Kesir ve kökler:** Kesin sayı modeli tamamlandıktan sonra açılır.

---

## 7. Alt Modlar

### 7.1 Hedefe Tam Oturtma (Precision)

- Başlangıç duvarı 1.000 HP değerindedir.
- **Hassasiyet ödülü:** Duvarı kalan HP kadar hasarla, taşırmadan yıkmak.
- **Verimlilik ödülü:** Duvarı en az hamlede yıkmak.
- İki ödül bağımsızdır ve birlikte kazanılabilir.
- Hamle eşitliğinde daha kısa süre üst sırada yer alır.
- Kalan HP'den fazla hasar duvarı yıkar fakat hassasiyet bonusu vermez.

### 7.2 Sonsuz Duvar Yıkma (Endless)

- Duvarlar 1.000 → 2.500 → 5.000 → … şeklinde güçlenir.
- Duvar yıkıldığında tahta korunur ve yeni duvar kısa geçişle gelir.
- Amaç en yüksek toplam puana ve yıkılan duvar sayısına ulaşmaktır.
- İlk sürümde skorlar cihazda saklanır.
- Çevrim içi liderlik tablosu ayrı bir backend çalışmasıdır.

---

## 8. Mobil Arayüz

### 8.1 Dikey Telefon Düzeni

```text
┌──────────────────────────────────┐
│ DUVAR YIKMA        EN İYİ 12.450 │
│ ███████░░  650 / 1.000 HP        │
│ [ + TOPLAMA ] [ × ÇARPMA ]       │
├──────────────────────────────────┤
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
│ [ ] [ ] [ ] [ ] [ ] [ ]         │
├──────────────────────────────────┤
│ 12 KARE · x2.5 · 250 HASAR       │
│ TAHMİNİ PUAN 1.025               │
└──────────────────────────────────┘
```

### 8.2 Tasarım Koruma Kuralları

- Kullanıcının mevcut tema seçimi aynen kullanılır.
- Klasik oyundaki tipografi, köşe yarıçapları, gölgeler ve panel dili korunur.
- Duvar Yıkma için ilgisiz yeni bir renk sistemi oluşturulmaz.
- Doğa Camı temasında manzara ve cam yüzeyler devam eder.
- Sıcak Kâğıt temasında arka plansız, mat ve yüksek kontrastlı yüzeyler kullanılır.
- Zincir sınıfları ana hücre rengini kaplamaz; yalnızca ince işaretlerle gösterilir.
- HP kaybı, hücre kırılması ve yer çekimi kısa, performanslı animasyonlarla gösterilir.
- İşlem düğmeleri mat, opak ve yüksek kontrastlı kalır.

---

## 9. Mevcut Oyunu Bozmayan Entegrasyon

Duvar Yıkma, klasik oyun ekranına yeni durumlar ve koşullar eklenerek geliştirilmez. Ayrı bir mod klasöründe tutulur:

```text
src/modes/wall-breaker/
  WallBreakerScreen.tsx
  WallBreakerBoard.tsx
  WallBreakerTile.tsx
  WallHealthCard.tsx
  OperationSelector.tsx
  wallBreakerEngine.ts
  wallBreakerGenerator.ts
  wallBreakerScoring.ts
  useWallBreakerProgress.ts
  types.ts
```

### 9.1 Değiştirilmemesi Gereken Yapılar

- Klasik GameScreen seviye, hedef, süre ve başarı akışı
- Klasik dört işlem hesap motorunun mevcut kuralları
- Klasik seviye verileri ve bilinen çözümler
- Mevcut yıldızlar, bölüm puanları ve son oynanan bölüm
- Ana oyundaki 120° hilal işlem seçimi
- Tema seçimlerinin mevcut davranışı

### 9.2 Yeniden Kullanılabilecek Yapılar

- Tema kimliği ve renkleri
- Panel, başlık ve düğme tasarım dili
- Haptik geri bildirim yaklaşımı
- Saf komşuluk yardımcıları
- Erişilebilirlik etiketleri

Yeni modun oyun durumu klasik GameScreen durumuyla paylaşılmaz.

### 9.3 Mod Giriş Noktası

Uygulama varsayılan olarak klasik oyunda açılmaya devam eder (`AppMode = 'classic' | 'wall-breaker'`). Ayarlar penceresi (`SettingsModal`) içerisindeki "Ekstra Modlar" alanından "Duvar Yıkma" seçilerek modlar arası geçiş sağlanır:

```text
Ayarlar -> Ekstra Modlar -> Duvar Yıkma  ›
```

Duvar Yıkma modundaki geri sol üst sol ok düğmesi (`‹`) oyuncuyu kaldığı klasik bölüme döndürür. Klasik başlangıç akışı ve kaydı değişmez.

### 9.4 Ayrı Kayıt Alanı

```text
Klasik oyun: hedef-sayi-progress-v1
Duvar Yıkma: hedef-sayi-wall-breaker-v1
```

Yeni kayıt alanı en az şunları içerir:

- En yüksek skor
- En yüksek yıkılan duvar sayısı
- Precision en az hamle
- Precision en iyi süre
- Son seçilen alt mod
- Güvenli Endless oturum özeti

---

## 10. Tahta Üretimi ve Yer Çekimi

- Tahta üreticisi tekrar üretilebilir testler için seed kabul eder.
- Başlangıç tahtasında en az bir geçerli 2 hücrelik zincir garanti edilir.
- Sınıflar, uzun zincirlerin mümkün fakat sürekli olmamasını sağlayacak ağırlıklarla dağıtılır.
- Kullanılan hücreler silindikten sonra her sütun bağımsız aşağı çöker.
- Yeni hücreler sütunların üstünden üretilir.
- Yer çekimi sırasında yeni hamle başlatılamaz.
- Hiç geçerli zincir kalmazsa tahta ücretsiz karıştırılır.
- Karıştırma hamle sayısını ve skoru etkilemez.

---

## 11. İlk Sürüm Kabul Kriterleri

- Klasik oyun davranış değişikliği olmadan açılır ve oynanır.
- Klasik ilerleme ile Duvar Yıkma kaydı birbirini etkilemez.
- Dikey telefonda 48 hücrenin tamamı kaydırma gerektirmeden görünür.
- Zincir yalnızca aynı sınıftaki yatay veya dikey komşularla kurulur.
- Aynı hücre iki kez seçilemez.
- Son seçilen hücre geri gidilerek zincirden çıkarılabilir.
- Toplama ve çarpma zincir başlamadan seçilir, zincir sırasında kilitlenir.
- Negatif veya sıfır sonuç 0 hasar verir.
- Ara hesaplar güvenlik sınırını aşmaz.
- Puan bu dokümandaki formülle hesaplanır.
- Yer çekimi ve yeniden dolma sonunda hücreler doğru konumdadır.
- Her iki tema okunabilir ve mobil dokunma hedefleri yeterlidir.
- Moddan çıkıldığında klasik oyun kaldığı bölümden devam eder.

---

## 12. Aşamalı Geliştirme Planı

### Aşama 1 — Çekirdek prototip

- Bağımsız mod ekranı
- 8×6 dikey tahta
- Tam sayılar ve zincir sınıfları
- Toplama
- HP, hasar ve yer çekimi

### Aşama 2 — Oynanabilir ilk sürüm

- Çarpma
- Negatif sayılar ve joker 1
- Puan ve kombo sistemi
- Precision modu
- Yerel kayıt
- İki tema desteği

### Aşama 3 — İçerik ve denge

- Endless modu
- Seed tabanlı üretim
- Tahta karıştırma
- Haptik ve görsel efektler
- Üretim ağırlığı ve çarpan dengesi

### Aşama 4 — İleri sayı sistemi

- Kesin kesir modeli
- Sembolik köklü sayı modeli
- 0.5, √2, √3 ve özel jokerler

### Aşama 5 — Çevrim içi özellikler

- Backend ve liderlik tablosu
- Hileye dayanıklı skor doğrulama
- Günlük seed ve meydan okuma

---

## 13. Revizyon Özeti

### v2.0 → v2.1

| # | Konu | v2.0 Sorunu | v2.1 Kararı |
|---|---|---|---|
| 1 | Serbest zincir | Sürekli Full Clear mümkündü | Üç zincir sınıfı eklendi |
| 2 | Mobil matris | Dikey telefonda 8 sütun küçüktü | Telefonda 8×6, geniş ekranda 6×8 |
| 3 | İşlem seçimi | Hilal yay uzun zinciri kesebilirdi | Hamle öncesi sabit + / × seçici |
| 4 | Puan örneği | 625 puanın 1.000'i geçtiği yazıyordu | Zincir bonusuyla sonuç 1.025 oldu |
| 5 | Negatif sonuç | Hasar davranışı belirsizdi | Negatif ve sıfır sonuç 0 hasar verir |
| 6 | Sayısal taşma | Skor tavanı ham taşmayı önlemiyordu | Ara sonuç ve gerçek hasar sınırı eklendi |
| 7 | Kesir ve kök | Kayan noktayla kesin hesap varsayılıyordu | İleri sürüme taşındı |
| 8 | Entegrasyon | Dosya ve kayıt sınırları tanımsızdı | Ayrı klasör ve kayıt anahtarı tanımlandı |
| 9 | Kapsam | Bütün özellikler tek sürüm görünüyordu | Beş aşamalı plan eklendi |

### v1.0 → v2.0

| # | Konu | v1.0 Durumu | v2.0 Değişikliği |
|---|---|---|---|
| 1 | Örnek tutarlılığı | İşlem örnekleri karışıktı | İşlem türüne göre ayrıldı |
| 2 | Çarpma skor patlaması | Sınırsızdı | Skor hasarına 5.000 tavanı eklendi |
| 3 | Çarpan eğrisi | Uzun zinciri az ödüllendiriyordu | Çarpan eğrisi agresifleştirildi |
| 4 | Negatif sayı rolü | Tanımsızdı | Risk/ödül unsuru oldu |
| 5 | Precision koşulları | İki koşul çakışıyordu | Hassasiyet ve verimlilik ayrıldı |
| 6 | Matris boyutu | Örnek 6×6 idi | Toplam 48 hücreye çıkarıldı |
