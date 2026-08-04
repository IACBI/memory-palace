<a id="top"></a>

# 🏛️ Memory Palace

**A spatial home for everything you know.**

[![Deploy demo to GitHub Pages](https://github.com/IACBI/memory-palace/actions/workflows/deploy.yml/badge.svg)](https://github.com/IACBI/memory-palace/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-c9a227)

**[▶ Try the live demo →](https://iacbi.github.io/memory-palace/)**

**Read this in:** [English](#english) · [Türkçe](#türkçe) · [中文](#中文) · [हिन्दी](#हिन्दी) · [Español](#español) · [العربية](#العربية) · [Português (Brasil)](#português-brasil) · [Русский](#русский)

---

<a id="english"></a>

## English

### Overview

Most note apps are lists. Memory Palace is a **place**. Ideas live in rooms you
arrange yourself, objects sit where you put them on a canvas, and the
relationships between them form a graph you can wander.

It is **local-first**: everything is saved in your browser, instantly and
privately. Nothing is uploaded, and the app works with no connection at all.

### Features

- **Palace** — a floor plan of rooms you lay out yourself.
- **Room canvas** — place objects anywhere; draw connections between them by
  dragging, or with the `L` key.
- **Graph** — a force-directed view of everything and how it connects.
- **Library** — every object at once, with search, filters and sorting.
- **Search** — multi-word, order-independent, with a fuzzy fallback.
- **Undo** — `Ctrl/⌘ + Z` for every change, including deleting a room.
- **Offline** — installable, and fully usable with no network.
- **Two themes** — candlelit dark, or Parchment light.

### Requirements

Node.js 18.18 or newer (developed on Node 22).

### Installation

```bash
npm install
npm run dev      # http://localhost:3000
```

### Usage

The app opens with a choice: start empty, explore a sample palace, or import a
backup. Press `?` at any time for the full keyboard reference, and `Ctrl/⌘ + K`
to search or jump anywhere.

**Settings → Export JSON** downloads your whole palace as one file. Import
validates it, repairs what it can, and lists every change before applying it.

### Configuration

`GITHUB_PAGES=true` switches the build to a static export under the
`/memory-palace` base path. A plain `npm run build` keeps Next.js's default,
server-capable output — which is the only one that can send real security
headers, so the hosted demo has no `frame-ancestors` protection. See
[`docs/architecture.md`](docs/architecture.md).

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

### Contributing

Read [`docs/architecture.md`](docs/architecture.md) first — it explains why the
unusual parts are the way they are. Every pull request has to pass the same
gates as CI: format, lint, typecheck, unit tests, both builds, the bundle
budget, and the end-to-end suite.

### License

[MIT](LICENSE) © 𝓐.𝓒.𝓑

[⬆ Back to top](#top)

---

<a id="türkçe"></a>

## Türkçe

### Genel bakış

Çoğu not uygulaması bir listedir. Memory Palace ise bir **mekân**dır. Fikirler
kendi düzenlediğiniz odalarda yaşar, nesneler tuvalde koyduğunuz yerde durur ve
aralarındaki ilişkiler dolaşabileceğiniz bir graf oluşturur.

**Yerel önceliklidir**: her şey anında ve gizlice tarayıcınıza kaydedilir.
Hiçbir veri yüklenmez ve uygulama bağlantı olmadan da tam çalışır.

### Özellikler

- **Palace** — kendi yerleştirdiğiniz odalardan oluşan bir kat planı.
- **Oda tuvali** — nesneleri istediğiniz yere koyun; aralarına sürükleyerek ya
  da `L` tuşuyla bağlantı çizin.
- **Graph** — her şeyin ve bağlantılarının kuvvet tabanlı görünümü.
- **Library** — tüm nesneler tek yerde; arama, filtre ve sıralama ile.
- **Arama** — çok kelimeli, sıradan bağımsız, bulanık eşleşme desteğiyle.
- **Geri alma** — oda silme dahil her değişiklik için `Ctrl/⌘ + Z`.
- **Çevrimdışı** — kurulabilir ve ağ olmadan tümüyle kullanılabilir.
- **İki tema** — mum ışığı koyu ya da Parchment açık.

### Gereksinimler

Node.js 18.18 veya üzeri (Node 22 ile geliştirildi).

### Kurulum

```bash
npm install
npm run dev      # http://localhost:3000
```

### Kullanım

Uygulama bir seçimle açılır: boş başlayın, örnek sarayı gezin ya da bir yedek
içe aktarın. Tüm klavye kısayolları için istediğiniz an `?`, arama ve hızlı
gezinme için `Ctrl/⌘ + K` tuşlarına basın.

**Settings → Export JSON** tüm sarayınızı tek dosya olarak indirir. İçe aktarma
dosyayı doğrular, onarabildiğini onarır ve uygulamadan önce her değişikliği
listeler.

### Yapılandırma

`GITHUB_PAGES=true` derlemeyi `/memory-palace` temel yolu altında statik bir
dışa aktarmaya çevirir. Düz `npm run build` ise Next.js'in varsayılan, sunucu
yetenekli çıktısını korur — gerçek güvenlik başlıkları gönderebilen tek seçenek
budur, yani yayındaki demoda `frame-ancestors` koruması yoktur. Ayrıntılar:
[`docs/architecture.md`](docs/architecture.md).

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

### Katkı

Önce [`docs/architecture.md`](docs/architecture.md) dosyasını okuyun; sıra dışı
kısımların neden öyle olduğunu açıklar. Her pull request, CI ile aynı kapılardan
geçmelidir: biçim, lint, tip denetimi, birim testleri, iki derleme, paket
bütçesi ve uçtan uca test takımı.

### Lisans

[MIT](LICENSE) © 𝓐.𝓒.𝓑

[⬆ Başa dön](#top)

---

<a id="中文"></a>

## 中文（简体）

### 概述

大多数笔记应用是列表，而 Memory Palace 是一处**空间**。想法住在你自己布置的房间里，
对象停留在画布上你放置的位置，它们之间的关系构成一张可以漫步的关系图。

它是**本地优先**的：一切都即时、私密地保存在你的浏览器中。没有任何数据被上传，
完全断网也能照常使用。

### 功能

- **Palace** — 由你自行布局的房间平面图。
- **房间画布** — 随处放置对象；拖拽或按 `L` 键在它们之间连线。
- **Graph** — 以力导向布局呈现全部对象及其连接。
- **Library** — 所有对象一览，支持搜索、筛选与排序。
- **搜索** — 支持多词、与词序无关，并带模糊匹配兜底。
- **撤销** — 任何改动都可 `Ctrl/⌘ + Z`，包括删除房间。
- **离线** — 可安装，且在完全无网络时依然可用。
- **两套主题** — 烛光般的深色，或 Parchment 浅色。

### 环境要求

Node.js 18.18 或更高版本（开发环境为 Node 22）。

### 安装

```bash
npm install
npm run dev      # http://localhost:3000
```

### 使用

应用启动时会让你选择：从空白开始、浏览示例 palace，或导入备份。随时按 `?` 查看完整
键盘参考，按 `Ctrl/⌘ + K` 搜索或快速跳转。

**Settings → Export JSON** 会把整座 palace 导出为一个文件。导入时会先校验、尽可能
修复，并在应用前列出每一处改动。

### 配置

`GITHUB_PAGES=true` 会把构建切换为 `/memory-palace` 基础路径下的静态导出。普通的
`npm run build` 则保留 Next.js 默认的、具备服务端能力的输出 —— 只有它能发送真正的
安全响应头，因此线上演示没有 `frame-ancestors` 保护。详见
[`docs/architecture.md`](docs/architecture.md)。

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

### 参与贡献

请先阅读 [`docs/architecture.md`](docs/architecture.md)，其中说明了那些不寻常的设计
为何如此。每个 pull request 都必须通过与 CI 相同的关卡：格式化、lint、类型检查、
单元测试、两种构建、包体积预算，以及端到端测试。

### 许可证

[MIT](LICENSE) © 𝓐.𝓒.𝓑

[⬆ 返回顶部](#top)

---

<a id="हिन्दी"></a>

## हिन्दी

### परिचय

अधिकतर नोट ऐप सूचियाँ होते हैं। Memory Palace एक **जगह** है। विचार उन कमरों में रहते
हैं जिन्हें आप स्वयं व्यवस्थित करते हैं, वस्तुएँ कैनवास पर वहीं टिकी रहती हैं जहाँ आप उन्हें
रखते हैं, और उनके बीच के सम्बन्ध एक ऐसा ग्राफ़ बनाते हैं जिसमें आप घूम सकते हैं।

यह **लोकल-फ़र्स्ट** है: सब कुछ तुरंत और निजी तौर पर आपके ब्राउज़र में सहेजा जाता है। कुछ
भी अपलोड नहीं होता, और बिना किसी कनेक्शन के भी ऐप पूरी तरह चलता है।

### विशेषताएँ

- **Palace** — कमरों का फ़्लोर प्लान, जिसे आप स्वयं सजाते हैं।
- **कमरे का कैनवास** — वस्तुएँ कहीं भी रखें; खींचकर या `L` कुंजी से उनके बीच सम्बन्ध बनाएँ।
- **Graph** — सब कुछ और उनके सम्बन्ध, फ़ोर्स-डायरेक्टेड दृश्य में।
- **Library** — सभी वस्तुएँ एक साथ, खोज, फ़िल्टर और क्रम के साथ।
- **खोज** — बहु-शब्द, शब्द-क्रम से स्वतंत्र, फ़ज़ी मिलान के साथ।
- **पूर्ववत** — हर बदलाव के लिए `Ctrl/⌘ + Z`, कमरा हटाने सहित।
- **ऑफ़लाइन** — इंस्टॉल करने योग्य, और बिना नेटवर्क पूरी तरह उपयोगी।
- **दो थीम** — मोमबत्ती-सी गहरी, या Parchment हल्की।

### आवश्यकताएँ

Node.js 18.18 या नया (विकास Node 22 पर हुआ)।

### संस्थापन

```bash
npm install
npm run dev      # http://localhost:3000
```

### उपयोग

ऐप एक विकल्प के साथ खुलता है: खाली शुरू करें, नमूना palace देखें, या बैकअप आयात करें।
पूरी कीबोर्ड सूची के लिए कभी भी `?` दबाएँ, और खोजने या कहीं भी जाने के लिए
`Ctrl/⌘ + K`।

**Settings → Export JSON** आपके पूरे palace को एक फ़ाइल में उतारता है। आयात उसे
जाँचता है, जो सुधार सकता है सुधारता है, और लागू करने से पहले हर बदलाव सूचीबद्ध करता है।

### कॉन्फ़िगरेशन

`GITHUB_PAGES=true` बिल्ड को `/memory-palace` बेस पाथ के अंतर्गत स्टैटिक एक्सपोर्ट में
बदल देता है। सामान्य `npm run build` Next.js का डिफ़ॉल्ट, सर्वर-सक्षम आउटपुट रखता है —
वास्तविक सुरक्षा हेडर केवल वही भेज सकता है, इसलिए होस्ट किए गए डेमो में
`frame-ancestors` सुरक्षा नहीं है। देखें [`docs/architecture.md`](docs/architecture.md)।

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

### योगदान

पहले [`docs/architecture.md`](docs/architecture.md) पढ़ें — इसमें बताया गया है कि असामान्य
हिस्से वैसे क्यों हैं। हर pull request को CI जैसी ही जाँचों से गुज़रना होता है: फ़ॉर्मैट,
lint, टाइपचेक, यूनिट टेस्ट, दोनों बिल्ड, बंडल बजट, और एंड-टू-एंड सूट।

### लाइसेंस

[MIT](LICENSE) © 𝓐.𝓒.𝓑

[⬆ ऊपर जाएँ](#top)

---

<a id="español"></a>

## Español

### Resumen

La mayoría de las aplicaciones de notas son listas. Memory Palace es un
**lugar**. Las ideas viven en habitaciones que tú mismo distribuyes, los objetos
se quedan donde los colocas en el lienzo, y las relaciones entre ellos forman un
grafo por el que puedes pasear.

Es **local-first**: todo se guarda en tu navegador, al instante y en privado.
No se sube nada, y la aplicación funciona sin conexión alguna.

### Características

- **Palace** — un plano de habitaciones que distribuyes tú.
- **Lienzo de habitación** — coloca objetos donde quieras; conéctalos
  arrastrando o con la tecla `L`.
- **Graph** — una vista dirigida por fuerzas de todo y de cómo se conecta.
- **Library** — todos los objetos a la vez, con búsqueda, filtros y orden.
- **Búsqueda** — de varias palabras, sin importar el orden, con respaldo difuso.
- **Deshacer** — `Ctrl/⌘ + Z` para cada cambio, incluido borrar una habitación.
- **Sin conexión** — instalable y plenamente utilizable sin red.
- **Dos temas** — oscuro a la luz de las velas, o Parchment claro.

### Requisitos

Node.js 18.18 o superior (desarrollado sobre Node 22).

### Instalación

```bash
npm install
npm run dev      # http://localhost:3000
```

### Uso

La aplicación se abre con una elección: empezar en blanco, explorar un palace de
ejemplo o importar una copia. Pulsa `?` en cualquier momento para ver todos los
atajos, y `Ctrl/⌘ + K` para buscar o saltar a cualquier sitio.

**Settings → Export JSON** descarga tu palace entero en un archivo. La
importación lo valida, repara lo que puede y enumera cada cambio antes de
aplicarlo.

### Configuración

`GITHUB_PAGES=true` cambia la compilación a una exportación estática bajo la
ruta base `/memory-palace`. Un `npm run build` normal conserva la salida por
defecto de Next.js, con capacidad de servidor — la única que puede enviar
cabeceras de seguridad reales, de modo que la demo alojada no tiene protección
`frame-ancestors`. Véase [`docs/architecture.md`](docs/architecture.md).

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

### Contribuir

Lee primero [`docs/architecture.md`](docs/architecture.md): explica por qué las
partes poco habituales son como son. Cada pull request debe superar las mismas
comprobaciones que CI: formato, lint, comprobación de tipos, pruebas unitarias,
ambas compilaciones, el presupuesto del bundle y la suite end-to-end.

### Licencia

[MIT](LICENSE) © 𝓐.𝓒.𝓑

[⬆ Volver arriba](#top)

---

<a id="العربية"></a>

## العربية

<div dir="rtl" align="right">

### نظرة عامة

معظم تطبيقات الملاحظات مجرّد قوائم. أمّا Memory Palace فهو **مكان**. تعيش الأفكار في
غرفٍ ترتّبها بنفسك، وتبقى العناصر حيث وضعتها على اللوحة، وتشكّل العلاقات بينها رسمًا
بيانيًا يمكنك التجوّل فيه.

التطبيق **محلّي أولًا**: يُحفظ كل شيء في متصفّحك فورًا وبخصوصية تامة. لا يُرفع أي شيء،
ويعمل التطبيق بالكامل دون أي اتصال بالشبكة.

### المزايا

- **Palace** — مخطّط طابقي من غرفٍ ترتّبها أنت.

- **لوحة الغرفة** — ضع العناصر حيث تشاء، وارسم الروابط بينها بالسحب أو بمفتاح `L`.

- **Graph** — عرض موجَّه بالقوى لكل شيء ولطريقة ارتباطه.

- **Library** — كل العناصر دفعة واحدة، مع البحث والتصفية والترتيب.

- **البحث** — متعدّد الكلمات، لا يتأثر بترتيبها، مع تطابق تقريبي احتياطي.

- **التراجع** — `Ctrl/⌘ + Z` لكل تغيير، بما في ذلك حذف غرفة كاملة.

- **العمل دون اتصال** — قابل للتثبيت، وصالح للاستخدام كاملًا دون شبكة.

- **سمتان** — داكنة بضوء الشموع، أو Parchment الفاتحة.

### المتطلبات

Node.js 18.18 أو أحدث (طُوِّر على Node 22).

### التثبيت

</div>

```bash
npm install
npm run dev      # http://localhost:3000
```

<div dir="rtl" align="right">

### الاستخدام

يبدأ التطبيق بخيار: ابدأ من فراغ، أو تصفّح palace نموذجيًا، أو استورد نسخة احتياطية.
اضغط `?` في أي وقت لعرض كل اختصارات لوحة المفاتيح، و `Ctrl/⌘ + K` للبحث أو الانتقال
إلى أي مكان.

يقوم **Settings → Export JSON** بتنزيل الـ palace بأكمله في ملف واحد. أما الاستيراد
فيتحقّق من الملف، ويصلح ما يمكن إصلاحه، ويسرد كل تغيير قبل تطبيقه.

### الإعداد

يحوّل `GITHUB_PAGES=true` عملية البناء إلى تصدير ثابت ضمن المسار الأساسي
`/memory-palace`. أما `npm run build` العادي فيبقي على مخرجات Next.js الافتراضية
القادرة على العمل كخادم، وهي الوحيدة التي تستطيع إرسال ترويسات أمان حقيقية، ولذلك
لا تتوفّر في النسخة التجريبية المستضافة حماية `frame-ancestors`. انظر
[`docs/architecture.md`](docs/architecture.md).

</div>

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

<div dir="rtl" align="right">

### المساهمة

اقرأ [`docs/architecture.md`](docs/architecture.md) أولًا؛ فهو يشرح سبب كون الأجزاء غير
المألوفة على ما هي عليه. على كل pull request أن يجتاز البوابات نفسها التي يجتازها CI:
التنسيق، و lint، وفحص الأنواع، واختبارات الوحدات، وكلا البناءين، وميزانية الحزمة،
ومجموعة الاختبارات الشاملة.

### الرخصة

[MIT](LICENSE) © 𝓐.𝓒.𝓑

</div>

[⬆ العودة إلى الأعلى](#top)

---

<a id="português-brasil"></a>

## Português (Brasil)

### Visão geral

A maioria dos aplicativos de notas é uma lista. O Memory Palace é um **lugar**.
As ideias moram em salas que você mesmo organiza, os objetos ficam onde você os
coloca na tela, e as relações entre eles formam um grafo por onde se pode
caminhar.

Ele é **local-first**: tudo é salvo no seu navegador, na hora e de forma
privada. Nada é enviado para lugar nenhum, e o aplicativo funciona sem conexão.

### Recursos

- **Palace** — uma planta baixa de salas organizada por você.
- **Tela da sala** — coloque objetos onde quiser; ligue-os arrastando ou com a
  tecla `L`.
- **Graph** — uma visão dirigida por forças de tudo e de como se conecta.
- **Library** — todos os objetos de uma vez, com busca, filtros e ordenação.
- **Busca** — com várias palavras, independente da ordem, com correspondência
  aproximada como reserva.
- **Desfazer** — `Ctrl/⌘ + Z` para cada mudança, inclusive excluir uma sala.
- **Offline** — instalável e totalmente utilizável sem rede.
- **Dois temas** — escuro à luz de velas, ou Parchment claro.

### Requisitos

Node.js 18.18 ou mais recente (desenvolvido no Node 22).

### Instalação

```bash
npm install
npm run dev      # http://localhost:3000
```

### Uso

O aplicativo abre com uma escolha: começar vazio, explorar um palace de exemplo
ou importar um backup. Pressione `?` a qualquer momento para ver todos os atalhos
e `Ctrl/⌘ + K` para buscar ou ir a qualquer lugar.

**Settings → Export JSON** baixa o seu palace inteiro em um arquivo. A
importação valida o arquivo, repara o que consegue e lista cada mudança antes de
aplicá-la.

### Configuração

`GITHUB_PAGES=true` muda a compilação para uma exportação estática sob o caminho
base `/memory-palace`. Um `npm run build` comum mantém a saída padrão do
Next.js, com capacidade de servidor — a única que consegue enviar cabeçalhos de
segurança reais, por isso a demonstração hospedada não tem proteção
`frame-ancestors`. Veja [`docs/architecture.md`](docs/architecture.md).

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

### Como contribuir

Leia primeiro [`docs/architecture.md`](docs/architecture.md) — ele explica por
que as partes incomuns são como são. Todo pull request precisa passar pelas
mesmas verificações do CI: formatação, lint, checagem de tipos, testes
unitários, as duas compilações, o orçamento do bundle e a suíte end-to-end.

### Licença

[MIT](LICENSE) © 𝓐.𝓒.𝓑

[⬆ Voltar ao topo](#top)

---

<a id="русский"></a>

## Русский

### Обзор

Большинство приложений для заметок — это списки. Memory Palace — это **место**.
Идеи живут в комнатах, которые вы расставляете сами, объекты остаются там, куда
вы их положили на холсте, а связи между ними образуют граф, по которому можно
бродить.

Приложение работает **локально**: всё сохраняется в вашем браузере, мгновенно и
приватно. Никуда ничего не загружается, и всё работает вообще без сети.

### Возможности

- **Palace** — план этажа из комнат, который вы составляете сами.
- **Холст комнаты** — размещайте объекты где угодно; связывайте их
  перетаскиванием или клавишей `L`.
- **Graph** — силовое представление всего и всех связей.
- **Library** — все объекты сразу, с поиском, фильтрами и сортировкой.
- **Поиск** — по нескольким словам, независимо от порядка, с нечётким запасным
  вариантом.
- **Отмена** — `Ctrl/⌘ + Z` для любого изменения, включая удаление комнаты.
- **Офлайн** — устанавливается и полностью работает без сети.
- **Две темы** — тёмная при свете свечей или светлая Parchment.

### Требования

Node.js 18.18 или новее (разработка велась на Node 22).

### Установка

```bash
npm install
npm run dev      # http://localhost:3000
```

### Использование

Приложение открывается с выбора: начать с пустого, посмотреть образец palace или
импортировать резервную копию. Нажмите `?` в любой момент, чтобы увидеть все
сочетания клавиш, и `Ctrl/⌘ + K`, чтобы найти что-нибудь или перейти куда угодно.

**Settings → Export JSON** выгружает весь ваш palace одним файлом. Импорт
проверяет файл, чинит что может и перечисляет каждое изменение до применения.

### Настройка

`GITHUB_PAGES=true` переключает сборку на статический экспорт по базовому пути
`/memory-palace`. Обычный `npm run build` сохраняет стандартный серверный вывод
Next.js — только он может отправлять настоящие заголовки безопасности, поэтому у
размещённой демоверсии нет защиты `frame-ancestors`. См.
[`docs/architecture.md`](docs/architecture.md).

```bash
npm run build           # server build
npm run build:export    # static site in ./out
npm test                # unit tests
npm run test:e2e        # both deploy targets, end to end
```

### Как участвовать

Сначала прочитайте [`docs/architecture.md`](docs/architecture.md) — там
объясняется, почему нестандартные части сделаны именно так. Каждый pull request
обязан пройти те же проверки, что и CI: форматирование, lint, проверку типов,
модульные тесты, обе сборки, бюджет бандла и end-to-end набор.

### Лицензия

[MIT](LICENSE) © 𝓐.𝓒.𝓑

[⬆ Наверх](#top)
