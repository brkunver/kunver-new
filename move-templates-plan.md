# Template Repo'lara Tasima Plani

## Amac

Bu repo su anda hem `@kunver/new` CLI kodunu hem de template dosyalarini birlikte tasiyor. `tsup` build sirasinda `src/public` altindaki template'ler `dist/templates` icine paketleniyor. Bu model kucuk template setleri icin basit, fakat template sayisi ve boyutu arttikca CLI paketini sisiriyor, template guncellemelerini CLI release'ine bagliyor ve template'lerin kendi repo/test/release disiplinini zorlastiriyor.

Hedef model:

- CLI sadece starter secimi, proje adi, paket yoneticisi, editor acma ve post-create pipeline'ini yonetsin.
- Tasinarak disarida tutulabilecek template'ler kendi Git repo'larinda yasasin.
- CLI template kaynagini bir registry/manifest uzerinden bulsun ve hedef klasore clone/download etsin.
- Template'e ozel ek islemler CLI tarafinda acikca tanimli post step'ler olarak kalsin.
- Tamamen CLI tarafindan uretilmesi veya lokal tutulmasi daha dogru olan template'ler disariya tasinmasin.

## Mevcut Durum

Mevcut template klasorleri:

- `src/public/templates/react-ts-tw`
- `src/public/templates/next-prisma`
- `src/public/templates/wxt-vanilla`
- `src/public/templates/wxt-solid`
- `src/public/templates/wxt-svelte`
- `src/public/templates/uv-notebook`
- `src/public/templates/cmake-cpp`

Mevcut akis:

1. Kullanici proje adini secer.
2. Kullanici project type secer: `react-ts-tw`, `next-prisma`, `wxt`, `uv-notebook`, `cmake-cpp`.
3. JS tabanli starter'larda package manager secer: `pnpm`, `npm`, `bun`.
4. Generic template'ler `createTemplateProject` ile kopyalanir.
5. `copyTemplateFolder` template klasorunu hedefe kopyalar ve `_gitignore`, `_prettierrc.json`, `_clang-format` gibi underscore ile saklanan dosyalari dotfile'a cevirir.
6. `createTemplateProject` sirasiyla su adimlari yurutur:
   - template kopyalama
   - varsa `onBeforeInstall`
   - package manager konfigurasyonu
   - dependency install
   - manager script guncelleme
   - build approval
   - package/project name guncelleme
7. WXT, uv-notebook ve CMake icin ozel starter/hook davranislari var.

## Karar Matrisi

| Template | Karar | Gerekce | Gerekli CLI post step |
| --- | --- | --- | --- |
| `react-ts-tw` | Tamamen tasinabilir | Duz Vite/React template. CLI sadece clone, package manager ayari, install ve package name degisimi yapiyor. | `configurePackageManager`, `installDependencies`, `addManagerScript`, `approveBuilds`, `changeProjectName` |
| `next-prisma` | Tamamen tasinabilir | Duz Next/Prisma template. CLI tarafinda template'e ozel hook yok. | `configurePackageManager`, `installDependencies`, `addManagerScript`, `approveBuilds`, `changeProjectName` |
| `wxt-vanilla` | Tasinabilir, ama post script/hook gerekli | WXT starter framework secimi ve opsiyonel `i18n`, `wxt-storage` islemlerini CLI'da yapiyor. Vanilla'da content UI secimi yok ama i18n/storage mutasyonlari var. | WXT opsiyon hook'lari, package manager ayari, install, manager script, build approval, name degisimi |
| `wxt-solid` | Tasinabilir, ama post script/hook gerekli | Template repo'ya alinabilir fakat CLI kullanicinin content UI istememesine gore `entrypoints/content` klasorunu silip `entrypoints/content.ts` olusturuyor. i18n/storage da CLI tarafinda mutasyon gerektiriyor. | `removeContentUi`, `applyI18n`, `applyWxtStorage`, package manager ayari, install, manager script, build approval, name degisimi |
| `wxt-svelte` | Tasinabilir, ama post script/hook gerekli | Solid ile ayni sinifta. Content UI opsiyonu ve i18n/storage mutasyonlari template clone sonrasinda calismali. | `removeContentUi`, `applyI18n`, `applyWxtStorage`, package manager ayari, install, manager script, build approval, name degisimi |
| `uv-notebook` | Tasinabilir, ama JS generic pipeline'a sokulmamali | Python/uv tabanli. Package manager secimi yok, `package.json` yok, `uv sync` gerekiyor. Template repo olabilir ama starter ayri kalmali. | clone/download, dotfile restore, `uv sync`; ileride `pyproject.toml` name guncellemesi dusunulebilir |
| `cmake-cpp` | Tasinabilir, ama post script/hook gerekli | `package.json` yok, JS dependency install yok. CLI CMake project name'i guncelliyor ve `cmake -S . -B build` calistiriyor. | clone/download, dotfile restore, `changeCmakeProjectName`, `configureCmakeProject`; JS pipeline kapali kalmali |

## Tasinmamasi Gereken Seyler

Template repo'lara su sorumluluklar tasinmamali:

- Kullanici prompt'lari.
- Package manager secimine gore `package.json` script mutasyonlari.
- `pnpm-workspace.yaml` dosyasini npm/bun icin kaldirma.
- Bun icin `trustedDependencies` uretme.
- `installDependencies`, `approveBuilds`, `changeProjectName`.
- WXT opsiyonlari: i18n, storage, content UI secimi.
- CMake project name rewrite ve configure komutu.
- uv icin `uv sync`.

Bu davranislar CLI'in urun davranisi. Template repo'lar sadece temiz baslangic dosyalarini tasimali.

## Hedef Mimari

### 1. Template Registry

CLI icinde merkezi bir template registry olmali. Her starter su bilgileri tasimali:

- `id`: CLI icindeki template/starter id'si.
- `kind`: `git` veya ileride `local`/`archive`.
- `repo`: Git URL.
- `ref`: branch, tag veya commit SHA.
- `subdir`: repo icinde template alt klasoru gerekiyorsa.
- `strategy`: clone/download davranisi.
- `postSteps`: CLI tarafinda calisacak mantiksal adimlar.
- `supportsPackageManagers`: `pnpm`, `npm`, `bun` veya bos.

Ilk asamada registry TypeScript dosyasi olarak tutulabilir. Ayrica JSON manifest de mumkun, fakat post step fonksiyonlarini dogrudan baglamak icin TS registry daha pratik.

### 2. Fetch/Clone Katmani

Mevcut `copyTemplateFolder(templatePath, destinationPath)` sadece lokal klasor biliyor. Yeni katmanda bu sorumluluk ikiye ayrilmali:

- `fetchTemplateSource`: template'i gecici bir klasore indirir/clone eder.
- `materializeTemplate`: indirilen template'i hedef proje klasorune kopyalar ve dotfile restore yapar.

Git clone icin oncelik:

1. `git clone --depth 1 --branch/ref ...` ile clone.
2. Repo subdir gerekiyorsa clone sonrasi sadece subdir kopyalama.
3. Gecici klasoru temizleme.

Not: GitHub archive download alternatifi de dusunulebilir, ama `git` zaten template repo modelinde daha seffaf. Ilk implementasyonda `git` komutunun sistemde varligini kontrol etmek gerekir.

### 3. Dotfile Stratejisi

Mevcut npm paketleme modelinde `_gitignore` gibi isimler mantikliydi. Template repo'ya tasindiktan sonra bu kisit azalir.

Onerilen gecis:

- Yeni repo'larda gercek dotfile kullan: `.gitignore`, `.prettierrc.json`, `.clang-format`.
- CLI'da `restoreDotPrefixedNames` davranisini bir sure koru.
- Boylece hem eski paketli template'ler hem yeni repo template'ler calisir.

### 4. Package Manager Pipeline

JS template'ler icin clone sonrasi mevcut pipeline korunmali:

1. package manager konfigurasyonu
2. dependency install
3. manager script guncelleme
4. build approval
5. project name guncelleme

Bu siralama korunmali cunku WXT gibi template'lerde `postinstall` ve build approval hassas.

### 5. Ozel Starter Pipeline'lari

Generic JS pipeline ile JS olmayan veya domain-specific starter'lar karistirilmamali.

- `react-ts-tw` ve `next-prisma`: generic JS remote template pipeline.
- `wxt`: framework secimi + remote template + WXT customization hook + generic JS pipeline.
- `uv-notebook`: remote template + `uv sync`; JS package manager pipeline yok.
- `cmake-cpp`: remote template + CMake name rewrite + configure; JS package manager pipeline yok.

## Template Repo Tasima Plani

### Asama 1: En Kolay Adaylari Ayir

Once tamamen tasinabilir iki template tasinsin:

- `react-ts-tw`
- `next-prisma`

Her biri icin ayri repo onerisi:

- `kunver-template-react-ts-tw`
- `kunver-template-next-prisma`

Repo icerigi dogrudan template root'u olmali. Yani clone edilen repo icinde `package.json`, `src`, `README.md` gibi dosyalar root'ta bulunmali. Boylece `subdir` ihtiyaci olmaz.

Bu asamada CLI registry'ye sadece bu iki remote template eklenir. Diger template'ler lokalden calismaya devam edebilir. Bu hibrit model riski dusurur.

Basari kriterleri:

- `react-ts-tw` remote repo'dan uretilir.
- `next-prisma` remote repo'dan uretilir.
- Package manager secimi eskisi gibi calisir.
- `package.json.name` kullanici proje adina doner.
- `pnpm run test` gecer.
- Build paketinden template klasoru cikartilsa bile bu iki starter calisir.

### Asama 2: WXT Template'lerini Tasima

Sonra WXT varyantlari tasinsin:

- `wxt-vanilla`
- `wxt-solid`
- `wxt-svelte`

Repo modeli icin iki secenek var:

Secenek A: Her framework icin ayri repo.

- `kunver-template-wxt-vanilla`
- `kunver-template-wxt-solid`
- `kunver-template-wxt-svelte`

Secenek B: Tek repo, alt klasorler.

- `kunver-template-wxt`
  - `vanilla`
  - `solid`
  - `svelte`

Oneri: Baslangicta ayri repo daha basit. CLI registry'de `subdir` gerekmez, framework bazli version/tag yonetimi daha net olur. Eger WXT varyantlari birlikte release edilmeli denirse sonra mono-template repo'ya gecilebilir.

WXT'de repo'ya tasinmamasi gereken davranislar:

- `Use i18n?`
- `Use content UI?`
- `Use wxt-storage?`
- Content UI kapaliyken dosya silme/olusturma.
- `@wxt-dev/i18n` dependency ekleme.
- `wxt.config.ts` manifest/modules degistirme.
- `utils/storage.ts` olusturma.

Bu davranislar CLI'da kalmali cunku kullanici secimlerine bagli.

Basari kriterleri:

- Framework secimi eskisi gibi calisir.
- Her framework remote repo'dan gelir.
- i18n secilirse locale ve config mutasyonu dogru uygulanir.
- storage secilirse permission ve example file olusur.
- Solid/Svelte content UI kapatilirsa template clone sonrasi dosya yapisi dogru sadeleştirilir.
- Eski `create-wxt.test.ts` genisletilerek remote template fetch akisi mock'lanir.

### Asama 3: uv-notebook Tasima

`uv-notebook` ayri repo'ya tasinabilir:

- `kunver-template-uv-notebook`

Bu template generic `createTemplateProject` pipeline'ina sokulmamali. Mevcut `createPythonNotebookProject` mantigi korunmali, sadece lokal path yerine remote source materialize etmeli.

Ek iyilestirme onerisi:

- `pyproject.toml` icindeki `[project].name` su anda sabit `pytorch-learn`. CLI proje adina gore bunu guncelleyebilir.
- Bu zorunlu degil, ama remote modele gecerken template kalitesini artirir.

Basari kriterleri:

- Remote template clone edilir.
- `uv sync` proje klasorunde calisir.
- `packageManager` sorulmaz.
- `uv` yoksa mevcut hata mesaji korunur.

### Asama 4: cmake-cpp Tasima

`cmake-cpp` ayri repo'ya tasinabilir:

- `kunver-template-cmake-cpp`

Bu template de generic JS pipeline'a girmemeli. Mevcut davranis korunmali:

- package manager secimi yok.
- dependency install yok.
- manager script/add build approval yok.
- `CMakeLists.txt` icindeki `project(...)` kullanici proje adina rewrite edilir.
- `cmake -S . -B build` denenir, basarisizsa kullaniciya manuel komut onerilir.

Basari kriterleri:

- Remote template clone edilir.
- `CMakeLists.txt` project name rewrite calisir.
- `build/` configure denenir.
- CMake yoksa CLI tamamen patlamak yerine mevcut kontrollu uyari davranisini korur.

## CLI Davranis Tasarimi

Kullanici deneyimi degismemeli:

```text
kunver
Enter a project name
Select a project type
Select package manager
Open in editor?
```

Arka planda degisecek akis:

1. Starter secilir.
2. Registry'den template source bulunur.
3. Source remote ise temp klasore clone edilir.
4. Template hedef proje klasorune materialize edilir.
5. Dotfile restore calisir.
6. Starter'a ozel pre-install hook calisir.
7. Generic veya ozel pipeline calisir.
8. Temp klasor temizlenir.

Hata davranisi:

- Git yoksa net mesaj: `git is required to download remote templates`.
- Repo clone edilemezse net mesaj: template id, repo URL, ref.
- Hedef klasor zaten varsa mevcut validasyon korunsun.
- Post step hata verirse hangi step'in fail ettigi yazilsin.

## Versionlama Stratejisi

Remote template icin ref secimi onemli.

Ilk asamada onerilen:

- Registry `ref` olarak tag kullansin: ornek `v1.0.0`.
- CLI release edilirken hangi template tag'ini kullandigi sabit olsun.
- Template repo'da breaking degisiklik varsa yeni tag cikilsin, CLI registry ayrica guncellensin.

Alternatif:

- `main` branch kullanmak daha hizli ama CLI'in her calismada farkli sonuc uretmesine yol acar.
- Bu nedenle `main` sadece development/debug icin kullanilmali.

## Test Plani

Mevcut testler korunup genisletilmeli.

Eklenmesi gereken testler:

- Remote source resolver registry'den dogru repo/ref okuyor.
- Fetch katmani git clone komutunu dogru argumanlarla cagiriyor.
- Clone edilen template hedef klasore kopyalaniyor.
- Temp klasor cleanup calisiyor.
- Dotfile restore hem `_gitignore` hem gercek `.gitignore` icin sorun cikarmiyor.
- Generic JS template pipeline sirasi korunuyor.
- WXT remote template sonrasi `onBeforeInstall` hook'lari calisiyor.
- uv-notebook remote template sonrasi `uv sync` calisiyor.
- cmake-cpp remote template sonrasi CMake name rewrite ve configure calisiyor.

Manual smoke test:

```bash
pnpm run build
pnpm run test
pnpm dlx ./dist/index.js
```

Not: Bu proje kendi runtime scriptleri icin pnpm kullaniyor. Test ve build komutlari pnpm ile calistirilmali.

## Gecis Sirasinda Geri Donus Plani

Ilk geciste hibrit model kullanilmali:

- Registry remote template'i dener.
- Gerekirse ayni template icin lokal fallback tutulur.
- Bir veya iki release sonra lokal fallback kaldirilir.

Bu sayede remote repo izinleri, GitHub availability, tag hatalari veya clone path problemleri CLI'i tamamen bozmaz.

Fallback sadece gecici olmali. Uzun vadede CLI paketinde template dosyasi tutmak hedefle celisir.

## Onerilen Uygulama Sirasi

1. Template registry tasarimini ekle.
2. Remote fetch/materialize katmanini ekle.
3. `react-ts-tw` repo'sunu olustur ve registry'ye bagla.
4. `next-prisma` repo'sunu olustur ve registry'ye bagla.
5. Bu iki starter icin test ve smoke test yap.
6. `wxt-vanilla`, `wxt-solid`, `wxt-svelte` repo'larini olustur.
7. WXT registry map'ini remote kaynaklara gecir.
8. WXT customization testlerini remote akisa gore genislet.
9. `uv-notebook` repo'sunu olustur ve notebook starter'ini remote source kullanacak sekilde planla.
10. Gerekirse `pyproject.toml` name rewrite adimini ekle.
11. `cmake-cpp` repo'sunu olustur ve CMake starter'ini remote source kullanacak sekilde planla.
12. Bir release boyunca lokal fallback'i koru.
13. Remote template'ler stabil olduktan sonra `src/public/templates` ve `tsup publicDir` bagimliligini kaldir.

## Son Hedef Durum

Bu migrasyon bittiginde repo su hale gelmeli:

- `@kunver/new` sadece CLI ve starter orchestration kodunu tutar.
- Template'ler kendi repo'larinda versiyonlanir.
- CLI registry sabit tag/ref ile deterministik template uretir.
- JS template'lerde package manager secimi hala CLI tarafindan uygulanir.
- WXT, uv ve CMake gibi ozel starter davranislari CLI'da acik post step'ler olarak kalir.
- CLI paketi kuculur ve template guncellemeleri daha kontrollu hale gelir.
