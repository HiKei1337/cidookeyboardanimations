# 60 GIF для CIDOO RGB Studio

Каждый файл прошёл через настоящий импорт конструктора. В папке `projects` — JSON, полученный после импорта. Все примеры анимированы; это не статичные картинки. Проверено в предпросмотре, а не на физической клавиатуре.

1. Открой `index.html` в Chrome: каталог работает и без сервера. На сайте: https://hikei1337.github.io/cidookeyboardanimations/gif-examples/
2. Выбери пример и скачай GIF или готовый JSON.
3. В конструкторе расширения нажми «Импорт GIF / картинки», выбери GIF и нажми «Создать кадры». Для JSON — «Открыть JSON».
4. Подключи клавиатуру и нажми «Запустить на клавиатуре».

Рекомендуемые настройки: 100%, «Вместить целиком», фон #000000, средний цвет клавиши, 8 кадров/с. Файлы подогнаны под изученную раскладку, на других моделях может понадобиться подгонка. На сайте доступен предпросмотр; для USB нужен конструктор установленного расширения.

В `gifs` находятся 60 исходных GIF, в `projects` — 60 проектов. Каждый цикл длится 4 секунды. JSON содержит 32 кадра. Коллекция начинается с простых фигур: сердце, смайлик, глаза, привидение, инопланетянин, звезда. Для движения попробуй змейку, понг, стрелки, метеор и комету.

Файлы специально подготовлены для проекта, не скачаны у чужих художников. Автор: HiKei1337. Условия использования — LICENSE и NOTICE. Код рисования — generate.py (нужен Pillow), геометрия клавиатуры — layout-geometry.json. Генератор делает исходные GIF; готовые JSON в этом наборе получены настоящим импортом браузерного конструктора.

## English

60 purpose-made animated GIFs and 60 editable JSON projects. Each GIF was imported using the real editor, then exported as JSON. Checks cover the preview; physical LED output and other keyboard layouts are unverified.

Open `index.html` in Chrome for the offline gallery. Download an example, then use **Import GIF / image → Create frames → Run on keyboard** in the extension. For JSON, use **Open JSON**. Defaults: 100%, Fit whole image, #000000 background, average key colour, 8 FPS. Each loop lasts four seconds with 32 output frames.

Original artwork for CIDOO RGB Studio, author HiKei1337. See LICENSE and NOTICE. `generate.py` uses Pillow to draw the source GIFs; `layout-geometry.json` contains the keyboard geometry.
