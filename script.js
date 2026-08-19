(() => {
    const root = document.documentElement;
    const splash = document.querySelector('[data-splash]');
    if (splash && root.classList.contains('splash-running')) {
        const progressLabel = splash.querySelector('[data-splash-progress]');
        const message = splash.querySelector('[data-splash-message]');
        const messages = [
            [0, 'Initializing experience'],
            [32, 'Composing interface'],
            [68, 'Connecting the details'],
            [92, 'Ready to explore']
        ];
        const duration = 2100;
        const startTime = performance.now();
        let messageIndex = 0;

        function updateSplash(now) {
            const elapsed = now - startTime;
            const rawProgress = Math.min(elapsed / duration, 1);
            const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
            const value = Math.min(100, Math.round(easedProgress * 100));
            if (progressLabel) progressLabel.textContent = String(value).padStart(2, '0');
            while (messageIndex < messages.length - 1 && value >= messages[messageIndex + 1][0]) {
                messageIndex += 1;
                if (message) {
                    message.classList.add('changing');
                    window.setTimeout(() => {
                        message.textContent = messages[messageIndex][1];
                        message.classList.remove('changing');
                    }, 120);
                }
            }
            if (rawProgress < 1) requestAnimationFrame(updateSplash);
            else {
                window.setTimeout(() => {
                    splash.classList.add('is-leaving');
                    root.classList.remove('splash-running');
                    root.classList.add('splash-complete');
                    window.setTimeout(() => splash.remove(), 1100);
                }, 240);
            }
        }
        requestAnimationFrame(updateSplash);
        window.setTimeout(() => {
            if (document.body.contains(splash) && !splash.classList.contains('is-leaving')) {
                splash.classList.add('is-leaving');
                root.classList.remove('splash-running');
                window.setTimeout(() => splash.remove(), 1100);
            }
        }, 4000);
    } else if (splash) {
        splash.remove();
        root.classList.add('splash-complete');
    }

    const themePickers = document.querySelectorAll('[data-theme-picker]');
    const themeButtons = document.querySelectorAll('[data-theme-toggle]');
    const themeChoices = document.querySelectorAll('[data-theme-choice]');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)');

    function resolveTheme(preference) {
        return preference === 'system' ? (systemTheme.matches ? 'light' : 'dark') : preference;
    }

    function setThemePreference(preference, save = true) {
        const validPreference = ['system', 'light', 'dark'].includes(preference) ? preference : 'system';
        const resolvedTheme = resolveTheme(validPreference);
        root.dataset.themePreference = validPreference;
        root.dataset.theme = resolvedTheme;
        if (save) localStorage.setItem('ryan-theme', validPreference);
        themeButtons.forEach((button) => {
            const label = validPreference.charAt(0).toUpperCase() + validPreference.slice(1);
            button.setAttribute('aria-label', `Theme: ${label}. Choose color theme`);
            button.setAttribute('title', `Theme: ${label}`);
        });
        themeChoices.forEach((choice) => {
            const selected = choice.dataset.themeChoice === validPreference;
            choice.setAttribute('aria-checked', String(selected));
            choice.classList.toggle('is-selected', selected);
        });
        if (themeMeta) themeMeta.content = resolvedTheme === 'dark' ? '#0b0d0f' : '#f4f3ed';
    }

    function closeThemeMenus(returnFocus = false) {
        themePickers.forEach((picker) => {
            const toggle = picker.querySelector('[data-theme-toggle]');
            const menu = picker.querySelector('[data-theme-menu]');
            if (!menu || menu.hidden) return;
            menu.hidden = true;
            toggle?.setAttribute('aria-expanded', 'false');
            if (returnFocus) toggle?.focus();
        });
    }

    setThemePreference(root.dataset.themePreference || 'system', false);
    themePickers.forEach((picker) => {
        const toggle = picker.querySelector('[data-theme-toggle]');
        const menu = picker.querySelector('[data-theme-menu]');
        if (!toggle || !menu) return;
        toggle.addEventListener('click', () => {
            const willOpen = menu.hidden;
            closeThemeMenus();
            menu.hidden = !willOpen;
            toggle.setAttribute('aria-expanded', String(willOpen));
            if (willOpen) menu.querySelector('.is-selected')?.focus();
        });
    });
    themeChoices.forEach((choice) => choice.addEventListener('click', () => {
        setThemePreference(choice.dataset.themeChoice);
        closeThemeMenus(true);
    }));
    document.addEventListener('click', (event) => {
        if (![...themePickers].some((picker) => picker.contains(event.target))) closeThemeMenus();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeThemeMenus(true);
    });

    const codeWord = document.querySelector('[data-code-word]');
    if (codeWord) {
        const originalWord = codeWord.textContent;
        const codeForms = ['software();', '<software/>', '{software};', 'software.'];
        const glyphs = '01{}[]<>/\\;:=*';
        const wordMotionDisabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let wordFrame = 0;
        let formIndex = 0;
        let formStartedAt = 0;
        let active = false;

        function animateCodeWord(time) {
            if (!active) return;
            if (!formStartedAt) formStartedAt = time;

            const target = codeForms[formIndex];
            const elapsed = time - formStartedAt;
            const revealed = Math.floor(elapsed / 55);
            let output = '';

            for (let index = 0; index < target.length; index += 1) {
                if (index < revealed) output += target[index];
                else output += glyphs[Math.floor(Math.random() * glyphs.length)];
            }

            codeWord.textContent = output;
            if (revealed > target.length + 8) {
                formIndex = (formIndex + 1) % codeForms.length;
                formStartedAt = time;
            }
            wordFrame = requestAnimationFrame(animateCodeWord);
        }

        function startCodeWord() {
            if (active) return;
            active = true;
            codeWord.classList.add('is-coding');
            if (wordMotionDisabled) {
                codeWord.textContent = 'software()';
                return;
            }
            formIndex = 0;
            formStartedAt = 0;
            wordFrame = requestAnimationFrame(animateCodeWord);
        }

        function resetCodeWord() {
            active = false;
            cancelAnimationFrame(wordFrame);
            codeWord.textContent = originalWord;
            codeWord.classList.remove('is-coding');
        }

        codeWord.addEventListener('pointerenter', startCodeWord);
        codeWord.addEventListener('pointerleave', resetCodeWord);
        codeWord.addEventListener('focus', startCodeWord);
        codeWord.addEventListener('blur', resetCodeWord);
    }

    systemTheme.addEventListener('change', () => {
        if (root.dataset.themePreference === 'system') setThemePreference('system', false);
    });

    const header = document.querySelector('[data-header]');
    const menuButton = document.querySelector('[data-menu-toggle]');
    const mobileNav = document.querySelector('[data-mobile-nav]');

    function closeMenu() {
        if (!menuButton || !mobileNav) return;
        mobileNav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open navigation');
    }

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', () => {
            const willOpen = !mobileNav.classList.contains('open');
            mobileNav.classList.toggle('open', willOpen);
            menuButton.setAttribute('aria-expanded', String(willOpen));
            menuButton.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
        });
        mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
        document.addEventListener('click', (event) => {
            if (!header.contains(event.target)) closeMenu();
        });
    }

    const updateHeader = () => header && header.classList.toggle('is-scrolled', window.scrollY > 24);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const projectIndexLinks = [...document.querySelectorAll('.project-index a[href^="#"]')];
    const projectSections = projectIndexLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    if (projectSections.length && 'IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!visible) return;
            projectIndexLinks.forEach((link) => {
                const active = link.getAttribute('href') === `#${visible.target.id}`;
                link.classList.toggle('is-active', active);
                if (active) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            });
        }, { rootMargin: '-22% 0px -62% 0px', threshold: [0, .1, .25] });
        projectSections.forEach((section) => sectionObserver.observe(section));
    }

    document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });

    const reveals = document.querySelectorAll('.reveal');
    const revealMotionDisabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const decodedElements = new WeakSet();

    function decodeRevealText(element) {
        if (decodedElements.has(element) || element.closest('.hero, .page-hero') || element.matches('.code-showcase')) return;
        decodedElements.add(element);

        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (!parent || parent.closest('svg, script, style, [aria-hidden="true"], .project-visual, .archive-art')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const nodes = [];
        let totalCharacters = 0;
        let currentNode = walker.nextNode();

        while (currentNode) {
            const text = currentNode.textContent;
            nodes.push({ node: currentNode, text, offset: totalCharacters });
            totalCharacters += text.length;
            currentNode = walker.nextNode();
        }
        if (!nodes.length) return;

        const glyphs = '01{}[]<>/#$*+=_';
        const duration = Math.min(1650, Math.max(1000, totalCharacters * 13));
        const startedAt = performance.now();
        element.classList.add('is-decoding');

        function renderDecodedFrame(now) {
            const progress = Math.min((now - startedAt) / duration, 1);
            const decodedThrough = Math.floor(totalCharacters * Math.pow(progress, 1.05));

            nodes.forEach((entry) => {
                let value = '';
                for (let index = 0; index < entry.text.length; index += 1) {
                    const character = entry.text[index];
                    const characterPosition = entry.offset + index;
                    if (/\s|[^\p{L}\p{N}]/u.test(character) || characterPosition < decodedThrough) {
                        value += character;
                    } else {
                        value += glyphs[Math.floor(Math.random() * glyphs.length)];
                    }
                }
                entry.node.textContent = value;
            });

            if (progress < 1) {
                requestAnimationFrame(renderDecodedFrame);
                return;
            }
            nodes.forEach((entry) => { entry.node.textContent = entry.text; });
            element.classList.remove('is-decoding');
        }

        requestAnimationFrame(renderDecodedFrame);
    }

    if ('IntersectionObserver' in window && !revealMotionDisabled) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    decodeRevealText(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
        reveals.forEach((element) => observer.observe(element));
    } else {
        reveals.forEach((element) => element.classList.add('visible'));
    }

    const showcase = document.querySelector('.code-showcase');
    const editor = document.querySelector('[data-tilt-editor]');
    const particleCanvas = document.querySelector('[data-code-particles]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (showcase && editor && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
        showcase.addEventListener('pointermove', (event) => {
            const bounds = showcase.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;
            const rotateY = (x - 0.5) * 12;
            const rotateX = (0.5 - y) * 10;
            showcase.style.setProperty('--pointer-x', `${x * 100}%`);
            showcase.style.setProperty('--pointer-y', `${y * 100}%`);
            editor.classList.add('is-tilting');
            editor.style.transform = `translate(-50%, -50%) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
        });
        showcase.addEventListener('pointerleave', () => {
            editor.style.transform = '';
            editor.classList.remove('is-tilting');
            showcase.style.setProperty('--pointer-x', '70%');
            showcase.style.setProperty('--pointer-y', '20%');
        });
    }

    if (particleCanvas && showcase && !reducedMotion) {
        const context = particleCanvas.getContext('2d');
        let particles = [];
        let frameId;
        let width = 0;
        let height = 0;
        let lastTime = 0;

        function resizeParticles() {
            const bounds = showcase.getBoundingClientRect();
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = bounds.width;
            height = bounds.height;
            particleCanvas.width = Math.round(width * ratio);
            particleCanvas.height = Math.round(height * ratio);
            particleCanvas.style.width = `${width}px`;
            particleCanvas.style.height = `${height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            const count = Math.max(18, Math.min(34, Math.round(width / 16)));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                size: Math.random() * 1.4 + 0.5
            }));
        }

        function drawParticles(time) {
            if (time - lastTime < 32) {
                frameId = requestAnimationFrame(drawParticles);
                return;
            }
            lastTime = time;
            const isLight = root.dataset.theme === 'light';
            context.clearRect(0, 0, width, height);
            particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                if (particle.x < 0 || particle.x > width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > height) particle.vy *= -1;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                context.fillStyle = isLight ? 'rgba(85,107,0,.35)' : 'rgba(217,255,91,.48)';
                context.fill();
                for (let next = index + 1; next < particles.length; next += 1) {
                    const other = particles[next];
                    const dx = particle.x - other.x;
                    const dy = particle.y - other.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < 82) {
                        context.beginPath();
                        context.moveTo(particle.x, particle.y);
                        context.lineTo(other.x, other.y);
                        context.strokeStyle = isLight ? `rgba(85,107,0,${(1 - distance / 82) * 0.11})` : `rgba(217,255,91,${(1 - distance / 82) * 0.13})`;
                        context.lineWidth = 0.6;
                        context.stroke();
                    }
                }
            });
            frameId = requestAnimationFrame(drawParticles);
        }

        resizeParticles();
        const resizeObserver = new ResizeObserver(resizeParticles);
        resizeObserver.observe(showcase);
        frameId = requestAnimationFrame(drawParticles);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cancelAnimationFrame(frameId);
            else frameId = requestAnimationFrame(drawParticles);
        });
    }

    const buildTime = document.querySelector('[data-build-time]');
    const performanceScore = document.querySelector('[data-performance-score]');
    if (!reducedMotion) {
        window.setInterval(() => {
            if (buildTime) buildTime.textContent = `${(1.2 + Math.random() * 0.8).toFixed(1)}s`;
            if (performanceScore) {
                performanceScore.textContent = '98';
                window.setTimeout(() => { performanceScore.textContent = '100'; }, 450);
            }
        }, 4000);
    }

    const backgroundCode = document.querySelector('[data-background-code]');
    const supportsCodeReveal = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (backgroundCode && supportsCodeReveal && !reducedMotion) {
        const context = backgroundCode.getContext('2d');
        const samples = [
            'const unique = [...new Set(items)];',
            'return input.filter(Boolean);',
            'const ready = state === "complete";',
            'items.map(({ id }) => id);',
            'queueMicrotask(flush);',
            'const next = Math.max(0, value);',
            'return cache.get(key) ?? fallback;',
            'const copy = structuredClone(data);',
            'requestAnimationFrame(render);',
            'const found = records.find(match);',
            'return values.reduce(add, 0);',
            'controller.abort(reason);'
        ];
        const pointer = { x: -300, y: -300, targetX: -300, targetY: -300, opacity: 0 };
        let lines = [];
        let canvasWidth = 0;
        let canvasHeight = 0;
        let frameId = 0;
        let lastPaint = 0;

        function layoutCodeSamples() {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            backgroundCode.width = Math.round(canvasWidth * ratio);
            backgroundCode.height = Math.round(canvasHeight * ratio);
            backgroundCode.style.width = `${canvasWidth}px`;
            backgroundCode.style.height = `${canvasHeight}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            lines = [];
            for (let y = 34; y < canvasHeight; y += 46) {
                const offset = Math.random() * 90 - 45;
                for (let x = -40 + offset; x < canvasWidth; x += 260 + Math.random() * 90) {
                    lines.push({
                        text: samples[Math.floor(Math.random() * samples.length)],
                        x,
                        y: y + Math.random() * 10 - 5
                    });
                }
            }
        }

        function paintCodeReveal(time) {
            if (time - lastPaint < 32) {
                frameId = requestAnimationFrame(paintCodeReveal);
                return;
            }
            lastPaint = time;
            pointer.x += (pointer.targetX - pointer.x) * 0.18;
            pointer.y += (pointer.targetY - pointer.y) * 0.18;
            pointer.opacity += ((pointer.targetX < 0 ? 0 : 1) - pointer.opacity) * 0.12;
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            context.font = '10px "DM Mono", monospace';
            context.textBaseline = 'middle';

            const radius = 128;
            const lightTheme = root.dataset.theme === 'light';
            lines.forEach((line) => {
                const distance = Math.hypot(line.x - pointer.x, line.y - pointer.y);
                if (distance >= radius) return;
                const strength = (1 - distance / radius) * pointer.opacity;
                context.fillStyle = lightTheme
                    ? `rgba(85, 107, 0, ${strength * 0.22})`
                    : `rgba(217, 255, 91, ${strength * 0.2})`;
                context.fillText(line.text, line.x, line.y);
            });

            frameId = requestAnimationFrame(paintCodeReveal);
        }

        document.addEventListener('pointermove', (event) => {
            pointer.targetX = event.clientX;
            pointer.targetY = event.clientY;
        }, { passive: true });
        document.documentElement.addEventListener('mouseleave', () => {
            pointer.targetX = -300;
            pointer.targetY = -300;
        });
        window.addEventListener('resize', layoutCodeSamples, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cancelAnimationFrame(frameId);
            else frameId = requestAnimationFrame(paintCodeReveal);
        });

        layoutCodeSamples();
        frameId = requestAnimationFrame(paintCodeReveal);
    }

    // ============================================================
    // SHEKIE AI ASSISTANT
    // ============================================================

    const SHEKIE_API_URL =
        "https://stephenportfolio-api.onrender.com";

    const toggle =
        document.getElementById("chatbot-toggle");

    const chatbot =
        document.getElementById("chatbot-container");

    const closeBtn =
        document.getElementById("chatbot-close");

    const sendBtn =
        document.getElementById("send-btn");

    const input =
        document.getElementById("chat-input");

    const messages =
        document.getElementById("chatbot-messages");

    const attachBtn =
        document.getElementById("attach-btn");

    const jobFileInput =
        document.getElementById("job-file-input");


    // ============================================================
    // SESSION STATE
    // ============================================================

    // Conversation exists only while this page is open.
    //
    // Close chatbot  -> memory stays
    // Reopen chatbot -> memory stays
    // Refresh page   -> memory resets

    let shekieConversationId = null;

    let selectedJobFile = null;


    // ============================================================
    // OPEN CHAT
    // ============================================================

    if (toggle && chatbot) {

        toggle.addEventListener("click", () => {

            chatbot.style.display = "flex";

            setTimeout(() => {
                input?.focus();
            }, 100);
        });
    }


    // ============================================================
    // CLOSE CHAT
    // ============================================================

    if (closeBtn && chatbot) {

        closeBtn.addEventListener("click", () => {

            chatbot.style.display = "none";
        });
    }


    // ============================================================
    // ADD MESSAGE
    // ============================================================

    function addChatMessage(text, type) {

        if (!messages) return null;

        const message =
            document.createElement("div");

        message.className =
            type === "user"
                ? "user-message"
                : "bot-message";

        message.textContent = text;

        messages.appendChild(message);

        messages.scrollTop =
            messages.scrollHeight;

        return message;
    }


    // ============================================================
    // FILE ATTACHMENT
    // ============================================================

    if (attachBtn && jobFileInput) {

        attachBtn.addEventListener("click", () => {

            jobFileInput.click();
        });


        jobFileInput.addEventListener("change", () => {

            const file =
                jobFileInput.files?.[0];

            if (!file) {

                selectedJobFile = null;

                attachBtn.classList.remove(
                    "has-file"
                );

                return;
            }


            // Validate file size
            // Backend allows maximum 20 MB.

            const maxSize =
                20 * 1024 * 1024;

            if (file.size > maxSize) {

                alert(
                    "The file is too large. Please select a file smaller than 20 MB."
                );

                jobFileInput.value = "";

                selectedJobFile = null;

                attachBtn.classList.remove(
                    "has-file"
                );

                return;
            }


            // Validate file type

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png"
            ];

            if (!allowedTypes.includes(file.type)) {

                alert(
                    "Please select a PDF, JPG, JPEG, or PNG file."
                );

                jobFileInput.value = "";

                selectedJobFile = null;

                attachBtn.classList.remove(
                    "has-file"
                );

                return;
            }


            selectedJobFile = file;

            attachBtn.classList.add(
                "has-file"
            );


            console.log(
                "Job file selected:",
                file.name,
                file.type,
                file.size
            );
        });
    }


    // ============================================================
    // SEND MESSAGE
    // ============================================================

    async function sendShekieMessage() {

        const text =
            input?.value.trim();


        // Nothing to send
        if (
            !text &&
            !selectedJobFile
        ) {
            return;
        }


        sendBtn.disabled = true;

        input.disabled = true;


        // ========================================================
        // JOB FILE ANALYSIS
        // ========================================================

        if (selectedJobFile) {

            const file =
                selectedJobFile;


            // Show optional user text
            if (text) {

                addChatMessage(
                    text,
                    "user"
                );
            }


            // Show attachment
            addChatMessage(
                `📎 ${file.name}`,
                "user"
            );


            input.value = "";


            const analyzingMessage =
                addChatMessage(
                    "Shekie is analyzing the job posting...",
                    "bot"
                );


            try {

                // =================================================
                // STEP 1
                // UPLOAD JOB
                // =================================================

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file
                );


                const extractionResponse =
                    await fetch(
                        `${SHEKIE_API_URL}/api/JobExtraction/file`,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                if (!extractionResponse.ok) {

                    let errorMessage =
                        `Job extraction failed (${extractionResponse.status})`;

                    try {

                        const errorData =
                            await extractionResponse.json();

                        if (errorData?.message) {

                            errorMessage =
                                errorData.message;
                        }

                    } catch {
                        // Ignore invalid JSON
                    }

                    throw new Error(
                        errorMessage
                    );
                }


                const extractionData =
                    await extractionResponse.json();


                console.log(
                    "Job extraction response:",
                    extractionData
                );


                if (
                    !extractionData.success ||
                    !extractionData.jobId
                ) {

                    throw new Error(
                        extractionData.message ||
                        "Unable to extract the job posting."
                    );
                }


                const jobId =
                    extractionData.jobId;


                // =================================================
                // STEP 2
                // RUN RYAN VS JOB ASSESSMENT
                // =================================================

                analyzingMessage.textContent =
                    "Job requirements extracted. Shekie is analyzing Ryan's match...";


                const assessmentResponse =
                    await fetch(
                        `${SHEKIE_API_URL}/api/Shekie/analyze`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                jobId: jobId
                            })
                        }
                    );


                if (!assessmentResponse.ok) {

                    let errorMessage =
                        `Assessment failed (${assessmentResponse.status})`;

                    try {

                        const errorData =
                            await assessmentResponse.json();

                        if (errorData?.message) {

                            errorMessage =
                                errorData.message;
                        }

                    } catch {
                        // Ignore invalid JSON
                    }

                    throw new Error(
                        errorMessage
                    );
                }


                const assessmentData =
                    await assessmentResponse.json();


                console.log(
                    "Shekie assessment:",
                    assessmentData
                );


                if (
                    !assessmentData.success ||
                    !assessmentData.assessment
                ) {

                    throw new Error(
                        assessmentData.message ||
                        "Unable to complete the assessment."
                    );
                }


                // =================================================
                // STEP 3
                // DISPLAY RESULT
                // =================================================

                analyzingMessage.remove();


                const assessment =
                    assessmentData.assessment;


                let resultText =
                    "Job Assessment\n\n";


                if (assessmentData.jobTitle) {

                    resultText +=
                        `Position: ${assessmentData.jobTitle}\n`;
                }


                if (assessmentData.company) {

                    resultText +=
                        `Company: ${assessmentData.company}\n`;
                }


                resultText += "\n";


                // For now, safely display the assessment.
                // We can make this beautiful once we confirm
                // ShekieAssessmentResult.cs.

                if (typeof assessment === "string") {

                    resultText += assessment;

                } else {

                    const score =
                        assessment.overallScore ??
                        assessment.score ??
                        null;

                    const recommendation =
                        assessment.recommendation ??
                        "Assessment completed";

                    const summary =
                        assessment.summary ??
                        "";

                    if (score !== null) {
                        resultText +=
                            `Overall Match: ${score}%\n\n`;
                    }

                    resultText +=
                        `Recommendation: ${recommendation}\n\n`;

                    if (summary) {
                        resultText +=
                            `${summary}\n\n`;
                    }

                    // Show additional assessment information
                    // without exposing raw JSON.

                    if (assessment.strengths?.length) {

                        resultText +=
                            "Strengths\n";

                        resultText +=
                            assessment.strengths
                                .map(item => `✓ ${item}`)
                                .join("\n");

                        resultText += "\n\n";
                    }

                    if (assessment.gaps?.length) {

                        resultText +=
                            "Areas to Consider\n";

                        resultText +=
                            assessment.gaps
                                .map(item => `• ${item}`)
                                .join("\n");

                        resultText += "\n\n";
                    }

                    if (assessment.missingSkills?.length) {

                        resultText +=
                            "Missing Skills\n";

                        resultText +=
                            assessment.missingSkills
                                .map(item => `• ${item}`)
                                .join("\n");

                        resultText += "\n\n";
                    }
                }


                addChatMessage(
                    resultText,
                    "bot"
                );


                // =================================================
                // CLEAR FILE
                // =================================================

                selectedJobFile = null;

                jobFileInput.value = "";

                attachBtn.classList.remove(
                    "has-file"
                );

            }
            catch (error) {

                console.error(
                    "Job analysis error:",
                    error
                );


                analyzingMessage?.remove();


                addChatMessage(
                    `Sorry, I couldn't complete the job analysis.\n\n${error.message}`,
                    "bot"
                );


                selectedJobFile = null;

                jobFileInput.value = "";

                attachBtn.classList.remove(
                    "has-file"
                );
            }


            sendBtn.disabled = false;

            input.disabled = false;

            input.focus();

            return;
        }


        // ========================================================
        // NORMAL SHEKIE CHAT
        // ========================================================

        addChatMessage(
            text,
            "user"
        );


        input.value = "";


        const typingMessage =
            addChatMessage(
                "Shekie is thinking...",
                "bot"
            );


        try {

            const requestBody = {
                message: text
            };


            // Send conversation ID only after
            // Shekie has created one.

            if (shekieConversationId) {

                requestBody.conversationId =
                    shekieConversationId;
            }


            const response =
                await fetch(
                    `${SHEKIE_API_URL}/api/ShekieChat/message`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                requestBody
                            )
                    }
                );


            if (!response.ok) {

                let errorMessage =
                    `Server error (${response.status})`;


                try {

                    const errorData =
                        await response.json();

                    if (errorData?.message) {

                        errorMessage =
                            errorData.message;
                    }

                } catch {
                    // Ignore invalid JSON
                }


                throw new Error(
                    errorMessage
                );
            }


            const data =
                await response.json();


            console.log(
                "Shekie response:",
                data
            );


            typingMessage?.remove();


            const result =
                data?.response;


            if (!result) {

                throw new Error(
                    "Invalid response from Shekie."
                );
            }


            // ====================================================
            // SAVE CONVERSATION ID
            // ====================================================

            if (result.conversationId) {

                shekieConversationId =
                    result.conversationId;
            }


            // ====================================================
            // SHOW RESPONSE
            // ====================================================

            addChatMessage(
                result.message ||
                "Sorry, I couldn't generate a response.",
                "bot"
            );

        }
        catch (error) {

            console.error(
                "Shekie API error:",
                error
            );


            typingMessage?.remove();


            addChatMessage(
                "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
                "bot"
            );

        }
        finally {

            sendBtn.disabled = false;

            input.disabled = false;

            input.focus();
        }
    }


    // ============================================================
    // SEND BUTTON
    // ============================================================

    if (
        sendBtn &&
        input &&
        messages
    ) {

        sendBtn.addEventListener(
            "click",
            sendShekieMessage
        );


        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendShekieMessage();
                }
            }
        );
    }

    // ===== RESUME → CONTACT =====

    const resumeOpeners =
        document.querySelectorAll('[data-resume-open]');

    const contactSection =
        document.getElementById('contact');

    resumeOpeners.forEach((opener) => {

        opener.addEventListener('click', () => {

            if (!contactSection) return;

            contactSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        });

    });
    // ===== CONTACT FORM / CV REQUEST =====

    const RESUME_API_URL =
        "https://stephenportfolio-api.onrender.com";

    document.querySelectorAll('[data-contact-form]').forEach((form) => {

        form.addEventListener('submit', async (event) => {

            event.preventDefault();

            if (!form.reportValidity()) return;

            const button =
                form.querySelector('button[type="submit"]');

            const formNote =
                form.querySelector('.form-note');

            const data =
                new FormData(form);

            const name =
                String(data.get('name') || '').trim();

            const email =
                String(data.get('email') || '').trim();

            const message =
                String(data.get('message') || '').trim();


            // ----------------------------------------------------
            // Loading state
            // ----------------------------------------------------

            if (button) {
                button.disabled = true;
                button.dataset.originalText =
                    button.textContent.trim();

                button.firstChild.textContent =
                    "Sending request...";
            }

            if (formNote) {
                formNote.textContent =
                    "Submitting your CV request...";
            }


            try {

                // ------------------------------------------------
                // Send request to backend
                // ------------------------------------------------

                const response =
                    await fetch(
                        `${RESUME_API_URL}/api/Resume/request`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                message: message
                            })
                        }
                    );


                // ------------------------------------------------
                // Read response
                // ------------------------------------------------

                const result =
                    await response.json();


                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Unable to process your CV request."
                    );
                }


                console.log(
                    "CV request successful:",
                    result
                );


                // ------------------------------------------------
                // Success
                // ------------------------------------------------

                if (formNote) {
                    formNote.textContent =
                        "Request submitted successfully. Redirecting you to the CV...";
                }


                /*
                 * The backend should return the Google Drive
                 * resume URL.
                 *
                 * Supported property names:
                 *   resumeUrl
                 *   url
                 */

                const resumeUrl =
                    result.resumeUrl ||
                    result.url;


                if (!resumeUrl) {

                    throw new Error(
                        "CV request was successful, but no CV URL was returned."
                    );
                }


                // Give the visitor a moment to see
                // the success message.

                setTimeout(() => {

                    window.location.href =
                        resumeUrl;

                }, 1000);


            }
            catch (error) {

                console.error(
                    "CV request error:",
                    error
                );


                if (formNote) {

                    formNote.textContent =
                        error.message ||
                        "Unable to submit your request. Please try again.";
                }


                if (button) {

                    button.disabled = false;

                    button.firstChild.textContent =
                        "Request the CV";
                }
            }

        });

    });

    // ============================================================
    // CAROUSEL SYSTEM - ALL PROJECTS
    // ============================================================

    const carousels = {
        'social-media': {
            items: [
                { type: 'image', src: 'Assets/Ai_Social_media/AI_Social_Media_Automation.png' },
                { type: 'image', src: 'Assets/Ai_Social_media/AI_Social_Media_Automation_Post_Generation.png' },
                { type: 'image', src: 'Assets/Ai_Social_media/AI_Social_Media_Automation_Post_Edit.png' },
                { type: 'image', src: 'Assets/Ai_Social_media/AI_Social_Media_Automation_Post_management.png' }
            ],
            currentIndex: 0
        },
        'recruitment': {
            items: [
                { type: 'image', src: 'Assets/Ai_Recruitment/Ai_Recruitment_Login.PNG' },
                { type: 'image', src: 'Assets/Ai_Recruitment/Ai_Recruitment_DASH.PNG' },
                { type: 'image', src: 'Assets/Ai_Recruitment/Ai_Recruitment_Sample.PNG' }
            ],
            currentIndex: 0
        },
        'scancode': {
            items: [
                { type: 'image', src: 'Assets/Scancode/Scancode_SI.jpg' },
                { type: 'image', src: 'Assets/Scancode/Scancode_SI2.jpg' },
                { type: 'image', src: 'Assets/Scancode/DR.jpg' },
                { type: 'image', src: 'Assets/Scancode/DR1.jpg' },
                { type: 'image', src: 'Assets/Scancode/sample1.jpg' },
                { type: 'image', src: 'Assets/Scancode/sample2.jpg' }
            ],
            currentIndex: 0
        },
        'labeling': {
            items: [
                { type: 'image', src: 'Assets/Label/Manufacturing_Label.jpg' },
                { type: 'image', src: 'Assets/Label/Label_Sample.jpg' },
                { type: 'image', src: 'Assets/Label/Label_sample3.jpg' },
                { type: 'image', src: 'Assets/Label/Label_Sample5.jpg' },
                { type: 'image', src: 'Assets/Label/Prod_Label.jpg' },
                { type: 'video', src: 'Assets/Label/Label_Sample4.mp4' },
                { type: 'video', src: 'Assets/Label/Prod_Label.mp4' },
                { type: 'video', src: 'Assets/Label/Food Manufacturing_Label.mp4' },
                { type: 'video', src: 'Assets/Label/Food Manufacturing_Label2.mp4' },
                { type: 'video', src: 'Assets/Label/Food Manufacturing_Label3.mp4' }
            ],
            currentIndex: 0
        },
        'monitoring': {
            items: [
                { type: 'image', src: 'Assets/Computer_Monitoring/Main.PNG' },
                { type: 'image', src: 'Assets/Computer_Monitoring/Sample_Capture.PNG' }
            ],
            currentIndex: 0
        }
    };

    function getSlideContainer(carouselId) {
        const container = document.getElementById(`carousel-${carouselId}`);
        if (!container) return null;
        return container.querySelector('.carousel-slide');
    }

    function renderCarouselItem(carouselId, index) {
        const carousel = carousels[carouselId];
        if (!carousel) return;

        const slide = getSlideContainer(carouselId);
        if (!slide) return;

        const item = carousel.items[index];
        if (!item) return;

        slide.innerHTML = '';
        const showcase = slide.closest('.project-showcase');
        if (showcase) {
            let counter = showcase.querySelector('.carousel-count');
            if (!counter) {
                counter = document.createElement('span');
                counter.className = 'carousel-count';
                showcase.appendChild(counter);
            }
            counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(carousel.items.length).padStart(2, '0')}`;
        }

        if (item.type === 'video') {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:relative; display:inline-block; width:100%; max-width:600px;';

            const video = document.createElement('video');
            video.src = item.src;
            video.controls = true;
            video.preload = 'metadata';
            video.playsInline = true;
            video.setAttribute('data-lightbox', item.src);
            video.setAttribute('data-type', 'video');
            video.style.cssText = 'width:100%; max-width:600px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); background:#000; cursor:pointer;';

            video.addEventListener('click', function (e) {
                e.stopPropagation();
                openLightboxMedia(item.src, 'video');
            });

            const overlay = document.createElement('div');
            overlay.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:32px;height:32px;fill:currentColor;stroke:none"><path d="M8 5v14l11-7Z"/></svg>';
            overlay.style.cssText = `
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 72px; height: 72px;
        border-radius: 50%;
        background: rgba(0,0,0,0.6);
        border: 2px solid rgba(255,255,255,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: #fff;
        pointer-events: none;
        backdrop-filter: blur(4px);
        transition: all 0.3s ease;
        z-index: 2;
      `;

            const badge = document.createElement('span');
            badge.textContent = 'VIDEO';
            badge.style.cssText = `
        position: absolute;
        top: 12px; right: 12px;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        color: #fff;
        padding: 4px 12px;
        border-radius: 100px;
        font: 500 0.6rem "DM Mono", monospace;
        border: 1px solid rgba(255,255,255,0.1);
        z-index: 2;
        letter-spacing: 0.06em;
      `;

            wrapper.appendChild(video);
            wrapper.appendChild(overlay);
            wrapper.appendChild(badge);

            wrapper.addEventListener('mouseenter', () => {
                overlay.style.background = 'rgba(139,92,246,0.45)';
                overlay.style.borderColor = '#a78bfa';
                overlay.style.transform = 'translate(-50%, -50%) scale(1.1)';
            });
            wrapper.addEventListener('mouseleave', () => {
                overlay.style.background = 'rgba(0,0,0,0.6)';
                overlay.style.borderColor = 'rgba(255,255,255,0.3)';
                overlay.style.transform = 'translate(-50%, -50%) scale(1)';
            });

            slide.appendChild(wrapper);

        } else {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = 'Project screenshot';
            img.loading = 'lazy';
            img.setAttribute('data-lightbox', item.src);
            img.setAttribute('data-type', 'image');
            img.style.cssText = 'width:100%; max-width:600px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); cursor:pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;';

            img.addEventListener('click', function (e) {
                e.stopPropagation();
                openLightboxMedia(item.src, 'image');
            });

            img.addEventListener('mouseenter', function () {
                this.style.transform = 'scale(1.02)';
                this.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
            });
            img.addEventListener('mouseleave', function () {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = 'none';
            });

            slide.appendChild(img);
        }
    }

    function navigateCarousel(carouselId, direction) {
        const carousel = carousels[carouselId];
        if (!carousel) return;

        const totalItems = carousel.items.length;
        carousel.currentIndex = (carousel.currentIndex + direction + totalItems) % totalItems;
        renderCarouselItem(carouselId, carousel.currentIndex);
    }

    function initCarousels() {
        Object.keys(carousels).forEach(key => {
            const container = document.getElementById(`carousel-${key}`);
            if (container) {
                const prevBtn = container.querySelector('[data-prev]');
                const nextBtn = container.querySelector('[data-next]');

                if (prevBtn) {
                    prevBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        navigateCarousel(key, -1);
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        navigateCarousel(key, 1);
                    });
                }
                renderCarouselItem(key, 0);
            }
        });
    }

    // ============================================================
    // LIGHTBOX
    // ============================================================

    const lightbox = document.getElementById('lightbox');
    const lightboxContent = document.getElementById('lightbox-content');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');

    let lightboxItems = [];
    let lightboxIndex = 0;
    let currentVideo = null;

    function openLightboxMedia(src, type) {
        lightboxItems = [];

        Object.keys(carousels).forEach(key => {
            carousels[key].items.forEach(item => {
                lightboxItems.push(item);
            });
        });

        lightboxIndex = lightboxItems.findIndex(item => item.src === src);
        if (lightboxIndex === -1) lightboxIndex = 0;

        updateLightbox();
        lightbox.classList.add('active');
        document.body.classList.add('lightbox-open');
        document.body.style.overflow = 'hidden';
    }

    function updateLightbox() {
        if (lightboxItems.length === 0) return;

        const item = lightboxItems[lightboxIndex];
        if (!item) return;

        lightboxContent.innerHTML = '';
        currentVideo = null;

        if (item.type === 'video') {
            const video = document.createElement('video');
            video.src = item.src;
            video.controls = true;
            video.autoplay = true;
            video.preload = 'auto';
            video.playsInline = true;
            video.style.cssText = 'max-width:90vw; max-height:85vh; border-radius:12px; box-shadow:0 30px 80px rgba(0,0,0,0.6); background:#000; width:auto; height:auto;';

            currentVideo = video;
            lightboxContent.appendChild(video);

        } else {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = 'Project screenshot';
            img.style.cssText = 'max-width:90vw; max-height:85vh; border-radius:12px; box-shadow:0 30px 80px rgba(0,0,0,0.6); width:auto; height:auto;';

            lightboxContent.appendChild(img);
        }

        lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;

        if (lightboxItems.length <= 1) {
            lightboxPrev.style.display = 'none';
            lightboxNext.style.display = 'none';
        } else {
            lightboxPrev.style.display = 'flex';
            lightboxNext.style.display = 'flex';
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.classList.remove('lightbox-open');
        document.body.style.overflow = '';

        if (currentVideo) {
            currentVideo.pause();
            currentVideo = null;
        }
    }

    function prevLightbox() {
        if (lightboxItems.length <= 1) return;
        lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
        updateLightbox();
    }

    function nextLightbox() {
        if (lightboxItems.length <= 1) return;
        lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
        updateLightbox();
    }

    // Lightbox Event Listeners
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', function (e) {
            e.stopPropagation();
            prevLightbox();
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', function (e) {
            e.stopPropagation();
            nextLightbox();
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (!lightbox || !lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevLightbox();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextLightbox();
        }
    });

    // Click on any image with data-lightbox
    document.addEventListener('click', function (e) {
        const target = e.target.closest('[data-lightbox]');
        if (target) {
            const src = target.dataset.lightbox;
            const type = target.dataset.type || 'image';
            e.preventDefault();
            openLightboxMedia(src, type);
        }
    });

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousels);
    } else {
        initCarousels();
    }

    console.log("Stephen Ryan Pacifico - Portfolio loaded successfully!");
})();
