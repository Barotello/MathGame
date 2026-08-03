# Hedef Sayı

Dört işlem tabanlı mobil bulmaca oyununun ilk oynanabilir Expo/React Native prototipi.

## Şu anda çalışanlar

- 3×3 sayı tahtası
- Hedef sayı ve ara sonuç takibi
- Yatay/dikey komşu hücre seçimi
- İkinci hücre seçildikten sonra açılan bağlamsal dört işlem menüsü
- Soldan sağa işlem değerlendirme
- Tam bölme, negatif sonuç ve ara sonuç sınırı kontrolleri
- Aynı hücreyi tekrar kullanmayı engelleme
- Geri alma, temizleme ve kazanma durumu
- Android ve iOS için ortak Expo SDK 57 kod tabanı

İlk bölümün hedefi 60'tır. Örnek çözüm: `(7 + 3) × 6`.

## Çalıştırma

```powershell
npm install
npm start
```

Android emülatörü için `npm run android` kullanılabilir. iOS simülatörünü yerel olarak çalıştırmak için macOS ve Xcode gerekir. Fiziksel cihaz testi için Expo SDK 57 ile uyumlu bir development build kullanılması önerilir; Expo Go desteği geçiş dönemindeki istemci sürümüne göre değişebilir.

## Doğrulama

```powershell
npm run typecheck
```


## Genel sıralama kurulumu

Uygulama, oyuncuları e-posta istemeden Supabase anonim oturumuyla tanır. Ayarlar
ekranındaki **Genel Sıralama**, matematik bölümlerindeki en iyi puanların toplamını
gösterir.

1. Supabase'te yeni bir proje oluşturun ve **Authentication → Providers → Anonymous**
   seçeneğini etkinleştirin. Üretimde kötüye kullanımı azaltmak için CAPTCHA açılması
   önerilir.
2. `supabase/migrations/20260803124856_create_global_leaderboard.sql` dosyasını
   projenize uygulayın.
3. `.env.example` dosyasını `.env.local` olarak kopyalayın; proje URL'sini ve
   `sb_publishable_...` anahtarını ekleyin. İstemciye secret/service-role anahtarı
   koymayın.
4. Expo geliştirme sunucusunu yeniden başlatın.

Supabase ayarları yokken oyun çevrimdışı çalışmaya devam eder; yalnızca genel
sıralama devre dışı kalır.
## Sonraki geliştirme adımları

1. Seviye seçimi ve çoklu bölüm verisi
2. Kesin rasyonel sayı motoru
3. Kesir, üs ve kök hücreleri
4. Yerel ilerleme kaydı
5. Seviye 10 Pisagor “Deha Bölümü”
6. Ses, titreşim ve gelişmiş animasyonlar

Ana ürün şartnamesi: [dort-islem-mobil-bulmaca-proje-dokumani.md](../outputs/dort-islem-mobil-bulmaca-proje-dokumani.md)
