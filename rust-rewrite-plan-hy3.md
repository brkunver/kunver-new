# Rust Rewrite Planı: @kunver/new (bin: kunver)

> Bu doküman, TypeScript + pnpm ile yazılmış olan @kunver/new proje başlatıcı (scaffolding) CLI aracının
> Rust diline yeniden yazılması (rewrite) için hazırlanan detaylı plandır. Mevcut kaynak kodun gerçek
> yapısı analiz edilmiş, adım adım uygulanabilir bir yol haritası çıkarılmıştır.
>
> Ayrı bir gereksinim olarak: şablonlar (templates) artık CLI ile paketlenmeyecek, ayrı GitHub
> repolarında tutulacak ve CLI tarafından çalışma anında indirilecektir.

---

## 0. Hedefler ve Kapsam

Neden Rust?

- Node.js bağımlılığı ortadan kalkar → tek binary, anında çalışır.
- Şablonlar binary içinde gömülü (embed) değil, dışarıdan çekildiği için CLI versiyonu bump etmeden şablon güncellenebilir.
- Daha hızlı kopyalama / kurulum akışı.
- Cross-platform binary dağıtımı (Windows/macOS/Linux) basit.

Kapsam dışı (bu planda yazılmayacak, sadece referans): Şablon repolarının içeriği (React/Next/WXT kaynakları).
Bu plan yalnızca CLI aracının kendisini ve template-için-dış-repo stratejisini kapsar.

---

## 1. Mevcut Proje Analizi (TS tarafı)

### 1.1 Çalışma Akışı (kullanıcı perspektifi)

```
kunver
  ├─ proje adı sorulur (validasyon: min 2 char, lowercase/number/hyphen, klasör mevcut mu?)
  ├─ proje türü seçilir (select)
  ├─ paket yöneticisi sorulur (uv-notebook ve cmake-cpp hariç)
  ├─ editörde açılsın mı? (antigravity / windsurf / cursor / code / no)
  └─ ilgili starter çalıştırılır
```

### 1.2 Mevcut Kaynak Dosya Haritası

| Dosya | Sorumluluk |
| :-- | :-- |
| src/index.ts | Giriş noktası: prompt'ları toplar, projectStarter'ı çağırır |
| src/constant.ts | Sabitler: proje türleri, paket yöneticileri, editörler, wxt framework'leri |
| src/project-starter.ts | TprojectType -> handler eşlemesi (registry) |
| src/helpers/create-template.ts | Generic akış orkestratörü (copy → pre-install hook → pm → install → manager → approve → rename) |
| src/helpers/copy-template.ts | Şablon kopyalama + _ önekli dosyaları . ile değiştirme |
| src/helpers/install-deps.ts | <pm> install çalıştırır |
| src/helpers/approve.ts | pnpm approve-builds (interaktif stdin) / bun pm trust --all |
| src/helpers/add-manager-script.ts | package.json + pnpm-workspace.yaml düzenleme (manager script, resize, zip, trustedDependencies) |
| src/helpers/postinstall.ts | package.json içindeki name alanını günceller |
| src/helpers/configure-cmake.ts | CMake project adını regex ile değiştirir + cmake -S . -B build |
| src/helpers/open-in-editor.ts | Seçilen editörü proje klasöründe açar |
| src/helpers/utils.ts | __dirname / import.meta.url yardımcısı |
| src/starters/create-wxt.ts | WXT framework seçimi + i18n/contentUI/wxt-storage özelleştirmeleri |
| src/starters/create-python-notebook.ts | uv-notebook kopyalar + uv sync |
| src/public/templates/* | Gömülü şablonlar (rewrite sonrası bu klasör silinecek) |
| manager.cjs | Kök bridge; template'ler kopyalanınca <pm> manager.cjs <pm> script'i eklenir |

### 1.3 Mevcut Starter'lar

- react-ts-tw → template
- next-ts-prisma → template (next-prisma)
- wxt → WXT framework seçimi (svelte / vanilla / solid) + özelleştirme → wxt-*
- uv-notebook → uv sync
- cmake-cpp → CMake ad değişimi + configure (özel akış)

---

## 2. Rust Mimari Tasarımı

### 2.1 Önerilen Modül Ağacı

```
kunver/
├─ Cargo.toml
├─ src/
│  ├─ main.rs                 # arg parse (clap) + index.ts karşılığı
│  ├─ constants.rs            # constant.ts karşılığı (enum'lar + seçenek listeleri)
│  ├─ errors.rs               # anyhow ile hata tipi + kullanıcıya dost mesajlar
│  ├─ prompt.rs               # inquire sarmalayıcıları (text/select/confirm)
│  ├─ starters/
│  │  ├─ mod.rs               # project_starter registry (TprojectType -> handler)
│  │  ├─ template.rs          # create_template_project (generic orkestratör)
│  │  ├─ wxt.rs               # create_wxt_project (framework + customization)
│  │  └─ python_notebook.rs   # create_python_notebook (uv sync)
│  ├─ template/
│  │  ├─ mod.rs               # TemplateSource trait + repo kaydı (TEMPLATES map)
│  │  ├─ git.rs               # git clone --depth 1 ile indirme
│  │  ├─ http.rs              # reqwest + zip ile indirme (fallback)
│  │  └─ cache.rs             # ~/.cache/kunver/templates önbelleği
│  ├─ fsx.rs                  # recursive kopyalama + dotfile restore + yaml/json düzenleme
│  ├─ pm.rs                   # paket yöneticisi komutları + approve-builds + install
│  ├─ cmake.rs                # change_cmake_project_name + configure
│  ├─ editor.rs               # open_in_editor
│  └─ manager.rs              # add_manager_script / configure_package_manager (package.json + yaml)
└─ tests/                     # entegrasyon testleri
```

### 2.2 Tasarım Kararları

- TprojectType bir enum olur; strum ile string <-> enum dönüşümü ve listeleme sağlanır.
- Template kaynağı bir struct + URL map ile temsil edilir: TemplateRepo { owner, name, branch }.
  CLI içinde const TEMPLATES: &[TemplateRepo] olarak tutulur.
- create_template_project generic fonksiyon yerine Rust'ta bir struct TemplateOptions { ... on_before_install: Option<Box<dyn Fn>> } deseni kullanılır.
- Windows uyumu: std::process::Command çağrılarında shell: true yerine mümkün olduğunca doğrudan komut; path birleştirmede std::path::Path kullanılır. (Platform win32 olduğu için dikkat.)
- Non-interactive mod (önerilen): clap ile --name, --type, --pm, --editor, --yes flag'leri eklenir; CI / pipe kullanımı için.

---

## 3. Kütüphane Eşleme Tablosu (TS → Rust)

| TS Bağımlılığı | Rust Crate | Not |
| :-- | :-- | :-- |
| @inquirer/prompts | inquire | Text, Select, Confirm, MultiSelect |
| chalk | colored (veya owo-colors) | Renkli çıktı |
| ora | indicatif | ProgressBar / Spinner |
| execa | std::process::Command + duct | Alt süreç; pipe gereken yerde duct |
| fs/promises | std::fs + tokio::fs | CLI senkron yeterli; istenirse tokio |
| recursive copy | fs_extra | fs_extra::dir::copy veya kendi recursive impl |
| JSON.parse/stringify | serde + serde_json | package.json düzenleme |
| pnpm-workspace.yaml / en.yml (i18n) | serde_yaml | YAML düzenleme (mevcut planda eksikti) |
| arg parse (yeni) | clap | --name/--type flag'leri |
| enum <-> string (yeni) | strum | seçenek listeleri & parse |
| hata yönetimi | anyhow | CLI için sade hata |
| HTTP fallback | reqwest + zip | git yoksa zip indir |
| önbellek temp | tempfile | opsiyonel |

Cargo.toml başlangıç bağımlılıkları:

```toml
[dependencies]
inquire = "0.7"
colored = "2"
indicatif = "0.17"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_yaml = "0.9"
fs_extra = "1.3"
anyhow = "1"
clap = { version = "4", features = ["derive"] }
strum = { version = "0.26", features = ["derive"] }
# opsiyonel fallback:
# reqwest = { version = "0.12", features = ["blocking", "stream"] }
# zip = "2"

[dev-dependencies]
assert_cmd = "2"   # CLI entegrasyon testi
```

---

## 4. GitHub Template Repoları Stratejisi

### 4.1 Hangi şablonlar external repo olacak?

Mümkün olan tüm şablonlar ayrı repo olur. CLI yalnızca "indir + post-process" yapar.

| Yeni GitHub Repo (brkunver/...) | Eski template klasörü | Post-process CLI'de |
| :-- | :-- | :-- |
| template-react-ts-tw | react-ts-tw | package.json name + manager script |
| template-next-ts-prisma | next-prisma | package.json name + manager script |
| template-wxt-svelte | wxt-svelte | i18n / contentUI / storage düzenleme |
| template-wxt-solid | wxt-solid | ayno |
| template-wxt-vanilla | wxt-vanilla | ayno |
| template-uv-notebook | uv-notebook | uv sync |
| template-cmake-cpp | cmake-cpp | CMake ad değişimi + configure |

Not: cmake-cpp ve uv-notebook de ayrı repo olabilir; CLI sonrasında kendi komutlarını (cmake, uv)
çalıştırır. "Her proje için olamaz" endişesi yersiz — hepsi repo olabilir; fark, CLI'nin onlara uyguladığı
ek işlemlere (post-process hook) göre değişir.

### 4.2 Dotfile sorunu (önemli fark)

Mevcut sistemde template'ler npm paketi içinde olduğu için gerçek .gitignore dosyaları (files
array'ine takılmasın diye) _gitignore olarak saklanıp kopyalama sonrası .'a çevriliyordu
(copy-template.ts → restoreDotPrefixedNames).

External repo'larda bu artık gerekmez: repo'nun kendisi gerçek .gitignore, .prettierrc.json,
.clang-format, .python-version dosyalarını içerir. Dolayısıyla:

- restore_dot_files mantığı default kapalı tutulur; yalnızca eski gömülü template kullanımı için korunur.
- External repo template'lerinde dotfile'lar olduğu gibi durur; CLI ekstra rename yapmaz.
- Bu, copy-template.ts mantığının Rust'a birebir kopyalanması yerine opsiyonel bir flag olarak taşınması
  anlamına gelir.

### 4.3 İndirme mekanizması

1. Birincil (önerilen): git clone --depth 1
   git clone --depth 1 https://github.com/brkunver/template-react-ts-tw.git <hedef>
   ardından <hedef>/.git silinir
   Avantaj: SSH/HTTPS auth otomatik, ek crate yok.
2. Fallback: HTTP zip (reqwest + zip)
   https://github.com/brkunver/<repo>/archive/refs/heads/<branch>.zip
   git kurulu değilse kullanılır. .git zaten yok.

### 4.4 Önbellek (caching)

~/.cache/kunver/templates/<repo>-<branch> altına shallow clone / zip extract edilir.
Aynı şablon tekrar istenirse ağ kullanılmaz (offline çalışır). --no-cache ile atlanabilir.
İsteğe bağlı: git -C <cache> pull --ff-only ile güncelleme.

### 4.5 Repo yapısı sözleşmesi (tüm template repo'larında ortak)

- Gerçek dotfile'lar (.gitignore, vb.) doğrudan repo kökünde.
- package.json içinde "name": "kunver-template" placeholder → CLI kullanıcı adıyla değiştirir.
- pnpm-workspace.yaml varsa CLI, paket yöneticisi pnpm değilse dosyayı siler (mevcut davranış).

---

## 5. Adım Adım Rewrite Yol Haritası

### Adım 1 — Rust iskeleti
- cargo new kunver --bin.
- Cargo.toml bağımlılıklarını ekle (Bölüm 3).
- constants.rs: ProjectType, PackageManager, Editor, WxtFramework enum'ları + strum listeleri.
- main.rs minimal: versiyon yazdır, clap arg yapısını kur.

### Adım 2 — Prompt katmanı (prompt.rs)
- index.ts mantığını taşı: input (validasyon: uzunluk >= 2, ^[a-z0-9]+(-[a-z0-9]+)*$, klasör var mı),
  select (proje türü, pm, editör), confirm (gelecekte).
- Validasyon fonksiyonlarını saf fonksiyonlar olarak yaz (test edilebilir).

### Adım 3 — Template indirici (template/)
- TemplateRepo struct + TEMPLATES map (proje türü → repo).
- git.rs: clone + .git sil. http.rs: zip fallback. cache.rs: önbellek dizini.
- fsx.rs: recursive kopyalama (dotfile restore opsiyonel flag olarak).

### Adım 4 — Generic orkestratör (starters/template.rs)
create-template.ts akışını birebir karşıla:
copy  -> on_before_install? -> configure_package_manager -> install
      -> add_manager_script -> approve_builds -> change_project_name
Her adım anyhow ile hata fırlatır; indicatif spinner adımları süsler.

### Adım 5 — Paket yöneticisi & manager script (pm.rs, manager.rs)
- install_dependencies: <pm> install.
- approve_builds: pnpm approve-builds (stdin'a a\n + y\n yaz — std::process::Command stdin pipe),
  bun pm trust --all.
- configure_package_manager + add_manager_script: package.json (serde_json) ve pnpm-workspace.yaml
  (serde_yaml) düzenleme. manager.cjs script ekleme, resize/zip:all script güncelleme,
  trustedDependencies taşıma (bun için), pm != pnpm ise pnpm-workspace.yaml silme.

### Adım 6 — WXT starter (starters/wxt.rs)
- Framework select (svelte/vanilla/solid) + confirm'lar (i18n, contentUI, wxt-storage).
- on_before_install hook:
  - remove_content_ui (svelte/solid ve contentUI kapalıysa)
  - apply_i18n: package.json devDep + @wxt-dev/i18n, wxt.config.ts regex düzenleme, locales/en.yml
    (serde_yaml) yazma
  - apply_wxt_storage: wxt.config.ts permissions: ["storage"] ekleme + utils/storage.ts yazma

### Adım 7 — Python notebook (starters/python_notebook.rs)
- Template indir → uv sync (Command). uv yoksa dostça hata + kurulum linki.

### Adım 8 — CMake (cmake.rs)
- change_cmake_project_name: CMakeLists.txt regex ile project("...") güncelleme.
- configure_cmake_project: cmake -S . -B build; hata olursa uyarı, akışa devam.

### Adım 9 — Editör (editor.rs)
- open_in_editor: seçilen editör komutunu <projectName> argümanıyla cwd'de çalıştır.

### Adım 10 — Registry birleştirme (starters/mod.rs)
project-starter.ts registry'sini kur: her ProjectType için handler. main.rs'tan çağır.

### Adım 11 — Non-interactive & UX cilası
- clap flag'leri (--name, --type, --pm, --editor, --no-cache, --yes).
- Renkli başlık, versiyon (env! ile Cargo.toml'dan), hata mesajları anyhow + colored.

---

## 6. Dağıtım & CI/CD

1. Cargo ile: cargo install kunver (kaynaktan derleme).
2. GitHub Releases + cross-compile: cargo build --release için macOS/Linux/Windows runner'ları;
   cargo-dist veya basit GitHub Actions matrix ile binary'leri release'e ekle.
3. NPM wrapper (geriye dönük uyum): Mevcut @kunver/new paketi korunacaksa, ince bir JS wrapper
   platforma uygun Rust binary'sini indirip çalıştırır (esbuild/tailwind modeli). Bu opsiyonel.
4. Homebrew / Scoop (ilerisi): formula/script ile kurulum kolaylaştırılabilir.

---

## 7. Test & Doğrulama (parite)

Mevcut repo vitest kullanıyor (test/ klasörü). Rust tarafında:

- Birim testleri: validasyon regex'i, change_cmake_project_name regex, configure_package_manager
  YAML/JSON dönüşümleri, dotfile restore — saf fonksiyonlar olarak #[cfg(test)].
- Entegrasyon testleri: assert_cmd ile kunver --name test-x --type react-ts-tw --pm pnpm --editor no
  geçici dizinde çalıştırılır; oluşan package.json name alanı ve dosya varlığı doğrulanır.
- Manuel parite kontrolü: Her starter, TS sürümüyle üretilen proje yapısıyla (dosya listesi + package.json)
  karşılaştırılır.

---

## 8. Riskler & Dikkat Noktaları

- Windows shell: pnpm approve-builds gibi interaktif komutlarda stdin pipe davranışı Unix'ten farklı
  olabilir; cmd /C gerekebilir, test edilmeli.
- pnpm-workspace.yaml whitespace: YAML serileştirme mevcut dosya formatını bozabilir; serde_yaml
  yerine güvenli string manipülasyonu (mevcut TS gibi) daha az riskli olabilir — karar Adım 5'te verilir.
- i18n wxt.config.ts regex: TS tarafı kırılgan; Rust'ta aynı regex'ler korunur ama snapshot test şart.
- .git temizliği: clone sonrası mutlaka silinmeli, aksi halde kullanıcı repo içinde nested git bulur.
- Cache staleness: önbellek bayat şablon verebilir; --no-cache / periyodik pull gerekir.

---

## 9. Görev Kontrol Listesi (Checklist)

- [ ] Adım 1: Rust iskeleti + Cargo.toml + constants
- [ ] Adım 2: Prompt katmanı (validasyon dahil)
- [ ] Adım 3: Template indirici (git + http fallback + cache)
- [ ] Adım 4: Generic orkestratör (fsx copy + dotfile flag)
- [ ] Adım 5: pm / manager script / approve-builds
- [ ] Adım 6: WXT starter + customization hooks
- [ ] Adım 7: Python notebook (uv sync)
- [ ] Adım 8: CMake ad değişimi + configure
- [ ] Adım 9: Editör açma
- [ ] Adım 10: Starter registry birleştirme
- [ ] Adım 11: clap flag'leri + UX cilası
- [ ] Template repoları GitHub'da oluşturuldu (Bölüm 4.1)
- [ ] CI/CD release pipeline
- [ ] Birim + entegrasyon testleri, TS paritesi doğrulandı
- [ ] src/public/templates ve npm gömülü şablonlar kullanımdan kaldırıldı (geçiş tamamlanınca)
