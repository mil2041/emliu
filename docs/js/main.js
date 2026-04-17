(function () {
    'use strict';

    // ===== PARSING HELPERS =====

    // Parse a "key: value" block format separated by "---"
    function parseBlocks(text) {
        return text.split(/\n---\n/).map(function (block) {
            var obj = {};
            block.trim().split('\n').forEach(function (line) {
                var idx = line.indexOf(':');
                if (idx > 0) {
                    var key = line.substring(0, idx).trim();
                    var val = line.substring(idx + 1).trim();
                    obj[key] = val;
                }
            });
            return obj;
        }).filter(function (obj) { return Object.keys(obj).length > 0; });
    }

    // Convert **bold** markers in plain text to <strong> tags
    function boldify(text) {
        return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    // Split description into bullet points by splitting on ". " boundaries
    function descriptionToList(desc) {
        if (!desc) return '';
        var sentences = desc.split(/\.\s+/).filter(function (s) { return s.trim().length > 0; });
        if (sentences.length <= 1) return '<p>' + desc + '</p>';
        return '<ul class="exp-desc-list">' +
            sentences.map(function (s) {
                var text = s.replace(/\.+$/, '').trim();
                return '<li>' + text + '.</li>';
            }).join('') +
            '</ul>';
    }

    // ===== RENDER FUNCTIONS =====

    function renderAbout(md) {
        var el = document.getElementById('about-content');
        if (el) el.innerHTML = marked.parse(md);
    }


    function renderExperience(text) {
        var items = parseBlocks(text);
        var el = document.getElementById('experience-content');
        if (!el) return;

        el.innerHTML = items.map(function (item) {
            var badge = item.current === 'true'
                ? '<span class="exp-badge exp-badge--current">Current</span>' : '';

            return '<div class="exp-card fade-in">' +
                '<div class="exp-left">' +
                    badge +
                    '<h3>' + (item.title || '') + '</h3>' +
                    '<p class="exp-org">' + (item.org || '') + '</p>' +
                    '<span class="exp-date">' + (item.date || '') + '</span>' +
                '</div>' +
                '<div class="exp-right">' +
                    '<p class="exp-meta">' + (item.department || '') + ' &middot; Advisor: ' + (item.advisor || '') + '</p>' +
                    descriptionToList(item.description) +
                '</div>' +
                '</div>';
        }).join('');

        observeFadeIns();
    }

    function renderPublications(text) {
        var items = parseBlocks(text);
        var el = document.getElementById('publications-content');
        var countEl = document.getElementById('pub-count');
        if (!el) return;

        if (countEl) {
            countEl.textContent = '';
        }

        var total = items.length;

        el.innerHTML = items.map(function (item, i) {
            var num = total - i;
            var hl = item.highlight === 'true' ? ' pub--hl' : '';
            var badge = item.badge
                ? '<span class="pub-badge">' + item.badge + '</span>' : '';
            var vol = item.volume ? ', ' + item.volume : '';
            var authors = boldify(item.authors || '');

            return '<div class="pub' + hl + ' fade-in">' +
                '<span class="pub-num">' + num + '</span>' +
                '<div class="pub-body">' +
                    '<p>' + authors + ' ' +
                    '<a href="https://doi.org/' + (item.doi || '') + '" target="_blank" rel="noopener">' +
                    '&ldquo;' + (item.title || '') + '.&rdquo;</a> ' +
                    '<em>' + (item.journal || '') + '</em>' +
                    vol + ' (' + (item.year || '') + ') ' +
                    badge + '</p>' +
                '</div>' +
                '</div>';
        }).join('');

        observeFadeIns();
    }

    // ===== LOAD CONTENT =====

    function loadContent(url, callback) {
        fetch(url)
            .then(function (res) { return res.text(); })
            .then(callback)
            .catch(function (err) { console.warn('Failed to load ' + url, err); });
    }

    loadContent('content/about_me.md', renderAbout);
    loadContent('content/work_experience.md', renderExperience);
    loadContent('content/all_publications.md', renderPublications);

    // ===== UI: Dark mode toggle =====

    var themeBtn = document.querySelector('.theme-toggle');
    var themeIcon = themeBtn ? themeBtn.querySelector('i') : null;

    function setDarkMode(on) {
        document.body.classList.toggle('dark', on);
        if (themeIcon) {
            themeIcon.className = on ? 'fas fa-sun' : 'fas fa-moon';
        }
        try { localStorage.setItem('theme', on ? 'dark' : 'light'); } catch (e) {}
    }

    // Restore saved preference or respect system preference
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (saved === 'dark') {
        setDarkMode(true);
    } else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            setDarkMode(!document.body.classList.contains('dark'));
        });
    }

    // ===== UI: Mobile menu =====

    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            links.classList.toggle('active');
        });
    }

    // ===== UI: Smooth scroll =====

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var offset = document.querySelector('.nav').offsetHeight + 16;
                window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
            }
            if (links) links.classList.remove('active');
        });
    });

    // ===== UI: Scroll-triggered fade-in =====

    function observeFadeIns() {
        var els = document.querySelectorAll('.fade-in:not(.visible)');
        if (!els.length || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('visible'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        els.forEach(function (el) { observer.observe(el); });
    }

    observeFadeIns();

})();
