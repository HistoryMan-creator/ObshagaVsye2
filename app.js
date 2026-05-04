document.addEventListener('DOMContentLoaded', () => {
    const taskContainer = document.getElementById('task-container');
    const navButtons = document.querySelectorAll('.nav-btn');
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    const successOverlay = document.getElementById('success-overlay');
    
    // Statistics & Skills state
    const defaultStats = {
        completed: { '18': 0, '19': 0, '20': 0, '22': 0, '25': 0 },
        skills: { theorist: 0, lawyer: 0, logic: 0 },
        mistakes: 0,
        perfect: 0,
        answerHistory: []
    };
    
    const ANSWER_HISTORY_LIMIT = 50;

    function normalizeStats(stats) {
        const source = stats && typeof stats === 'object' ? stats : {};
        return {
            completed: { ...defaultStats.completed, ...(source.completed || {}) },
            skills: { ...defaultStats.skills, ...(source.skills || {}) },
            mistakes: Number(source.mistakes || 0),
            perfect: Number(source.perfect || 0),
            answerHistory: Array.isArray(source.answerHistory) ? source.answerHistory : []
        };
    }

    function loadStats() {
        try {
            return normalizeStats(JSON.parse(localStorage.getItem('obsh_stats')));
        } catch (e) {
            return normalizeStats(defaultStats);
        }
    }

    let userStats = loadStats();
    
    function saveStats() {
        localStorage.setItem('obsh_stats', JSON.stringify(userStats));
        renderSidebarStats();
    }
    
    function renderSidebarStats() {
        const calcProgress = xp => xp % 100;
        document.getElementById('skill-theorist').style.width = `${calcProgress(userStats.skills.theorist)}%`;
        document.getElementById('skill-lawyer').style.width = `${calcProgress(userStats.skills.lawyer)}%`;
        document.getElementById('skill-logic').style.width = `${calcProgress(userStats.skills.logic)}%`;
    }
    
    // Initialize sidebar
    renderSidebarStats();
    
    function updateSkill(skill, amount) {
        userStats.skills[skill] += amount;
        saveStats();
        
        // Show success animation overlay
        successOverlay.classList.remove('hidden');
        setTimeout(() => successOverlay.classList.add('hidden'), 1500);
    }
    
    // Navigation logic
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navButtons.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
            
            // Скрываем модальное окно фактов при любой навигации
            const rfFactsModal = document.getElementById('rf-facts-modal');
            if(rfFactsModal) rfFactsModal.classList.add('hidden');
            
            const task = target.dataset.task;
            if (task) {
                renderTask(task);
            }
        });
    });
    
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    
    function renderTask(taskNumber) {
        taskContainer.innerHTML = '';
        taskContainer.className = 'anim-in';
        setTimeout(() => taskContainer.classList.remove('anim-in'), 350);
        
        switch(taskNumber) {
            case '18': renderTask18(); break;
            case '19': renderTask19(); break;
            case '20': renderTask20(); break;
            case '22': renderTask22(); break;
            case '25': renderTask25(); break;
            case 'stats': renderStats(); break;
            default: renderTask18();
        }
    }
    window.renderTask = renderTask;
    
    // UI Helper components
    function createAntiPattern(wrong, right) {
        return `
            <div class="antipattern mb-16">
                <button class="antipattern-toggle" onclick="this.nextElementSibling.classList.toggle('open')">
                    <span>⚠️ Как делают 80% (и теряют баллы)</span>
                    <span>▼</span>
                </button>
                <div class="antipattern-body">
                    <div class="antipattern-col">
                        <h4>Неправильно</h4>
                        <p>${wrong}</p>
                    </div>
                    <div class="antipattern-col">
                        <h4>Как хочет эксперт</h4>
                        <p>${right}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createChecklist(items) {
        return `
            <ul class="checklist mt-12 mb-16">
                ${items.map(item => `
                    <li onclick="this.classList.toggle('checked')">
                        <div class="check-box">✓</div>
                        <span>${item}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    function createFipiStatus(title, status, details) {
        const classes = {
            accepted: 'alert-tip',
            rejected: 'alert-error',
            extra: 'alert-warn'
        };
        const labels = {
            accepted: 'засчитывается',
            rejected: 'не засчитывается',
            extra: 'есть лишняя/ошибочная позиция'
        };
        const icons = {
            accepted: '✅',
            rejected: '❌',
            extra: '⚠️'
        };
        return `
            <div class="alert ${classes[status]} mb-8" style="padding:10px;">
                <span class="alert-icon">${icons[status]}</span>
                <span><strong>${title}:</strong> ${labels[status]}. ${details}</span>
            </div>
        `;
    }

    function splitAnswerPositions(text) {
        return text
            .split(/\n|;/)
            .map(item => item.replace(/^\s*(\d+[\).:-]?|[-–—])\s*/, '').trim())
            .filter(Boolean);
    }

    function wordCount(text) {
        return (text.trim().match(/[A-Za-zА-Яа-яЁё0-9]+/g) || []).length;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function recordAnswer(task, title, answer, verdict) {
        userStats.answerHistory = userStats.answerHistory || [];
        userStats.answerHistory.unshift({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            date: new Date().toISOString(),
            task,
            title,
            answer,
            verdict
        });
        userStats.answerHistory = userStats.answerHistory.slice(0, ANSWER_HISTORY_LIMIT);
        saveStats();
    }
    
    function renderStats() {
        const totalCompleted = Object.values(userStats.completed).reduce((a, b) => a + b, 0);
        const calcLevel = xp => Math.floor(xp / 100) + 1;
        const recentAnswers = (userStats.answerHistory || []).slice(0, 10);
        
        taskContainer.innerHTML = `
            <h2 class="task-title">Моя статистика</h2>
            <p class="task-subtitle">Подробный учет успеваемости</p>
            
            <div class="card card-purple">
                <h3 class="section-title mb-16">Общий прогресс</h3>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
                    <div style="flex: 1; min-width: 150px; background: var(--bg); padding: 16px; border: var(--border); border-radius: var(--radius); text-align: center;">
                        <div style="font-size: 32px; font-weight: 700;">${totalCompleted}</div>
                        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Заданий решено</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: var(--bg); padding: 16px; border: var(--border); border-radius: var(--radius); text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: var(--green);">${userStats.perfect || 0}</div>
                        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Идеальных ответов</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: var(--bg); padding: 16px; border: var(--border); border-radius: var(--radius); text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: var(--red);">${userStats.mistakes || 0}</div>
                        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Ошибок допущено</div>
                    </div>
                </div>
                
                <h3 class="section-title mb-16">Решено по типам заданий</h3>
                <div class="stats-grid mb-16" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
                    ${Object.entries(userStats.completed).map(([task, count]) => `
                        <div style="background: var(--card); padding: 12px; border: 2px solid var(--text); border-radius: var(--radius); text-align: center;">
                            <div style="font-size: 20px; font-weight: 700;">№ ${task}</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--pink); margin: 8px 0;">${count}</div>
                            <div style="font-size: 10px; text-transform: uppercase; font-weight: bold; opacity: 0.7;">раз</div>
                        </div>
                    `).join('')}
                </div>

                <h3 class="section-title mb-16">Уровни навыков</h3>
                <div class="skill-levels">
                    <div class="mb-12">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong>🧠 Теоретик (Уровень ${calcLevel(userStats.skills.theorist)})</strong>
                            <span>${userStats.skills.theorist % 100} / 100 XP</span>
                        </div>
                        <div class="skill-track"><div class="skill-fill" style="width: ${userStats.skills.theorist % 100}%"></div></div>
                    </div>
                    <div class="mb-12">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong>⚖️ Юрист (Уровень ${calcLevel(userStats.skills.lawyer)})</strong>
                            <span>${userStats.skills.lawyer % 100} / 100 XP</span>
                        </div>
                        <div class="skill-track"><div class="skill-fill skill-fill-blue" style="width: ${userStats.skills.lawyer % 100}%"></div></div>
                    </div>
                    <div class="mb-12">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong>🔗 Логик (Уровень ${calcLevel(userStats.skills.logic)})</strong>
                            <span>${userStats.skills.logic % 100} / 100 XP</span>
                        </div>
                        <div class="skill-track"><div class="skill-fill skill-fill-purple" style="width: ${userStats.skills.logic % 100}%"></div></div>
                    </div>
                </div>
                
                <button class="btn btn-red mt-16" id="reset-stats">Сбросить прогресс</button>
            </div>

            <div class="card card-blue mt-16">
                <h3 class="section-title mb-16">Последние ответы</h3>
                ${recentAnswers.length ? recentAnswers.map(item => `
                    <div class="expert-box mb-12">
                        <div class="expert-header">№ ${escapeHtml(item.task)} · ${escapeHtml(item.title)} · ${escapeHtml(item.verdict)}</div>
                        <div class="expert-body">
                            <div class="field-hint mb-8">${new Date(item.date).toLocaleString('ru-RU')}</div>
                            <pre style="white-space:pre-wrap; font-family:inherit; margin:0;">${escapeHtml(item.answer)}</pre>
                        </div>
                    </div>
                `).join('') : '<p class="field-hint">Пока нет сохранённых ответов. Они появятся здесь после проверки заданий 18, 19, 20, 22 и 25.</p>'}
            </div>
        `;
        
        document.getElementById('reset-stats').addEventListener('click', () => {
            if(confirm("Вы уверены, что хотите полностью сбросить всю статистику? Это действие необратимо.")) {
                userStats = normalizeStats(defaultStats);
                saveStats();
                renderStats();
            }
        });
    }

    // --- TASK 18 (Terms) ---
    function renderTask18() {
        const terms = Object.keys(DICTIONARY_18);
        let selectedTerm = terms[Math.floor(Math.random() * terms.length)];
        let termData = DICTIONARY_18[selectedTerm];
        
        const renderContent = () => `
            <h2 class="task-title">Задание 18</h2>
            <p class="task-subtitle">Признаки и связь понятий</p>
            
            ${createAntiPattern(termData.antiWrong, termData.antiRight)}
            
            <div class="card card-pink">
                <h3 class="section-title">Анализ понятия: ${selectedTerm}</h3>
                <p class="mb-16">Текст о: <strong>${termData.textReference}</strong></p>
                
                <div class="select-term mb-16">
                    <span class="field-label">Выбрать другой термин:</span>
                    <select class="input" id="term-selector">
                        ${terms.map(t => `<option value="${t}" ${t === selectedTerm ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                
                <div class="field mb-16">
                    <label class="field-label">1. Укажите не менее трёх основных признаков понятия «${selectedTerm}»:</label>
                    <div class="mt-8 mb-8" style="display:flex; flex-direction:column; gap:8px;">
                        <input type="text" class="input t18-feature" placeholder="Признак 1...">
                        <input type="text" class="input t18-feature" placeholder="Признак 2...">
                        <input type="text" class="input t18-feature" placeholder="Признак 3...">
                    </div>
                </div>
                
                <div class="field mb-16">
                    <label class="field-label">2. Объясните связь понятия «${selectedTerm}» ${termData.textReference}:</label>
                    <textarea class="textarea" id="t18-connection" placeholder="Напишите развёрнутое объяснение (минимум 1-2 предложения)..."></textarea>
                </div>
                
                <div id="t18-alert" class="hidden"></div>
                
                <button class="btn btn-dark mt-16" id="t18-check">Проверить задание</button>
                
                <div id="t18-expert-block" class="hidden mt-16">
                    <div class="expert-box">
                        <div class="expert-header">Эталон эксперта</div>
                        <div class="expert-body">
                            <strong>Признаки:</strong>
                            <ul style="margin-left:20px; margin-bottom:12px; margin-top:6px;">
                                ${termData.features.map(f => `<li>${f}</li>`).join('')}
                            </ul>
                            <strong>Связь:</strong>
                            <p style="margin-top:6px;">${termData.expertConnection}</p>
                        </div>
                    </div>
                    <p class="field-label mt-12">Самопроверка:</p>
                    ${createChecklist([
                        "Написано не менее 3 признаков (без сплошного текста)",
                        "Признаки точно описывают суть и не являются тавтологией",
                        "Связь раскрыта в виде законченного предложения",
                        "В связи прослеживается причинно-следственная логика"
                    ])}
                </div>
            </div>
        `;
        
        const bindEvents = () => {
            document.getElementById('term-selector').addEventListener('change', (e) => {
                selectedTerm = e.target.value;
                termData = DICTIONARY_18[selectedTerm];
                taskContainer.innerHTML = renderContent();
                bindEvents();
            });
            
            document.getElementById('t18-check').addEventListener('click', () => {
                const features = Array.from(document.querySelectorAll('.t18-feature')).map(input => input.value.trim()).filter(val => val.length > 0);
                const connection = document.getElementById('t18-connection').value.trim();
                const answerText = `Признаки:\n${features.map((feature, i) => `${i + 1}) ${feature}`).join('\n') || 'Не заполнено'}\n\nСвязь:\n${connection || 'Не заполнено'}`;
                const alertBox = document.getElementById('t18-alert');
                
                alertBox.className = 'alert mt-16';
                
                if (features.length < 3) {
                    alertBox.classList.add('alert-warn');
                    alertBox.innerHTML = '<span class="alert-icon">⚠️</span><span>Необходимо написать минимум 3 признака!</span>';
                    recordAnswer('18', selectedTerm, answerText, 'не засчитано');
                    userStats.mistakes++; saveStats();
                    return;
                }
                
                if (connection.split(' ').length < 5) {
                    alertBox.classList.add('alert-error');
                    alertBox.innerHTML = `<span class="alert-icon">❌</span><span>Объяснение связи слишком короткое. Раскройте мысль подробнее!</span>`;
                    recordAnswer('18', selectedTerm, answerText, 'не засчитано');
                    userStats.mistakes++; saveStats();
                    return;
                }
                
                let allText = (features.join(" ") + " " + connection).toLowerCase();
                for (let p of PARASITES_18) {
                    if (allText.includes(p)) {
                        alertBox.classList.add('alert-error');
                        alertBox.innerHTML = `<span class="alert-icon">⛔</span><span>Стоп! Найден паразит "${p}". Эксперт снимет балл!</span>`;
                        recordAnswer('18', selectedTerm, answerText, 'не засчитано');
                        userStats.mistakes++; saveStats();
                        return;
                    }
                }
                
                alertBox.classList.add('alert-tip');
                alertBox.innerHTML = '<span class="alert-icon">✅</span><span>Формат соблюден! Сверьте свой ответ с эталоном эксперта.</span>';
                document.getElementById('t18-expert-block').classList.remove('hidden');
                
                recordAnswer('18', selectedTerm, answerText, 'засчитано');
                userStats.perfect++;
                userStats.completed['18']++;
                saveStats();
                
                updateSkill('theorist', 15);
            });
        };
        
        taskContainer.innerHTML = renderContent();
        bindEvents();
    }
    
    // --- TASK 19 (Examples) ---
    function renderTask19() {
        const spheres = Object.keys(TASK_19_DATA.spheres);
        let activeSphere = spheres[Math.floor(Math.random() * spheres.length)];
        let examplesSubmitted = [];
        
        const renderContent = () => {
            const data = TASK_19_DATA.spheres[activeSphere];
            return `
                <h2 class="task-title">Задание 19</h2>
                <p class="task-subtitle">Конструктор примеров</p>
                
                <div class="select-term mb-16">
                    <span class="field-label">Выбрать тему:</span>
                    <select class="input" id="t19-selector">
                        ${spheres.map(s => `<option value="${s}" ${s === activeSphere ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                
                <div class="card card-yellow">
                    <h3 class="section-title">${data.prompt}</h3>
                    
                    ${examplesSubmitted.length > 0 ? `
                    <div class="mb-16">
                        <h4 style="margin-bottom:8px;">Ваши примеры (${examplesSubmitted.length}/3):</h4>
                        ${examplesSubmitted.map((ex, i) => `
                            <div class="alert alert-info mb-8" style="padding:10px;">
                                <strong>Пример ${i+1}:</strong> ${ex.subject} ${ex.action} ${ex.result}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${examplesSubmitted.length < 3 ? `
                    <div class="field">
                        <label class="field-label">Пример ${examplesSubmitted.length + 1}. Шаг 1: Кто? (Субъект)</label>
                        <div class="chip-row">
                            ${data.subjects.map(sub => `<button class="chip" onclick="document.getElementById('t19-subject').value='${sub}'">${sub}</button>`).join('')}
                        </div>
                        <input type="text" class="input" id="t19-subject" placeholder="Введи субъекта...">
                    </div>
                    
                    <div class="field">
                        <label class="field-label">Шаг 2: Что сделал? (Действие)</label>
                        <div class="alert alert-info mt-8 mb-8" style="padding:10px;">
                            <span class="alert-icon">💡</span><span>${data.actionHint}</span>
                        </div>
                        <textarea class="textarea" id="t19-action" placeholder="Опиши конкретное действие..."></textarea>
                    </div>
                    
                    <div class="field">
                        <label class="field-label">Шаг 3: Что получилось? (Результат)</label>
                        <div class="chip-row">
                            ${TASK_19_DATA.connectors.map(c => `<button class="chip" onclick="document.getElementById('t19-result').value+='${c} '">${c}</button>`).join('')}
                        </div>
                        <textarea class="textarea" id="t19-result" placeholder="К чему это привело?"></textarea>
                    </div>
                    
                    <button class="btn btn-dark mt-16" id="t19-check">Отправить пример ${examplesSubmitted.length + 1} из 3</button>
                    ` : `
                    <div class="alert alert-tip mt-16"><span class="alert-icon">✅</span><span>Все 3 примера составлены! Сверьте их с ключом.</span></div>
                    `}
                    
                    <div id="t19-expert-block" class="${examplesSubmitted.length === 3 ? '' : 'hidden'} mt-16">
                        <div class="expert-box">
                            <div class="expert-header">Пример эксперта</div>
                            <div class="expert-body">${data.expert}</div>
                        </div>
                        <p class="field-label mt-12">Самопроверка:</p>
                        ${createChecklist([
                            "Есть конкретный субъект (не абстрактный)",
                            "Действие развернутое и отражает теорию",
                            "Показан логичный результат"
                        ])}
                    </div>
                </div>
            `;
        };
        
        const bindEvents = () => {
            const selector = document.getElementById('t19-selector');
            if(selector) {
                selector.addEventListener('change', (e) => {
                    activeSphere = e.target.value;
                    examplesSubmitted = []; // Reset examples on sphere change
                    taskContainer.innerHTML = renderContent();
                    bindEvents();
                });
            }
            
            const checkBtn = document.getElementById('t19-check');
            if(checkBtn) {
                checkBtn.addEventListener('click', () => {
                    const s = document.getElementById('t19-subject').value;
                    const a = document.getElementById('t19-action').value;
                    const r = document.getElementById('t19-result').value;
                    
                    if(!s || !a || !r) {
                        alert("Заполни все три элемента примера!");
                        return;
                    }
                    
                    examplesSubmitted.push({ subject: s, action: a, result: r });
                    
                    if(examplesSubmitted.length === 3) {
                        const answerText = examplesSubmitted
                            .map((ex, i) => `${i + 1}) ${ex.subject} ${ex.action} ${ex.result}`)
                            .join('\n\n');
                        recordAnswer('19', activeSphere, answerText, 'засчитано по структуре');
                        userStats.perfect++;
                        userStats.completed['19']++;
                        saveStats();
                        updateSkill('lawyer', 15);
                    }
                    
                    taskContainer.innerHTML = renderContent();
                    bindEvents();
                });
            }
        };
        
        taskContainer.innerHTML = renderContent();
        bindEvents();
    }
    
    // --- TASK 20 (Arguments) ---
    function renderTask20() {
        let currentItem = Math.floor(Math.random() * TASK_20_DATA_LIST.length);
        let passedCurrent = false;
        
        const renderContent = () => {
            const TASK_20_DATA = TASK_20_DATA_LIST[currentItem];
            return `
            <h2 class="task-title">Задание 20</h2>
            <p class="task-subtitle">Конструктор аргументов</p>
            
            ${createAntiPattern(TASK_20_DATA.antiWrong, TASK_20_DATA.antiRight)}
            
            <div class="card card-purple">
                <div class="select-term mb-16">
                    <span class="field-label">Выбрать вариант:</span>
                    <select class="input" id="t20-selector">
                        ${TASK_20_DATA_LIST.map((item, i) => `<option value="${i}" ${i === currentItem ? 'selected' : ''}>[${item.topicBlock}] Вариант ${i + 1} (${item.prompt.substring(0, 30)}...)</option>`).join('')}
                    </select>
                </div>

                <h3 class="section-title mb-16">${TASK_20_DATA.prompt}</h3>
                
                <div class="color-legend">
                    <span><i class="dot dot-red"></i> Тезис</span>
                    <span><i class="dot dot-blue"></i> Механизм</span>
                    <span><i class="dot dot-green"></i> Микровывод</span>
                </div>
                
                <div class="field">
                    <label class="field-label">Напиши 3 теоретических суждения. Каждое — отдельным аргументом.</label>
                    <div class="chip-row">
                        ${TASK_20_DATA.connectors.map(c => `<button class="chip" onclick="const el=Array.from(document.querySelectorAll('.t20-arg')).find(t=>!t.value.trim())||document.getElementById('t20-arg-1'); el.value+=' ${c} '; el.focus();">${c}</button>`).join('')}
                    </div>
                    <textarea class="textarea t20-arg" id="t20-arg-1" placeholder="Аргумент 1: тезис -> механизм -> микровывод..." style="min-height: 105px;"></textarea>
                    <textarea class="textarea t20-arg" id="t20-arg-2" placeholder="Аргумент 2: другая теоретическая линия, без фактического примера..." style="min-height: 105px;"></textarea>
                    <textarea class="textarea t20-arg" id="t20-arg-3" placeholder="Аргумент 3: ещё одно самостоятельное суждение..." style="min-height: 105px;"></textarea>
                </div>
                
                <div id="t20-alert" class="hidden"></div>
                
                <button class="btn btn-dark mt-16" id="t20-check">Проверить по критериям ФИПИ</button>
                
                <div id="t20-expert" class="hidden mt-16">
                    <div class="expert-box">
                        <div class="expert-header">Аргументы эксперта</div>
                        <div class="expert-body">
                            ${TASK_20_DATA.expert.map(e => `<div class="expert-item">${e}</div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
            `;
        };
        
        const bindEvents = () => {
            const TASK_20_DATA = TASK_20_DATA_LIST[currentItem];
            document.getElementById('t20-selector').addEventListener('change', (e) => {
                currentItem = parseInt(e.target.value);
                passedCurrent = false;
                taskContainer.innerHTML = renderContent();
                bindEvents();
            });
            
            document.getElementById('t20-check').addEventListener('click', () => {
                const rawArgs = Array.from(document.querySelectorAll('.t20-arg')).map(input => input.value.trim());
                const alertBox = document.getElementById('t20-alert');
                alertBox.className = 'alert mt-16';
                
                const filledArgs = rawArgs.filter(Boolean);
                const factMarkers = (TASK_20_DATA.forbiddenWords || []).filter(word => word !== 'например');
                const statuses = rawArgs.map((arg, index) => {
                    const lower = arg.toLowerCase();
                    const forbidden = factMarkers.find(word => lower.includes(word));
                    if (!arg) {
                        return createFipiStatus(`Аргумент ${index + 1}`, 'rejected', 'Позиция отсутствует.');
                    }
                    if (forbidden) {
                        return createFipiStatus(`Аргумент ${index + 1}`, 'extra', `Найдена конкретная фактология: "${forbidden}". В задании 20 нужен теоретический вывод, а не пример.`);
                    }
                    if (wordCount(arg) < 18) {
                        return createFipiStatus(`Аргумент ${index + 1}`, 'rejected', 'Суждение слишком короткое: нет развернутого механизма.');
                    }
                    return createFipiStatus(`Аргумент ${index + 1}`, 'accepted', 'Есть самостоятельное теоретическое суждение.');
                });
                const hasWrongExtra = statuses.some(html => html.includes('есть лишняя/ошибочная позиция'));
                const allAccepted = filledArgs.length === 3 && !hasWrongExtra && rawArgs.every(arg => wordCount(arg) >= 18);
                const answerText = rawArgs.map((arg, index) => `${index + 1}) ${arg || 'Не заполнено'}`).join('\n\n');

                alertBox.innerHTML = statuses.join('');

                if(!allAccepted) {
                    alertBox.classList.add('alert-warn');
                    recordAnswer('20', TASK_20_DATA.prompt, answerText, hasWrongExtra ? 'есть лишняя/ошибочная позиция' : 'не засчитано');
                    userStats.mistakes++; saveStats();
                    return;
                }
                
                alertBox.classList.add('alert-tip');
                alertBox.innerHTML += `<div class="alert alert-tip mt-8"><span class="alert-icon">✅</span><span>Все три позиции проходят первичный формат: можно сверяться с эталоном.</span></div>`;
                document.getElementById('t20-expert').classList.remove('hidden');
                
                if(!passedCurrent) {
                    passedCurrent = true;
                    recordAnswer('20', TASK_20_DATA.prompt, answerText, 'засчитано');
                    userStats.perfect++;
                    userStats.completed['20']++;
                    saveStats();
                    updateSkill('logic', 20);
                }
            });
        };
        
        taskContainer.innerHTML = renderContent();
        bindEvents();
    }
    
    // --- TASK 22 (Cases) ---
    function renderTask22() {
        let currentItem = Math.floor(Math.random() * CASE_22_LIST.length);
        let currentQ = 0;
        let selectedSentence = null;
        let selectedOption = null;
        let caseAnswers = [];
        
        const renderContent = () => {
            const CASE_22 = CASE_22_LIST[currentItem];
            const q = CASE_22.questions[currentQ];
            const needsTextSelection = q.needsTextSelection !== undefined ? q.needsTextSelection : true;
            
            let caseHtml = CASE_22.text;
            if (needsTextSelection) {
                const sentenceRegex = /([^\.!\?]+[\.!\?]+)/g;
                caseHtml = caseHtml.text ? caseHtml.text : caseHtml.replace(sentenceRegex, match => {
                    const cleanText = match.trim().replace(/"/g, '&quot;');
                    return `<span class="highlight-word" data-text="${cleanText}">${match}</span>`;
                });
            }
            
            return `
            <h2 class="task-title">Задание 22</h2>
            <p class="task-subtitle">Анализ кейсов: Поиск маркеров</p>
            
            <div class="card card-blue">
                <div class="select-term mb-16">
                    <span class="field-label">Выбрать кейс:</span>
                    <select class="input" id="t22-selector">
                        ${CASE_22_LIST.map((item, i) => `<option value="${i}" ${i === currentItem ? 'selected' : ''}>[${item.topicBlock}] Кейс ${i + 1}</option>`).join('')}
                    </select>
                </div>
                
                <div class="case-text mb-16" id="t22-case">
                    ${caseHtml}
                </div>
                
                <div class="expert-box mt-16">
                    <div class="expert-header">Вопрос ${currentQ + 1} из ${CASE_22.questions.length}</div>
                    <div class="expert-body" style="background:var(--card);">
                        <p style="font-weight:700; margin-bottom: 8px;">${q.q}</p>
                        ${needsTextSelection ? `<p class="field-hint mb-12" id="t22-hint">🎯 Шаг 1: Кликни на предложение-подсказку в тексте сверху</p>` : `<p class="field-hint mb-12" id="t22-hint">💡 Найдите ответ самостоятельно на основе теории и текста</p>`}
                        <div id="t22-options" class="mb-16">
                            ${(q.options && q.options.length > 0) ? 
                                q.options.map(opt => `
                                    <button class="option-btn" data-opt="${opt}">${opt}</button>
                                `).join('') :
                                `<textarea class="textarea" id="t22-open-answer" placeholder="Напишите развернутый ответ (или назовите акт)..."></textarea>`
                            }
                        </div>
                        
                        <div id="t22-alert" class="hidden"></div>
                        
                        <button class="btn btn-dark" id="t22-submit" disabled>Ответить</button>
                        <button class="btn btn-pink hidden" id="t22-next">Следующий вопрос</button>
                    </div>
                </div>
            </div>
            `;
        };
        
        const bindEvents = () => {
            const CASE_22 = CASE_22_LIST[currentItem];
            document.getElementById('t22-selector').addEventListener('change', (e) => {
                currentItem = parseInt(e.target.value);
                currentQ = 0;
                selectedSentence = null;
                selectedOption = null;
                caseAnswers = [];
                taskContainer.innerHTML = renderContent();
                bindEvents();
            });
            
            const caseMarkers = document.querySelectorAll('.highlight-word');
            const options = document.querySelectorAll('.option-btn');
            const openAnswer = document.getElementById('t22-open-answer');
            const submitBtn = document.getElementById('t22-submit');
            const nextBtn = document.getElementById('t22-next');
            const alertBox = document.getElementById('t22-alert');
            
            const checkEnableSubmit = () => {
                const q = CASE_22.questions[currentQ];
                const needsTextSelection = q.needsTextSelection !== undefined ? q.needsTextSelection : true;
                const hasOptionOrText = (q.options && q.options.length > 0)
                    ? selectedOption !== null 
                    : (openAnswer && openAnswer.value.trim() !== '');
                    
                if((!needsTextSelection || selectedSentence !== null) && hasOptionOrText) {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }
            };
            
            caseMarkers.forEach(m => {
                m.addEventListener('click', (e) => {
                    caseMarkers.forEach(mm => mm.classList.remove('marked'));
                    e.target.classList.add('marked');
                    selectedSentence = e.target.dataset.text;
                    checkEnableSubmit();
                });
            });
            
            options.forEach(o => {
                o.addEventListener('click', (e) => {
                    options.forEach(oo => oo.classList.remove('option-selected'));
                    e.target.classList.add('option-selected');
                    selectedOption = e.target.dataset.opt;
                    checkEnableSubmit();
                });
            });
            
            if(openAnswer) {
                openAnswer.addEventListener('input', checkEnableSubmit);
            }
            
            if(submitBtn) {
                submitBtn.addEventListener('click', () => {
                    const q = CASE_22.questions[currentQ];
                    const hasOptions = q.options && q.options.length > 0;
                    const needsTextSelection = q.needsTextSelection !== undefined ? q.needsTextSelection : true;
                    const openAnswerText = openAnswer ? openAnswer.value.trim() : '';
                    const answerText = `Вопрос ${currentQ + 1}: ${q.q}\nМаркер: ${needsTextSelection ? (selectedSentence || 'Не выбран') : 'Не требуется'}\nОтвет: ${hasOptions ? (selectedOption || 'Не выбран') : (openAnswerText || 'Не заполнено')}`;
                    
                    let isMarkerCorrect = true;
                    if (needsTextSelection) {
                        isMarkerCorrect = false;
                        let validMarkers = q.correctMarkers;
                        if (!validMarkers) {
                            validMarkers = [];
                            Object.values(CASE_22.markers || {}).forEach(mTexts => {
                                if (!Array.isArray(mTexts)) mTexts = [mTexts];
                                validMarkers = validMarkers.concat(mTexts);
                            });
                        }
                        
                        for (let mText of validMarkers) {
                            if (selectedSentence && selectedSentence.toLowerCase().includes(mText.toLowerCase())) {
                                isMarkerCorrect = true;
                                break;
                            }
                        }
                    }
                    
                    let isOptionCorrect = true;
                    
                    if (hasOptions) {
                        isOptionCorrect = q.a.toLowerCase().includes(selectedOption.toLowerCase());
                    }
                    
                    alertBox.className = 'alert mt-16';
                    if(!isMarkerCorrect) {
                        alertBox.classList.add('alert-error');
                        alertBox.innerHTML = `<span class="alert-icon">❌</span><span>Ошибка! Предложение в тексте выбрано неверно.</span>`;
                        recordAnswer('22', `[${CASE_22.topicBlock}] Кейс ${currentItem + 1}`, answerText, 'не засчитано');
                        userStats.mistakes++; saveStats();
                    } else if (hasOptions && !isOptionCorrect) {
                        alertBox.classList.add('alert-error');
                        alertBox.innerHTML = `<span class="alert-icon">❌</span><span>Ошибка! Ответ неверный.</span>`;
                        recordAnswer('22', `[${CASE_22.topicBlock}] Кейс ${currentItem + 1}`, answerText, 'не засчитано');
                        userStats.mistakes++; saveStats();
                    } else {
                        caseAnswers.push(`${answerText}\nЭталон: ${q.a}`);
                        alertBox.classList.add('alert-tip');
                        if (hasOptions) {
                            alertBox.innerHTML = `<span class="alert-icon">✅</span><span>Верно! ${q.exp}</span>`;
                        } else {
                            alertBox.innerHTML = `<span class="alert-icon">✅</span><span>Маркер найден верно! Сверьте свой ответ с эталоном:<br><br><strong>Правильный ответ:</strong> ${q.a}<br><strong>Пояснение:</strong> ${q.exp}</span>`;
                        }
                        
                        if (!needsTextSelection && q.highlightOnSuccess && q.highlightOnSuccess.length > 0) {
                            let highlightedText = CASE_22.text;
                            q.highlightOnSuccess.forEach(phrase => {
                                const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(escaped, 'gi');
                                highlightedText = highlightedText.replace(regex, match => `<span class="highlight-word marked" style="cursor:default; font-weight:700;">${match}</span>`);
                            });
                            document.getElementById('t22-case').innerHTML = highlightedText;
                        }
                        
                        submitBtn.classList.add('hidden');
                        nextBtn.classList.remove('hidden');
                        updateSkill('lawyer', 15);
                    }
                });
            }
            
            if(nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentQ++;
                    if(currentQ < CASE_22.questions.length) {
                        selectedSentence = null;
                        selectedOption = null;
                        taskContainer.innerHTML = renderContent();
                        bindEvents();
                    } else {
                        recordAnswer('22', `[${CASE_22.topicBlock}] Кейс ${currentItem + 1}`, caseAnswers.join('\n\n'), 'кейс решен');
                        userStats.perfect++;
                        userStats.completed['22']++;
                        saveStats();
                        taskContainer.innerHTML = `<div class="card card-green"><h3 class="task-title" style="text-align:center">Кейс решен! 🎉</h3><button class="btn btn-dark btn-full mt-16" onclick="renderTask('22')">Решить другой кейс</button></div>`;
                    }
                });
            }
        };
        
        taskContainer.innerHTML = renderContent();
        bindEvents();
    }
    
    // --- TASK 25 (Complex) ---
    function renderTask25() {
        let currentItem = Math.floor(Math.random() * TASK_25_DATA_LIST.length);
        let passedCurrent = false;
        
        const renderContent = () => {
            const TASK_25_DATA = TASK_25_DATA_LIST[currentItem];
            return `
            <h2 class="task-title">Задание 25</h2>
            <p class="task-subtitle">Финальный босс</p>
            
            <div class="card card-orange">
                <div class="select-term mb-16">
                    <span class="field-label">Выбрать тему:</span>
                    <select class="input" id="t25-selector">
                        ${TASK_25_DATA_LIST.map((item, i) => `<option value="${i}" ${i === currentItem ? 'selected' : ''}>[${item.topicBlock}] ${item.topic}</option>`).join('')}
                    </select>
                </div>
                
                <h3 class="section-title">Тема: ${TASK_25_DATA.topic}</h3>
                <p class="mb-16" style="font-weight:600;">${TASK_25_DATA.prompt}</p>
                
                <div class="expert-box mb-16">
                    <div class="expert-header">Умный каркас обоснования (К1)</div>
                    <div class="expert-body" style="background:var(--card)">
                        <div class="field">
                            <label class="field-label">1. ${TASK_25_DATA.substeps[0]}</label>
                            <textarea class="textarea" id="t25-s1" placeholder="Начни с определения..."></textarea>
                        </div>
                        <div class="field">
                            <label class="field-label">2. ${TASK_25_DATA.substeps[1]}</label>
                            <textarea class="textarea" id="t25-s2" placeholder="Объясни механизм связи..."></textarea>
                        </div>
                        <div class="field">
                            <label class="field-label">3. ${TASK_25_DATA.substeps[2]}</label>
                            <textarea class="textarea" id="t25-s3" placeholder="Сделай микровывод..."></textarea>
                        </div>
                    </div>
                </div>

                <div class="expert-box mb-16">
                    <div class="expert-header">К2: ровно три позиции без лишнего</div>
                    <div class="expert-body" style="background:var(--card)">
                        <textarea class="textarea" id="t25-k2" placeholder="1) Первая позиция&#10;2) Вторая позиция&#10;3) Третья позиция"></textarea>
                        <p class="field-hint mt-8">Лишняя четвёртая позиция с ошибкой может испортить весь элемент ответа.</p>
                    </div>
                </div>

                <div class="expert-box mb-16">
                    <div class="expert-header">К3: три развёрнутых примера, привязанных к К2</div>
                    <div class="expert-body" style="background:var(--card)">
                        <textarea class="textarea" id="t25-k3" placeholder="1) Пример к первой позиции: субъект + действие + результат...&#10;2) Пример ко второй позиции...&#10;3) Пример к третьей позиции..."></textarea>
                        <p class="field-hint mt-8">Каждый пример должен быть самостоятельным: кто сделал, что сделал, к чему это привело.</p>
                    </div>
                </div>
                
                <button class="btn btn-dark btn-full mb-16" id="t25-check">Проверить К1/К2/К3</button>

                <div id="t25-checker" class="hidden mb-16"></div>
                
                <div id="t25-result" class="hidden">
                    <div class="alert alert-tip"><span class="alert-icon">🎯</span><span>Эталон ниже: сравните свой К1/К2/К3 с образцом и отметьте, где потерялась логика или конкретика.</span></div>
                    
                    <div class="expert-box mt-16 mb-16">
                        <div class="expert-header">Идеальное обоснование (К1)</div>
                        <div class="expert-body">${TASK_25_DATA.expertK1}</div>
                    </div>
                    
                    <h3 class="section-title mt-16">Чек-лист для К2 и К3 (Примеры)</h3>
                    ${createChecklist(TASK_25_DATA.factChecklist)}
                    
                    <div class="expert-box mt-16">
                        <div class="expert-header">Примеры эксперта</div>
                        <div class="expert-body">
                            <div class="expert-item"><strong>К2:</strong> ${TASK_25_DATA.expertK2}</div>
                            <div class="expert-item"><strong>К3:</strong> ${TASK_25_DATA.expertK3}</div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        };
        
        const bindEvents = () => {
            document.getElementById('t25-selector').addEventListener('change', (e) => {
                currentItem = parseInt(e.target.value);
                passedCurrent = false;
                taskContainer.innerHTML = renderContent();
                bindEvents();
            });
            
            document.getElementById('t25-check').addEventListener('click', () => {
                const s1 = document.getElementById('t25-s1').value;
                const s2 = document.getElementById('t25-s2').value;
                const s3 = document.getElementById('t25-s3').value;
                const k2 = document.getElementById('t25-k2').value;
                const k3 = document.getElementById('t25-k3').value;
                const checker = document.getElementById('t25-checker');
                const k1Text = `${s1} ${s2} ${s3}`;
                const answerText = `К1:\n1) ${s1 || 'Не заполнено'}\n2) ${s2 || 'Не заполнено'}\n3) ${s3 || 'Не заполнено'}\n\nК2:\n${k2 || 'Не заполнено'}\n\nК3:\n${k3 || 'Не заполнено'}`;
                const k2Positions = splitAnswerPositions(k2);
                const k3Examples = splitAnswerPositions(k3);
                const k1Ok = s1.trim() && s2.trim() && s3.trim() && wordCount(k1Text) >= 35;
                const k2Ok = k2Positions.length === 3 && !/и\s+т\.?\s*д\.?|прочее|другие|и\s+тому\s+подобное/i.test(k2);
                const k3Ok = k3Examples.length === 3 && k3Examples.every(ex => wordCount(ex) >= 18) && k3Examples.every(ex => /(в результате|благодаря|что позволило|поэтому|тем самым|из-за этого)/i.test(ex));
                const statuses = [
                    createFipiStatus('К1', k1Ok ? 'accepted' : 'rejected', k1Ok ? 'Есть три связанные части и достаточный объём обоснования.' : 'Нужны три заполненных подшага и несколько связанных распространённых предложений.'),
                    createFipiStatus('К2', k2Ok ? 'accepted' : (k2Positions.length > 3 ? 'extra' : 'rejected'), k2Ok ? 'Ровно три позиции, без открытого перечня.' : `Сейчас позиций: ${k2Positions.length}. Нужно ровно три, без "и т.д." и лишних спорных элементов.`),
                    createFipiStatus('К3', k3Ok ? 'accepted' : (k3Examples.length > 3 ? 'extra' : 'rejected'), k3Ok ? 'Три примера выглядят развёрнутыми и показывают результат.' : `Сейчас примеров: ${k3Examples.length}. Каждый пример должен быть развёрнутым и содержать итог/значение.`)
                ];

                checker.className = 'mb-16';
                checker.innerHTML = statuses.join('');
                document.getElementById('t25-result').classList.remove('hidden');

                if(!(k1Ok && k2Ok && k3Ok)) {
                    recordAnswer('25', TASK_25_DATA.topic, answerText, 'не засчитано');
                    userStats.mistakes++;
                    saveStats();
                    return;
                }

                if(!passedCurrent) {
                    passedCurrent = true;
                    recordAnswer('25', TASK_25_DATA.topic, answerText, 'засчитано');
                    userStats.perfect++;
                    userStats.completed['25']++;
                    saveStats();
                    updateSkill('theorist', 10);
                    updateSkill('logic', 10);
                    updateSkill('lawyer', 10);
                }
            });
        };
        
        taskContainer.innerHTML = renderContent();
        bindEvents();
    }

    // --- RF FACTS BANK MODAL ---
    const rfFactsBtn = document.getElementById('nav-rf-facts');
    const rfFactsModal = document.getElementById('rf-facts-modal');
    const closeRfFacts = document.getElementById('close-rf-facts');
    const factsFilters = document.getElementById('facts-filters');
    const factsList = document.getElementById('facts-list');
    let activeFactCategory = 'Все';

    if (rfFactsBtn && rfFactsModal) {
        rfFactsBtn.addEventListener('click', (e) => {
            // Task navigation logic handles active state removal
            rfFactsModal.classList.remove('hidden');
            renderRfFacts();
        });

        closeRfFacts.addEventListener('click', () => {
            rfFactsModal.classList.add('hidden');
        });

        // Close when clicking outside modal content
        rfFactsModal.addEventListener('click', (e) => {
            if (e.target === rfFactsModal) {
                rfFactsModal.classList.add('hidden');
            }
        });
    }

    function renderRfFacts() {
        if (typeof rfFactsBank === 'undefined') return;

        // Render Filters
        const categories = ['Все', ...rfFactsBank.map(c => c.category)];
        factsFilters.innerHTML = categories.map(cat => `
            <button class="fact-filter-btn ${activeFactCategory === cat ? 'active' : ''}" 
                onclick="window.changeFactCategory('${cat}')">${cat}</button>
        `).join('');

        // Render List
        let itemsHtml = '';
        rfFactsBank.forEach(catBlock => {
            if (activeFactCategory !== 'Все' && activeFactCategory !== catBlock.category) return;
            
            catBlock.items.forEach(item => {
                itemsHtml += `
                    <div class="fact-card">
                        <h3>${catBlock.icon} ${item.title} <span style="font-size:12px; color:#666; font-weight:normal;">(${catBlock.category})</span></h3>
                        <p class="fact-desc">${item.description}</p>
                        <div class="fact-example">
                            <strong>Пример для ЕГЭ:</strong><br/>
                            ${item.example}
                        </div>
                        ${item.crossTopics ? `<p class="fact-desc" style="margin-top:10px;"><strong>Закрывает темы:</strong> ${item.crossTopics.join(', ')}</p>` : ''}
                        ${item.tags ? `<p class="fact-desc" style="margin-top:6px;"><strong>Теги:</strong> ${item.tags.join(', ')}</p>` : ''}
                        ${item.risk === 'medium' ? `<div class="alert alert-warn mt-8" style="padding:8px;"><span class="alert-icon">⚠️</span><span>Перед публикацией лучше проверить актуальные условия/формулировку.</span></div>` : ''}
                    </div>
                `;
            });
        });
        factsList.innerHTML = itemsHtml;
    }

    window.changeFactCategory = (cat) => {
        activeFactCategory = cat;
        renderRfFacts();
    };

    // Music Player Logic
    const musicToggle = document.getElementById('music-toggle');
    const bgMusic = document.getElementById('bg-music');
    
    if (musicToggle && bgMusic) {
        musicToggle.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play().then(() => {
                    musicToggle.classList.add('playing');
                    musicToggle.querySelector('.music-icon').textContent = '🔊';
                }).catch(err => {
                    console.error("Error playing music:", err);
                });
            } else {
                bgMusic.pause();
                musicToggle.classList.remove('playing');
                musicToggle.querySelector('.music-icon').textContent = '🎵';
            }
        });
    }

    // Initialize first view
    renderTask('18');
});
