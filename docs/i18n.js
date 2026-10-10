(() => {
  'use strict';
  const en={'Скорость':'Speed','Красное сердце':'Red heartbeat',
    'Конструктор подсветки · USB / Layer 2':'RGB editor · USB / Layer 2',
    'Океан':'Ocean','Лава':'Lava','Зелёный код':'Green code','Закат':'Sunset','Радар':'Radar','Сахарный неон':'Candy neon','Волна от нажатия':'Key ripple','Огненные клавиши':'Fire keys',
    'Реакция на нажатия':'Key reactions','Режим реакции':'Reaction mode','Выключено':'Off','Вспышка клавиши':'Key flash','Расходящаяся волна':'Expanding ripple','Тёплый след':'Heat trail','Цвет реакции':'Reaction colour','Затухание, секунды':'Fade, seconds','Сила, %':'Strength, %','Проверять нажатия на схеме':'Test keys on the diagram',
    'Подключить нажатия этой вкладки':'Connect key presses from this tab','Отключить нажатия сайтов':'Disconnect website key presses','Нажатия вкладки подключены. В конструкторе включи реакцию и запусти анимацию.':'Tab key presses connected. Enable a reaction in the editor and run the animation.','Нажатия сайтов отключены.':'Website key presses disconnected.',
    'Включи проверку и нажимай клавиши на схеме или на клавиатуре. Для сайтов Chrome открой окно расширения на нужной вкладке и нажми «Подключить нажатия этой вкладки». В других программах Windows реакции недоступны.':'Enable the test and click diagram keys or press your keyboard. For Chrome websites, open the extension popup on the chosen tab and click “Connect key presses from this tab”. Reactions are unavailable in other Windows apps.',
    'Анимировать выбранные':'Animate selected','Анимировать все':'Animate all','Клик выбирает клавиши для редактирования кадра. По умолчанию новый проект анимирует всю клавиатуру. Для отдельного участка нажми «Анимировать выбранные».':'Click keys to edit the frame. New projects animate the whole keyboard by default. Use “Animate selected” to limit playback to a region.',
    'Выбери шаблон…':'Choose a preset…','Образец Layer 1 · считай слой, чтобы загрузить свой рисунок':'Sample Layer 1 · read the layer to load your design','На экране: предпросмотр анимации':'On screen: animation preview','На экране: пауза в текущей позиции':'On screen: paused at the current position','На экране: исходный рисунок Layer 1':'On screen: Layer 1 source design',
    'Яркость кадра':'Frame brightness','Взять цвета Layer 1':'Use Layer 1 colours','Новый пустой проект':'New blank project','Новый проект: один пустой кадр.':'New project: one blank frame.',
    'Выбор шаблона сразу открывает его. Все кадры можно редактировать.':'Selecting a preset opens it immediately. Every frame is editable.',
    'После остановки':'When stopped','Оставить последний кадр':'Keep last frame','Вернуть подсветку до запуска':'Restore lighting before playback','Вернуть Layer 1':'Restore Layer 1',
    'Проект из конструктора':'Project from editor','▶ Продолжить предпросмотр':'▶ Resume preview',
    'Остановлено. Вернулась подсветка до запуска.':'Stopped. Lighting from before playback restored.','Остановлено. Последний кадр остался на клавиатуре.':'Stopped. The last frame stays on the keyboard.',
    'Использую сохранённое разрешение USB…':'Using the saved USB permission…',
    'Подключить клавиатуру':'Connect keyboard','▶ Запустить на клавиатуре':'▶ Run on keyboard','Предпросмотр меняет только экран. «Запустить на клавиатуре» включает клавиатуру.':'Preview changes the screen only. “Run on keyboard” controls the keyboard.',
    'Готовые анимации':'Ready-made animations','Цветы · распускаются':'Flowers · blooming','Северное сияние':'Northern lights','Комета':'Comet','Светлячки':'Fireflies','Радужная волна':'Rainbow wave','Неоновый дождь':'Neon rain','Искры':'Sparkles','Открыть шаблон':'Open preset',
    'Шаблон выбирает всю клавиатуру. Можно менять его кадры и цвета.':'The preset selects the whole keyboard. You can edit its frames and colours.',
    'Подключение открыто в отдельной вкладке. Вернись сюда после подключения.':'Connection opened in a separate tab. Return here after connecting.',
    'Подключение клавиатуры':'Keyboard connection','Эта вкладка остаётся открытой во время выбора USB-устройства.':'This tab stays open while you select the USB device.',
    'На сайте CIDOO подключи клавиатуру и выбери Пользовательский → Layer 2.':'Connect your keyboard on the CIDOO website and select Custom → Layer 2.',
    'Нажми кнопку ниже. В окне Chrome выбери клавиатуру и подтверди подключение.':'Click the button below. Select the keyboard in Chrome’s picker and confirm.',
    'Вернись в конструктор и нажми «Считать Layer 1».':'Return to the editor and click “Read Layer 1”.',
    'Определяю устройство на сайте…':'Identifying the device on the website…','Выбрать USB-клавиатуру':'Select USB keyboard','Проверить сайт снова':'Check website again',
    'Устройство не выбрано. Нажми кнопку снова, выбери клавиатуру в списке и подтверди подключение.':'No device selected. Click again, select the keyboard in the list and confirm.',
    'Передаю управление расширению…':'Handing control to the extension…','Подключено. Вернись в конструктор и нажми «Считать Layer 1». Layer 1 не изменён.':'Connected. Return to the editor and click “Read Layer 1”. Layer 1 is unchanged.',
    'Chrome не разрешил выбор USB. Нажми кнопку снова в этой вкладке.':'Chrome did not allow the USB picker. Click the button again in this tab.',
    'Конструктор подсветки · все модели CIDOO':'RGB animation editor · all CIDOO models','Выбор клавиш CIDOO':'CIDOO key selection','Кадры анимации':'Animation frames',
    'Предпросмотр без клавиатуры':'Preview without a keyboard','Подключить клавиатуру':'Connect keyboard',
    'Твой рисунок. Твоя анимация.':'Your design. Your animation.',
    'Выбери клавиши и эффект. Или нарисуй несколько кадров — редактор плавно соединит их.':'Select keys and an effect. Or draw your own frames and blend them into an animation.',
    'Как создать анимацию ↗':'Create your own animation ↗','Клавиатура':'Keyboard',
    'Образец сердца · считай Layer 1, чтобы загрузить свой рисунок':'Sample heart · read Layer 1 to load your design',
    'Layer 1 · только чтение':'Layer 1 · read only','Layer 2 · анимация':'Layer 2 · animation',
    'Сердце':'Heart','Все':'All keys','Снять выбор':'Clear selection','По цвету':'By colour',
    'Цвет для выбора клавиш':'Colour used to select keys','Считать Layer 1':'Read Layer 1',
    '▶ Предпросмотр':'▶ Preview','❚❚ Пауза предпросмотра':'❚❚ Pause preview',
    'Предпросмотр меняет только экран. «Запустить на клавиатуре» включает клавиатуру.':'Preview changes the screen only. “Run on keyboard” controls the keyboard.',
    'Кадры':'Frames','+ Кадр':'+ Frame','Дублировать':'Duplicate','Удалить кадр':'Delete frame',
    'Цвет':'Colour','Залить выбранные':'Fill selected','Яркость исходника':'Source brightness',
    'Применить яркость':'Apply brightness','Вернуть исходные цвета':'Restore source colours','Время кадра, мс':'Frame duration, ms',
    'Клик по клавише включает или исключает её из анимации. Цвет меняется только в выбранном кадре. Layer 1 остаётся исходником.':'Click a key to include it in the animation or exclude it. Colour edits apply to the selected frame. Layer 1 remains your source.',
    'Мои анимации':'My animations','Сохранить в библиотеку':'Save to library','Скачать JSON':'Download JSON','Открыть JSON':'Open JSON',
    'Настройки анимации':'Animation settings','Название':'Name','Эффект':'Effect',
    'Биение · тук-тук':'Heartbeat · double pulse','Мягкое дыхание':'Gentle breathing','Переливание':'Colour shimmer',
    'Красно-розовое переливание':'Red-pink shimmer','Биение + переливание':'Heartbeat + shimmer','Свои кадры':'Custom frames',
    'Темп':'Tempo','Нижняя яркость, %':'Minimum brightness, %','Тусклый уровень, %':'Minimum brightness, %','Пиковый уровень, %':'Peak brightness, %','Пик, %':'Peak, %',
    'Переходы':'Transitions','Плавные':'Smooth','Без перехода':'Instant',
    'Частота кадров':'Frame rate','Кадров в секунду':'Frames per second','4 · экономно':'4 · low power','8 · рекомендовано':'8 · recommended','12 · плавнее':'12 · smoother','20 · максимум':'20 · maximum',
    'Автовыключение':'Auto stop','Никогда':'Never','По таймеру':'Timer','Часы':'Hours','Минуты':'Minutes','Секунды':'Seconds',
    '▶ Запустить на клавиатуре':'▶ Run on keyboard','Запустить':'Start','Остановить':'Stop','Остановить и вернуть рисунок':'Stop and restore design',
    'Сначала подключи клавиатуру. Предпросмотр доступен без подключения.':'Connect the keyboard first. Preview is available without a connection.',
    'Работает в фоне':'Runs in the background',
    'После запуска можно свернуть или закрыть редактор. Chrome должен оставаться запущенным.':'After starting, you can minimise or close the editor. Keep Chrome running.',
    'Подключение за 3 шага':'Connect in 3 steps','На':'On the','сайте CIDOO':'CIDOO website',
    'подключи клавиатуру и включи «Пользовательский → Layer 2».':'connect the keyboard and enable “Custom → Layer 2”.',
    'Нажми «Подключить клавиатуру» и выбери устройство в окне Chrome.':'Click “Connect keyboard” and select the device in Chrome.',
    'Нажми «Считать Layer 1». Теперь редактор показывает твой исходник.':'Click “Read Layer 1” to load your source design.',
    'Управление перейдёт расширению; сайт покажет отключение. Пока анимация работает, не подключай клавиатуру обратно к сайту.':'Control moves to the extension; the website will show the device as disconnected. Do not reconnect the website while the animation is running.',
    '↶ Отменить последнее изменение':'↶ Undo last change',
    'CIDOO · исходник Layer 1 · запись Layer 2 · HiKei1337':'CIDOO · read Layer 1 · write Layer 2 · HiKei1337',
    'Живое сердце':'Living heart','Меняются цвета сердца. Фон и Caps Lock сохраняются.':'Only the heart animates. Background and Caps Lock stay unchanged.',
    'Подключить фоновое управление':'Connect background control','Открыть конструктор анимации':'Open animation editor',
    'Копировать Layer 1 → 2':'Copy Layer 1 → 2','Подключение и команды':'Connection and shortcuts',
    'На сайте выберите «Пользовательский» → Layer 2. Нажмите «Подключить фоновое управление» и выберите C80 в окне Chrome.':'On the website, select “Custom” → Layer 2. Click “Connect background control” and select C80 in Chrome.',
    'Управление перейдёт расширению: сайт покажет отключение клавиатуры. Теперь вкладку можно свернуть или закрыть. Пока эффект работает, не подключайте устройство обратно к сайту.':'Control moves to the extension and the website shows the keyboard as disconnected. You can minimise or close the tab. Do not reconnect the website while the effect is running.',
    'Alt + Shift + H — запуск / остановка.':'Alt + Shift + H — start / stop.',
    'Alt + Shift + S — остановка.':'Alt + Shift + S — stop.',
    '«Никогда» — до ручной остановки. Таймер отсчитывается после запуска.':'“Never” runs until you stop it. The timer starts when the animation starts.',
    'Открыть сайт CIDOO':'Open CIDOO website','Вернуть резервную копию Layer 2':'Restore Layer 2 backup',
    'Проверяю подключение…':'Checking connection…','Фоновое управление готово. Вкладку можно свернуть или закрыть.':'Background control is ready. You can minimise or close the tab.',
    'Подключите клавиатуру к фоновому управлению.':'Connect the keyboard to background control.',
    'Укажите время таймера больше нуля или выберите «Никогда».':'Enter a non-zero timer or select “Never”.',
    'Укажи время таймера больше нуля или выбери «Никогда».':'Enter a non-zero timer or select “Never”.',
    'Расширение не получило ответ.':'No response from the extension.','Подключение отменено.':'Connection cancelled.',
    'Подключи C80. Предпросмотр работает без подключения.':'Connect C80. Preview works without a connection.',
    'C80 · управление расширением':'C80 · extension control','Клавиатура не подключена':'Keyboard disconnected',
    'Рисунок считан с Layer 1 · исходный слой не изменяется':'Design read from Layer 1 · the source layer is never modified',
    'Готово. Исходник Layer 1 будет прочитан перед запуском.':'Ready. Layer 1 will be read before the animation starts.',
    'Подключено. Рисунок Layer 1 загружен.':'Connected. Layer 1 design loaded.',
    'Layer 1 прочитан. Изменений в нём нет.':'Layer 1 read. No changes were made to it.',
    'Анимация запущена в Layer 2. Можно закрыть редактор.':'Animation running on Layer 2. You can close the editor.',
    'Остановлено. В Layer 2 возвращён рисунок из Layer 1.':'Stopped. The Layer 1 design has been restored to Layer 2.',
    'Сначала выбери клавиши на схеме.':'Select keys on the keyboard first.','Выбери хотя бы одну клавишу.':'Select at least one key.','Добавь кадр.':'Add a frame.',
    'Максимум 120 кадров.':'Maximum 120 frames.','Оставь хотя бы один кадр.':'Keep at least one frame.','Пока нечего отменять.':'Nothing to undo yet.',
    'Исходник из сохранённого проекта · перед запуском читается Layer 1':'Source from a saved project · Layer 1 is read before starting',
    'Исходник из JSON · перед запуском читается Layer 1':'Source from JSON · Layer 1 is read before starting',
    'Удалено из библиотеки. Экспортированный файл не изменён.':'Removed from the library. Exported files were not changed.',
    'JSON скачан. Его можно открыть в этом редакторе или поделиться файлом.':'JSON downloaded. Open it in this editor or share the file.',
    'Файл слишком большой: максимум 1 МБ.':'File too large: maximum 1 MB.',
    'Режим предпросмотра: устройство не подключается. Загрузи расширение в Chrome для управления клавиатурой.':'Preview mode: no device connection. Load the extension in Chrome to control the keyboard.',
    'Загрузи папку как расширение Chrome. В обычной вкладке доступен только конструктор и предпросмотр.':'Load this folder as a Chrome extension. A regular tab supports editing and preview only.',
    'Сохрани анимацию, чтобы вернуться к ней позже.':'Save an animation to return to it later.',
    'Подключите CIDOO C80 к новой версии сайта и выберите Пользовательский → Layer 2.':'Connect CIDOO C80 to the new website version and select Custom → Layer 2.',
    'Подключена не CIDOO C80.':'The connected device is not CIDOO C80.',
    'Включите Пользовательский → Layer 2 на сайте.':'Enable Custom → Layer 2 on the website.',
    'Не определена клавиатура. Подключите её к расширению.':'Keyboard not identified. Connect it to the extension.',
    'Разрешите расширению доступ к одной CIDOO C80 с интерфейсом подсветки.':'Allow the extension access to one CIDOO C80 lighting interface.',
    'Нажмите «Подключить фоновое управление».':'Click “Connect background control”.',
    'Клавиатура не ответила полностью за 2 секунды.':'The keyboard did not send a complete response within 2 seconds.',
    'На сайте включите подсветку и Пользовательский → Layer 2, затем подключите расширение.':'Enable lighting and Custom → Layer 2 on the website, then connect the extension.',
    'Неполная страница цветов; запись отменена.':'Incomplete colour page; no colours were written.',
    'Неверный размер кадра.':'Invalid frame size.',
    'Для этой клавиатуры и профиля нет резервной копии.':'No backup exists for this keyboard and profile.',
    'Откройте одну вкладку CIDOO в Chrome, подключите C80 и выберите Пользовательский → Layer 2.':'Open one CIDOO tab in Chrome, connect C80 and select Custom → Layer 2.',
    'Сайт не ответил.':'The website did not respond.','Клавиатура на сайте изменилась. Подключите её снова.':'The website device changed. Connect it again.',
    'Неизвестная команда.':'Unknown command.','Клавиатура отключена. Подключите её снова.':'Keyboard disconnected. Connect it again.',
    'В кадре должно быть 396 значений RGB от 0 до 255.':'A frame must contain 396 RGB values between 0 and 255.',
    'Это не проект CIDOO RGB Studio версии 1.':'This is not a CIDOO RGB Studio version 1 project.',
    'Разрешено только чтение Layer 1 и анимация Layer 2.':'Only reading Layer 1 and animating Layer 2 are allowed.',
    'Выберите хотя бы одну клавишу для анимации.':'Select at least one key to animate.',
    'Неизвестный эффект.':'Unknown effect.','В проекте может быть не более 120 кадров.':'A project can contain up to 120 frames.',
    'Добавьте хотя бы один кадр.':'Add at least one frame.',
    'Длительность кадра должна быть от 50 до 60000 мс.':'Frame duration must be between 50 and 60000 ms.'
  };
  const nodes=new WeakMap(),attributes=new WeakMap();let language='ru';
  function translate(value){
    const clean=value.trim();let result=en[clean];
    if(!result){
      result=clean.replace(/^Выбрано (\d+) клавиш(?:а)?$/,'$1 keys selected').replace(/^Клавиш выбрано: (\d+)$/,'$1 keys selected').replace(/^Для редактирования: (\d+) · В анимации: (\d+)$/,'Editing: $1 · Animated: $2').replace(/^Кадр (\d+)$/,'Frame $1').replace(/^На экране: кадр (\d+) · /,'On screen: frame $1 · ')
        .replace(/^(\d+) уд\/мин$/,'$1 BPM').replace(/^Устройство найдено: (.+)\. Нажми «Выбрать USB-клавиатуру»\.$/, 'Device found: $1. Click “Select USB keyboard”.').replace(/^Сохранено: /,'Saved: ').replace(/^Открыто: /,'Opened: ')
        .replace(/^Анимация открыта: /,'Animation opened: ').replace(/^Удалить из библиотеки /,'Remove from library: ')
        .replace(/^(\d+) мс$/,'$1 ms').replace(/ · выбрать для анимации$/,' · select to animate').replace(/без таймера/g,'no timer')
        .replace(/осталось /g,'remaining ').replace(/Работает в фоне/g,'Running in background').replace(/уд\/мин/g,'BPM').replace(/Анимация/g,'Animation').replace(/Возврат цветов не подтверждён: /g,'Colour restoration was not confirmed: ');
    }
    return value.replace(clean,result||clean);
  }
  function localize(root){
    if(root.nodeType===3){
      if(root.parentElement?.closest('[data-no-i18n],script,style,option[value="ru"],option[value="en"]'))return;
      let entry=nodes.get(root);if(!entry||root.nodeValue!==entry.rendered)entry={original:root.nodeValue,rendered:root.nodeValue};
      const text=language==='en'?translate(entry.original):entry.original;entry.rendered=text;nodes.set(root,entry);if(root.nodeValue!==text)root.nodeValue=text;return;
    }
    if(root.nodeType!==1&&root.nodeType!==9)return;
    if(root.nodeType===1){
      if(root.closest('[data-no-i18n],script,style'))return;
      let saved=attributes.get(root)||{};
      for(const name of ['title','aria-label','placeholder'])if(root.hasAttribute(name)){
        const value=root.getAttribute(name);if(!saved[name]||value!==saved[name].rendered)saved[name]={original:value,rendered:value};const text=language==='en'?translate(saved[name].original):saved[name].original;saved[name].rendered=text;if(value!==text)root.setAttribute(name,text);
      }
      attributes.set(root,saved);
    }
    for(const child of root.childNodes)localize(child);
  }
  async function setLanguage(value,persist=true){
    language=value==='en'?'en':'ru';document.documentElement.lang=language;localize(document.body);
    if(document.querySelector('#keyboard'))document.title=language==='en'?'CIDOO RGB Studio — animation editor':'CIDOO RGB Studio — конструктор анимации';
    for(const button of document.querySelectorAll('[data-lang]'))button.setAttribute('aria-pressed',String(button.dataset.lang===language));
    const help=document.querySelector('.help-link');if(help)help.href='https://github.com/HiKei1337/cidookeyboardanimations/blob/main/docs/'+(language==='en'?'CUSTOM_ANIMATION.en.md':'CUSTOM_ANIMATION.md');
    if(persist){if(globalThis.chrome?.runtime?.id)await chrome.storage.local.set({language});else localStorage.setItem('cidooStudio.language',language);}
  }
  async function init(){
    const saved=globalThis.chrome?.runtime?.id?(await chrome.storage.local.get('language')).language:localStorage.getItem('cidooStudio.language');
    await setLanguage(saved||(navigator.language?.toLowerCase().startsWith('ru')?'ru':'en'),false);
    for(const button of document.querySelectorAll('[data-lang]'))button.addEventListener('click',()=>setLanguage(button.dataset.lang));
    new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')localize(record.target);else for(const node of record.addedNodes)localize(node);}}).observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  globalThis.CidooI18n=Object.freeze({translate,setLanguage,get language(){return language;}});
  if(typeof document==='undefined')return;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
