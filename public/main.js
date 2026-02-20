/* =========================================
    STATE
========================================= */
let bioCount = 0;
const MAX_FREE_BIOS = 2;
let currentBioText = '';
let isGenerating = false;

/* =========================================
    DARK MODE DETECTION
========================================= */
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(event) {
if (event.matches) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
});

/* =========================================
    SCROLL ANIMATIONS
========================================= */
var revealObserver = new IntersectionObserver(function(entries) {
entries.forEach(function(entry) {
    if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    }
});
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(function(el) {
revealObserver.observe(el);
});

/* =========================================
    NAVIGATION
========================================= */
var mainNav = document.getElementById('mainNav');
window.addEventListener('scroll', function() {
if (window.scrollY > 60) {
    mainNav.classList.add('scrolled');
} else {
    mainNav.classList.remove('scrolled');
}
});

// Mobile menu
var hamburgerBtn = document.getElementById('hamburgerBtn');
var mobileMenu = document.getElementById('mobileMenu');
var mobileClose = document.getElementById('mobileClose');

hamburgerBtn.addEventListener('click', function() {
mobileMenu.classList.add('active');
});

mobileClose.addEventListener('click', function() {
mobileMenu.classList.remove('active');
});

document.querySelectorAll('.mobile-link').forEach(function(link) {
link.addEventListener('click', function() {
    mobileMenu.classList.remove('active');
});
});

/* =========================================
    TOAST SYSTEM
========================================= */
function showToast(message, icon) {
icon = icon || 'fa-solid fa-check-circle';
var container = document.getElementById('toastContainer');
var toast = document.createElement('div');
toast.className = 'toast';
toast.innerHTML = '<i class="' + icon + '"></i> ' + message;
container.appendChild(toast);
setTimeout(function() {
    if (toast.parentNode) {
    toast.parentNode.removeChild(toast);
    }
}, 3000);
}

/* =========================================
    MODAL SYSTEM
========================================= */
function showModal(title, message, actions) {
var overlay = document.createElement('div');
overlay.className = 'modal-overlay';

var actionsHTML = '';
if (actions && actions.length > 0) {
    actions.forEach(function(action, i) {
    var cls = action.primary ? 'btn btn-primary' : 'btn btn-secondary';
    actionsHTML += '<button class="' + cls + '" data-action="' + i + '">' + action.label + '</button>';
    });
} else {
    actionsHTML = '<button class="btn btn-primary" data-action="close">Got it</button>';
}

overlay.innerHTML =
    '<div class="modal-box">' +
    '<h3>' + title + '</h3>' +
    '<p>' + message + '</p>' +
    '<div class="modal-actions">' + actionsHTML + '</div>' +
    '</div>';

overlay.addEventListener('click', function(e) {
    var actionIdx = e.target.getAttribute('data-action');
    if (actionIdx === 'close' || e.target === overlay) {
    document.body.removeChild(overlay);
    } else if (actionIdx !== null && actions && actions[parseInt(actionIdx)]) {
    var cb = actions[parseInt(actionIdx)].callback;
    document.body.removeChild(overlay);
    if (cb) cb();
    }
});

document.body.appendChild(overlay);
}

/* =========================================
    UPGRADE BUTTON
========================================= */
document.getElementById('upgradeBtn').addEventListener('click', function() {
showModal(
    'Pro Plan Coming Soon',
    'We\'re finalizing the Pro plan with unlimited generations, all tones, and PDF downloads. Stay tuned for the launch!',
    [{ label: 'Sounds Good', primary: true, callback: null }]
);
});

/* =========================================
    BIO GENERATION
========================================= */
var bioForm = document.getElementById('bioForm');
var generateBtn = document.getElementById('generateBtn');

function updateGenerateButton() {
if (isGenerating) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
} else {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Generate My Bio';
}
}

function updateUsageBadge() {
var remaining = Math.max(0, MAX_FREE_BIOS - bioCount);
var usageText = document.getElementById('usageText');
if (remaining > 0) {
    usageText.textContent = remaining + ' free bio' + (remaining !== 1 ? 's' : '') + ' remaining today';
} else {
    usageText.textContent = 'Free bios used up. Wait until tomorrow for more!';
}
}

bioForm.addEventListener('submit', async function(e) {
e.preventDefault();
if (isGenerating) return;

if (bioCount >= MAX_FREE_BIOS) {
    showModal(
    'Daily Limit Reached',
    'You\'ve used your 2 free bios for today. Upgrade to Pro for unlimited generations, all tones, and more!',
    [
        { label: 'Maybe Later', primary: false, callback: null },
        { label: 'View Pro Plan', primary: true, callback: function() {
        document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
        }}
    ]
    );
    return;
}

var name = document.getElementById('nameInput').value.trim();
var course = document.getElementById('courseInput').value.trim();
var uni = document.getElementById('uniInput').value.trim();
var skills = document.getElementById('skillsInput').value.trim();
var interests = document.getElementById('interestsInput').value.trim();
var exp = document.getElementById('expInput').value.trim();
var bioType = document.getElementById('bioType').value;
var tone = document.querySelector('input[name="tone"]:checked').value;

if (!name || !course || !skills || !interests) {
    showToast('Please fill in all required fields.', 'fa-solid fa-exclamation-circle');
    return;
}

isGenerating = true;
updateGenerateButton();

var loadingState = document.getElementById('loadingState');
var resultArea = document.getElementById('resultArea');
var resultText = document.getElementById('resultText');
var resultActions = document.getElementById('resultActions');
var resultMeta = document.getElementById('resultMeta');

loadingState.classList.add('active');
resultArea.classList.remove('active');

const promptData = { name, course, uni, skills, interests, exp, bioType, tone };

try {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API Error');
    }

    currentBioText = data.bio.trim();
    loadingState.classList.remove('active');
    resultArea.classList.add('active');
    
    resultText.innerHTML = currentBioText + '<span class="cursor-blink"></span>';
    setTimeout(() => {
        resultText.textContent = currentBioText;
    }, 1500);

    resultActions.style.display = 'flex';
    var wordCount = currentBioText.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
    resultMeta.textContent = wordCount + ' words';
    
    bioCount++;
    updateUsageBadge();

} catch (err) {
    loadingState.classList.remove('active');
    resultArea.classList.add('active');
    resultText.textContent = 'Something went wrong. Please check your API key.';
    resultActions.style.display = 'none';
    showToast('Error: ' + (err.message || 'Could not generate bio'), 'fa-solid fa-exclamation-triangle');
} finally {
    isGenerating = false;
    updateGenerateButton();
}
});

/* =========================================
    COPY / DOWNLOAD / REGENERATE
========================================= */
document.getElementById('copyBtn').addEventListener('click', function() {
if (!currentBioText) return;
navigator.clipboard.writeText(currentBioText).then(function() {
    var copyBtn = document.getElementById('copyBtn');
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    showToast('Bio copied to clipboard!');
    setTimeout(function() {
    copyBtn.classList.remove('copied');
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy to Clipboard';
    }, 2000);
});
});

document.getElementById('downloadBtn').addEventListener('click', function() {
if (!currentBioText) return;
var blob = new Blob([currentBioText], { type: 'text/plain' });
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = 'my-bio.txt';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
showToast('Bio downloaded!', 'fa-solid fa-download');
});

document.getElementById('regenerateBtn').addEventListener('click', function() {
document.getElementById('resultArea').classList.remove('active');
bioForm.dispatchEvent(new Event('submit'));
});
