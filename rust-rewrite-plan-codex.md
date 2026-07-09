# Rust Rewrite Plan for `@kunver/new`

Bu dokuman, mevcut TypeScript tabanli `@kunver/new` CLI aracinin Rust ile yeniden yazilmasi icin uygulanabilir bir plan sunar. Amac, mevcut kullanici deneyimini koruyarak daha hizli, tek binary olarak dagitilabilir ve template kaynagini CLI paketinden ayiran yeni bir mimariye gecmektir.

## Mevcut Durum Ozeti

Proje su anda TypeScript ile yazilmis bir `npx` CLI aracidir. Paket adi `@kunver/new`, bin adi `kunver`.

Mevcut akisin ana parcalari:

- CLI acilisinda versiyon bilgisi gosteriliyor.
- Kullanici proje adi giriyor.
- Kullanici proje tipi seciyor.
- Gerekli starter'larda paket yoneticisi seciliyor.
- Kullanici projenin editor ile acilip acilmayacagini seciyor.
- Secilen starter'a gore template kopyalaniyor veya ek kurulum adimlari calisiyor.
- Template icindeki `_gitignore`, `_prettierrc.json`, `_clang-format` gibi dosyalar kopyalama sonrasinda dotfile adina cevriliyor.

Mevcut starter'lar:

- `react-ts-tw`
- `next-prisma`
- `wxt`
  - `svelte`
  - `vanilla`
  - `solid`
- `uv-notebook`
- `cmake-cpp`

Mevcut ozel davranislar:

- `uv-notebook`, JS paket yoneticisi secmeden template kopyalar ve `uv sync` calistirir.
- `cmake-cpp`, paket yoneticisi secmeden template kopyalar, CMake proje adini klasor adiyla degistirir ve `cmake -S . -B build` calistirmayi dener.
- `wxt`, once framework sectirir, sonra istege bagli `i18n`, `content UI` ve `wxt-storage` degisiklikleri uygular.
- JS tabanli template'lerde secilen paket yoneticisine gore `package.json`, `manager.cjs`, `pnpm-workspace.yaml` ve bazi scriptler duzenlenir.

## Rewrite Hedefleri

1. Mevcut CLI davranisini mumkun oldugunca korumak.
2. Rust ile hizli, guvenilir ve kolay dagitilabilir bir CLI uretmek.
3. Template'leri CLI binary/paketi icinden cikarmak.
4. Mumkun olan template'leri ayri GitHub repo'larina tasimak.
5. Offline veya network hatasi durumlarini kullaniciya net anlatmak.
6. Template kaynaklarini versiyonlanabilir, cache'lenebilir ve test edilebilir hale getirmek.
7. Yeni starter eklemeyi TypeScript haline gore daha kolay ve daha az riskli yapmak.

## Onemli Kararlar

### Paketleme Modeli

Rust CLI'nin npm uzerinden ayni isimle dagitilmasi hedeflenmeli:

- npm package: `@kunver/new`
- bin: `kunver`

Rust binary dagitimi icin iki yol degerlendirilmeli:

- `napi-rs` veya benzeri native npm paketleme modeli
- Platform bazli binary indiren ince bir npm wrapper

Ilk surum icin onerilen yol: platform bazli binary indiren veya paket icinde platform binary'leriyle gelen npm wrapper. Boylece kullanici tarafinda mevcut kullanim korunur:

```bash
pnpm dlx @kunver/new
npx @kunver/new
bunx @kunver/new
```

### Rust Crate Secimleri

Onerilen crate'ler:

- CLI argumanlari: `clap`
- Interaktif promptlar: `inquire` veya `dialoguer`
- Renkli terminal ciktisi: `anstyle`, `console` veya `colored`
- Spinner/progress: `indicatif`
- Process calistirma: `std::process::Command`
- Dosya kopyalama: `fs_extra` veya kontrollu recursive copy implementasyonu
- JSON duzenleme: `serde_json`
- TOML/YAML gerekiyorsa: `toml`, `serde_yaml`
- GitHub repo indirme:
  - Baslangic icin `git` komutu ile clone
  - Daha sonra opsiyonel olarak GitHub archive download destegi
- Temp/cache dizini: `directories`
- Hata yonetimi: `anyhow`
- Testler: Rust unit testleri + integration testleri icin `assert_cmd`, `predicates`, `tempfile`

## Yeni Mimari

Onerilen modul yapisi:

```text
src/
  main.rs
  cli.rs
  config.rs
  prompts.rs
  starter/
    mod.rs
    generic_template.rs
    wxt.rs
    uv_notebook.rs
    cmake_cpp.rs
  template/
    mod.rs
    source.rs
    github.rs
    local.rs
    cache.rs
    copy.rs
  package_manager.rs
  editor.rs
  command.rs
  fs_utils.rs
  errors.rs
```

Sorumluluklar:

- `cli.rs`: non-interactive argumanlar ve global flag'ler.
- `prompts.rs`: interaktif secimler.
- `starter/*`: proje tipine ozel davranislar.
- `template/*`: template kaynagi, indirme, cache, kopyalama.
- `package_manager.rs`: `pnpm`, `npm`, `bun` davranislari.
- `editor.rs`: `code`, `cursor`, `windsurf`, `antigravity` acma akisi.
- `command.rs`: dis komut calistirma ve hata formatlama.

## Template'leri GitHub Repo'larina Tasima Plani

Yeni modelde CLI template dosyalarini kendi icinde tasimamali. Bunun yerine her template icin bir kaynak tanimi kullanilmali.

Onerilen template manifest yapisi:

```rust
Template {
    id: "react-ts-tw",
    source: GitHub {
        owner: "brkunver",
        repo: "template-react-ts-tw",
        reference: "main",
        subdir: None,
    },
    supports_package_manager: true,
}
```

### Ayri Repo'ya Tasinmasi Uygun Template'ler

Bu template'ler dogrudan ayri GitHub repo olarak tasinmaya uygundur:

- `react-ts-tw`
- `next-prisma`
- `uv-notebook`
- `cmake-cpp`
- `wxt-vanilla`
- `wxt-svelte`
- `wxt-solid`

Her repo tek basina calisabilir bir starter template olmali. Ornek repo isimleri:

- `kunver-template-react-ts-tw`
- `kunver-template-next-prisma`
- `kunver-template-uv-notebook`
- `kunver-template-cmake-cpp`
- `kunver-template-wxt-vanilla`
- `kunver-template-wxt-svelte`
- `kunver-template-wxt-solid`

### Ayri Repo'ya Tasinmasi Zor veya Ozel Islem Gerektirenler

`wxt` tek bir template degil, framework secimi ve secim sonrasi mutasyonlar iceren bir starter'dir. Bu nedenle `wxt` starter'i Rust CLI icinde davranis olarak kalmali; ancak kullandigi temel template'ler GitHub repo'larindan gelmeli.

`cmake-cpp` template repo'dan gelebilir, fakat CMake proje adi degistirme ve configure calistirma davranisi CLI icinde kalmali.

`uv-notebook` template repo'dan gelebilir, fakat `uv sync` calistirma davranisi CLI icinde kalmali.

### Template Manifest

Template kaynaklari Rust koduna gomulu sabitlerle baslayabilir. Ancak uzun vadede ayri bir manifest dosyasi daha iyi olur.

Onerilen manifest formati:

```toml
[[templates]]
id = "react-ts-tw"
display_name = "React + TypeScript + Tailwind"
kind = "github"
owner = "brkunver"
repo = "kunver-template-react-ts-tw"
ref = "main"
supports_package_manager = true

[[templates]]
id = "uv-notebook"
display_name = "UV Notebook"
kind = "github"
owner = "brkunver"
repo = "kunver-template-uv-notebook"
ref = "main"
supports_package_manager = false
post_create = ["uv_sync"]
```

Ilk Rust surumunde manifest kod icinde olabilir. Daha sonra CLI icine gomulu default manifest + opsiyonel remote manifest destegi eklenebilir.

## Template Indirme ve Cache Stratejisi

GitHub template kaynaklari icin iki yontem vardir:

1. `git clone --depth 1`
2. GitHub archive ZIP/TAR indirme

Ilk surum icin onerilen yontem: `git clone --depth 1`.

Sebep:

- Daha kolay implementasyon.
- Private repo veya token destekleri ileride daha kolay eklenebilir.
- GitHub archive formatina bagimlilik azalir.

Cache dizini:

```text
~/.cache/kunver-new/templates/
```

Windows icin `directories` crate ile platforma uygun cache dizini kullanilmali.

Cache anahtari:

```text
{owner}-{repo}-{ref}
```

Gerekli davranislar:

- Varsayilan olarak cache kullan.
- `--no-cache` ile her zaman tekrar indir.
- `--refresh` ile cache'i guncelle.
- Indirme basarisiz olursa mevcut cache varsa kullaniciya bilgi vererek cache'den devam et.
- Cache de yoksa net hata mesaji ver.

## CLI Deneyimi

Mevcut interaktif akisi koru:

1. Versiyon goster.
2. Proje adi sor.
3. Proje tipi sor.
4. Gerekirse paket yoneticisi sor.
5. WXT ise framework ve opsiyonlari sor.
6. Editor acma secimi sor.
7. Template indir/kopyala.
8. Starter'a ozel mutasyonlari uygula.
9. Bagimliliklari kur.
10. Sonuc mesajini yaz.

Eklenmesi onerilen non-interactive argumanlar:

```bash
kunver my-app --template react-ts-tw --pm pnpm --editor code
kunver my-app --template wxt --wxt-framework svelte --wxt-i18n --wxt-storage
kunver my-app --template react-ts-tw --no-install
kunver my-app --template react-ts-tw --refresh
```

Bu argumanlar zorunlu degil, fakat Rust rewrite icin guclu bir iyilestirme olur. Interaktif mod varsayilan kalmali.

## Davranis Esleme Listesi

Rust rewrite tamamlanmadan once asagidaki davranislar birebir eslenmeli:

- Proje adi validasyonu:
  - en az 2 karakter
  - sadece kucuk harf, sayi ve tek tire
  - mevcut klasor varsa hata
- `uv-notebook` ve `cmake-cpp` icin paket yoneticisi sorma.
- Default paket yoneticisi: `pnpm`.
- Editor secenekleri:
  - `antigravity`
  - `windsurf`
  - `no`
  - `cursor`
  - `code`
- Dotfile restore:
  - `_gitignore` -> `.gitignore`
  - `_prettierrc.json` -> `.prettierrc.json`
  - `_clang-format` -> `.clang-format`
- JS template'lerde:
  - `package.json.name` proje adiyla degismeli.
  - `manager` script'i secilen paket yoneticisine gore yazilmali.
  - `resize` script'i secilen paket yoneticisine gore guncellenmeli.
  - `zip:all` script'i Bun icin ozel guncellenmeli.
  - `pnpm-workspace.yaml`, paket yoneticisi `pnpm` degilse kaldirilmali.
  - Bun icin trusted dependency bilgileri mumkunse korunmali.
- WXT:
  - framework secimi korunmali.
  - `i18n` opsiyonu `@wxt-dev/i18n` eklemeli.
  - `wxt-storage` opsiyonu storage permission ve ornek dosya eklemeli.
  - content UI istenmezse content klasoru kaldirilmali ve `content.ts` uretilmeli.
- CMake:
  - `CMakeLists.txt` icindeki `project(...)` adi degismeli.
  - `cmake -S . -B build` denenmeli.
  - CMake yoksa olusturma tamamen fail olmamali; kullaniciya manuel komut soylenmeli.
- UV:
  - `uv sync` calismali.
  - `uv` yoksa net kurulum mesaji verilmeli.

## Asamali Uygulama Plani

### 1. Hazirlik ve Envanter

- Mevcut TypeScript davranislarini testlerden ve koddan listele.
- Her starter icin beklenen dosya ciktilarini belgeye yaz.
- Template icinde yer alan dotfile placeholder'larini listele.
- Mevcut README kullanimlarini koruma hedefi olarak kabul et.
- GitHub template repo isimlerini netlestir.

Teslim:

- Davranis matrisi.
- Template repo listesi.
- Rust rewrite kapsam disi kalacak maddeler listesi.

### 2. Rust Proje Iskeleti

- `Cargo.toml` olustur.
- `src/main.rs` ve temel modul yapisini kur.
- `clap` ile CLI argumanlarini tanimla.
- Interaktif prompt crate'ini sec ve basit prompt akisini kur.
- Versiyon bilgisini Cargo metadata uzerinden okut.

Teslim:

- `kunver --version`
- `kunver --help`
- Basit interaktif proje adi ve template secimi

### 3. Template Kaynak Katmani

- `TemplateSource` abstraction'i kur.
- `GitHubTemplateSource` implementasyonu ekle.
- `LocalTemplateSource` sadece test ve gelistirme icin ekle.
- Cache dizinini platform uyumlu belirle.
- `--refresh` ve `--no-cache` davranislarini tasarla.

Teslim:

- GitHub repo'dan template clone edebilen temel akisi.
- Cache kullanan ve cache yenileyen implementasyon.

### 4. Template Kopyalama

- Recursive kopyalama implementasyonu ekle.
- Hedef klasor onceden varsa fail et.
- Dotfile restore davranisini ekle.
- Template repo icinde `.git` klasoru kalmamali.
- Gerekirse template repo metadata dosyalari hedef projeye kopyalanmamalidir.

Teslim:

- GitHub template kaynakli `react-ts-tw` proje olusturma.

### 5. Paket Yoneticisi Davranislari

- `pnpm`, `npm`, `bun` enum olarak modellenmeli.
- `package.json` duzenlemeleri `serde_json` ile yapilmali.
- `pnpm-workspace.yaml` kaldirma ve Bun trusted dependency cevirisi eklenmeli.
- Bagimlilik kurulumu `Command` ile calistirilmali.

Teslim:

- `react-ts-tw`, `next-prisma` ve WXT template'leri icin paket yoneticisi secimine gore dogru cikti.

### 6. Starter Katmani

- `GenericTemplateStarter` ekle.
- `UvNotebookStarter` ekle.
- `CmakeCppStarter` ekle.
- `WxtStarter` ekle.
- Her starter'in post-create hook'larini Rust tarafinda ayri fonksiyonlara bol.

Teslim:

- Mevcut tum starter'lar Rust CLI ile olusturulabilir hale gelmeli.

### 7. WXT Ozel Mantigi

- Framework secimi:
  - `svelte`
  - `vanilla`
  - `solid`
- GitHub repo kaynak eslemesi:
  - `wxt-svelte`
  - `wxt-vanilla`
  - `wxt-solid`
- `i18n` mutasyonu.
- `content UI` mutasyonu.
- `wxt-storage` mutasyonu.

Teslim:

- TypeScript surumundeki WXT davranisi ile ayni dosya degisiklikleri.

### 8. Editor Acma

- `code`, `cursor`, `windsurf`, `antigravity` komutlarini destekle.
- Editor komutu basarisiz olursa proje olusturma basarisiz sayilmamali.
- Kullaniciya editor acilamadigini ve proje yolunu goster.

Teslim:

- `--editor code` ve interaktif editor secimi.

### 9. Testler

Test seviyeleri:

- Unit test:
  - proje adi validasyonu
  - dotfile restore
  - package.json mutasyonlari
  - CMake project name replace
  - WXT config mutasyonlari
- Integration test:
  - temp klasorde `react-ts-tw` olusturma
  - temp klasorde `uv-notebook` olusturma, `uv sync` mock veya skip
  - temp klasorde `cmake-cpp` olusturma, `cmake` mock veya skip
  - WXT framework secimleri
- CLI smoke test:
  - `kunver --help`
  - `kunver --version`
  - non-interactive proje olusturma

GitHub template repo kullanan testlerde network'e bagimli testler default kapali olmali. Testlerde local fixture template kaynaklari kullanilmali.

### 10. Gecis ve Yayinlama

- Rust CLI once feature branch'te gelistirilmeli.
- Mevcut TypeScript surumu referans olarak korunmali.
- Template repo'lari hazirlanmadan Rust surumu main'e alinmamali.
- npm package yayinlama akisi guncellenmeli.
- CI asagidakileri calistirmali:
  - `cargo fmt --check`
  - `cargo clippy -- -D warnings`
  - `cargo test`
  - binary build
  - npm wrapper package testi

## Template Repo Hazirlama Checklist'i

Her template repo icin:

- Repo tek basina okunabilir README icermeli.
- Template dosyalari repo root'unda olmali veya manifestte `subdir` belirtilmeli.
- Template icinde gereksiz lock dosyalari tutulup tutulmayacagi bilincli kararlastirilmali.
- `_gitignore` gibi placeholder isimleri korunmali veya yeni sistemde dogrudan dotfile desteklenecekse standartlastirilmali.
- Template repo'ya ait `.github`, license veya meta dosyalarin hedef projeye kopyalanip kopyalanmayacagi belirlenmeli.
- Template'in Rust CLI tarafindan degistirilecek alanlari minimum tutulmali.
- Her repo icin smoke test komutu belirlenmeli.

## Riskler ve Cozumler

### Network Bagimliligi

Template'ler GitHub'dan gelecegi icin ilk kullanim network ister.

Cozum:

- Cache kullan.
- Cache varsa network hatasinda cache'den devam et.
- Hata mesajlarini net yaz.

### Git Kurulu Olmayabilir

`git clone` kullanilirsa kullanicinin makinesinde Git gerekir.

Cozum:

- Ilk surumde Git gereksinimini dokumante et.
- Daha sonra GitHub archive download destegi ekle.

### Template Repo Versiyon Uyumsuzlugu

CLI ve template repo'lari farkli hizlarda degisebilir.

Cozum:

- Template ref degerlerini sabitleme opsiyonu ekle.
- CLI release'lerinde uyumlu template commit/tag bilgisi kullan.
- Uzun vadede remote manifest versiyonlama ekle.

### npm Uzerinden Rust Binary Dagitimi

Platform uyumlulugu ve binary yayinlama TS paketinden daha karmasik olabilir.

Cozum:

- CI'da Windows, macOS, Linux build uret.
- npm wrapper'i basit tut.
- Her release'te smoke test calistir.

## Onerilen Ilk Milestone

Ilk calisir Rust surumu su kapsami hedeflemeli:

- `kunver --help`
- `kunver --version`
- Interaktif proje adi secimi
- `react-ts-tw` starter
- GitHub template clone
- Cache
- Dotfile restore
- `pnpm install`
- `package.json.name` degistirme

Bu milestone tamamlandiktan sonra diger starter'lar sirasiyla eklenmeli:

1. `next-prisma`
2. `uv-notebook`
3. `cmake-cpp`
4. `wxt-vanilla`
5. `wxt-svelte`
6. `wxt-solid`
7. WXT opsiyonel mutasyonlari

## Bitis Kriterleri

Rust rewrite tamamlanmis sayilmasi icin:

- Mevcut README'deki tum starter'lar Rust CLI ile olusturulabilmeli.
- Template'lerin mumkun olanlari ayri GitHub repo'larindan gelmeli.
- CLI paketi halen `@kunver/new` olarak kullanilabilmeli.
- Bin adi halen `kunver` olmali.
- Mevcut TypeScript davranislari icin test karsiliklari olmali.
- Network yokken cache varsa proje olusturma calismali.
- Network yokken cache yoksa kullanici net hata almali.
- Windows, macOS ve Linux icin release build alinabilmeli.

