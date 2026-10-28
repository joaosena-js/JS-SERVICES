// ---------------------------------------------------------
// PREFERÊNCIAS DO VISITANTE
// reduceMotion: a pessoa pediu ao sistema para reduzir animações.
// finePointer: o aparelho tem mouse (não é tela de toque).
// Os efeitos que seguem o mouse só rodam quando faz sentido.
// ---------------------------------------------------------
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------------------------------------------------------
// ÍCONES (Lucide)
// Desenha todos os <i data-lucide="..."> da página. Se o
// CDN do Lucide falhar por algum motivo (sem internet, CDN
// fora do ar), isso não trava o resto do site graças ao
// try/catch abaixo.
// ---------------------------------------------------------
try {
    if (typeof lucide !== 'undefined') lucide.createIcons();
} catch (e) {
    console.warn('Não foi possível carregar os ícones (lucide):', e);
}

// ---------------------------------------------------------
// TELA DE CARREGAMENTO (preloader)
// Esconde a tela do robô assim que a página carrega, com um
// tempo mínimo de exibição (para não "piscar" em conexões
// muito rápidas) e uma trava de segurança: mesmo que algum
// recurso externo nunca termine de carregar, a tela some
// sozinha depois de 3 segundos.
// ---------------------------------------------------------
function hidePreloader() {
    const pre = document.getElementById('preloader');
    if (!pre || pre.classList.contains('hide')) return;
    pre.classList.add('hide');
    setTimeout(() => pre.remove(), 650); // remove do DOM após o fade-out
}

const MIN_LOADER_TIME = 600; // tempo mínimo (ms) que a tela fica visível
const loaderStart = performance.now();

function runHideWithMinTime() {
    const wait = Math.max(0, MIN_LOADER_TIME - (performance.now() - loaderStart));
    setTimeout(hidePreloader, wait);
}

if (document.readyState === 'complete') runHideWithMinTime();
else window.addEventListener('load', runHideWithMinTime);
setTimeout(hidePreloader, 3000); // trava de segurança

// ---------------------------------------------------------
// ANIMAÇÃO DE ENTRADA AO ROLAR (scroll reveal)
// Observa todos os elementos .reveal / .reveal-stagger e
// adiciona a classe "in" (que dispara a transição no CSS)
// assim que 15% do elemento aparece na tela.
// ---------------------------------------------------------
const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target); // anima só uma vez
            }
        });
    }, { threshold: .15 });
    revealEls.forEach(el => io.observe(el));
} else {
    // navegador muito antigo sem suporte a IntersectionObserver:
    // mostra tudo direto, sem animação, em vez de deixar oculto.
    revealEls.forEach(el => el.classList.add('in'));
}

// ---------------------------------------------------------
// CABEÇALHO AO ROLAR
// - .scrolled no header: menu ganha fundo depois de 20px
// - barra de progresso de leitura no topo
// - botão flutuante do WhatsApp aparece depois do hero
// Tudo é calculado dentro de requestAnimationFrame, no
// máximo uma vez por quadro, para não pesar na rolagem.
// ---------------------------------------------------------
const header = document.getElementById('header');
const progressBar = document.querySelector('.scroll-progress span');
const floatWa = document.querySelector('.float-wa');
const hero = document.querySelector('.hero');
let scrollTicking = false;

function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 20);
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (floatWa && hero) floatWa.classList.toggle('visible', y > hero.offsetHeight * .6);
    scrollTicking = false;
}

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(onScroll);
        scrollTicking = true;
    }
}, { passive: true });
onScroll();

// ---------------------------------------------------------
// LINK ATIVO NO MENU
// Destaca no menu a seção que está no meio da tela.
// ---------------------------------------------------------
const navLinks = document.querySelectorAll('.nav-links a');
if ('IntersectionObserver' in window) {
    const sectionIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(a => {
        const section = document.querySelector(a.getAttribute('href'));
        if (section) sectionIO.observe(section);
    });
}

// ---------------------------------------------------------
// MENU DO CELULAR
// Abre/fecha o painel de links. Fecha também ao clicar em
// um link ou apertar Esc.
// ---------------------------------------------------------
const navToggle = document.getElementById('navToggle');
const navPanel = document.getElementById('navLinks');

function setMenu(open) {
    navPanel.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

if (navToggle && navPanel) {
    navToggle.addEventListener('click', () => setMenu(!navPanel.classList.contains('open')));
    navPanel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    // se a tela for alargada com o menu aberto, fecha para não travar a rolagem
    window.matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
}

// ---------------------------------------------------------
// BRILHO QUE SEGUE O MOUSE NOS CARDS (.spot)
// Atualiza as variáveis --mx e --my usadas no CSS.
// ---------------------------------------------------------
if (finePointer && !reduceMotion) {
    document.querySelectorAll('.spot').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });
}

// ---------------------------------------------------------
// INCLINAÇÃO 3D DA ILUSTRAÇÃO DO HERO (tilt)
// A grade de cartões inclina alguns graus na direção do
// mouse. Só no computador e sem movimento reduzido.
// ---------------------------------------------------------
const assembler = document.getElementById('assembler');
if (assembler && hero && finePointer && !reduceMotion) {
    const MAX_TILT = 8; // inclinação máxima em graus
    let tiltFrame = null;
    hero.addEventListener('pointermove', e => {
        if (tiltFrame) return;
        tiltFrame = requestAnimationFrame(() => {
            const r = assembler.getBoundingClientRect();
            const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
            const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
            assembler.style.setProperty('--tilt-y', `${(x * MAX_TILT * 2).toFixed(2)}deg`);
            assembler.style.setProperty('--tilt-x', `${(-y * MAX_TILT * 2).toFixed(2)}deg`);
            tiltFrame = null;
        });
    });
    hero.addEventListener('pointerleave', () => {
        assembler.style.setProperty('--tilt-x', '0deg');
        assembler.style.setProperty('--tilt-y', '0deg');
    });
}

// ---------------------------------------------------------
// JANELA DE DETALHES DO PORTFÓLIO (modal)
// openProject() recebe { title, image, description, tools, video }
// e pode continuar sendo chamada direto, se preferir.
// Os cards <button class="port-card"> chamam essa função com
// os dados dos atributos data-* (veja o comentário no HTML).
// O texto é inserido com textContent/createElement, que não
// interpreta HTML, evitando injeção de código.
// ---------------------------------------------------------
const modal = document.getElementById('projectModal');
let lastFocused = null;

function openProject(project) {
    if (!modal) return;

    document.getElementById('modalTitle').textContent = project.title || '';
    document.getElementById('modalDescription').textContent = project.description || '';

    const media = document.getElementById('modalMedia');
    media.replaceChildren();

    if (project.video) {
        const video = document.createElement('video');
        video.src = project.video;
        video.controls = true;
        video.muted = true;
        video.autoplay = !reduceMotion;
        video.playsInline = true;
        media.appendChild(video);
    } else if (project.image) {
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title || '';
        media.appendChild(img);
    }

    const toolsBox = document.getElementById('modalTools');
    toolsBox.replaceChildren();
    (project.tools || []).forEach(tool => {
        const tag = document.createElement('span');
        tag.textContent = tool;
        toolsBox.appendChild(tag);
    });

    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    // espera um quadro para o navegador aplicar o display e então animar
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('show')));
    modal.querySelector('.modal-close').focus({ preventScroll: true });
}

function closeProject() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('show');
    document.body.classList.remove('no-scroll');
    const media = document.getElementById('modalMedia');
    setTimeout(() => {
        modal.hidden = true;
        media.replaceChildren(); // para o vídeo, se houver
    }, reduceMotion ? 0 : 300);
    if (lastFocused) lastFocused.focus({ preventScroll: true });
}

document.querySelectorAll('.port-card[data-title]').forEach(card => {
    card.addEventListener('click', () => {
        openProject({
            title: card.dataset.title,
            image: card.dataset.image,
            video: card.dataset.video,
            description: card.dataset.description,
            tools: (card.dataset.tools || '').split(',').map(t => t.trim()).filter(Boolean)
        });
    });
});

if (modal) {
    modal.querySelector('.modal-close').addEventListener('click', closeProject);

    // fecha ao clicar no fundo escuro (fora da caixa branca)
    modal.addEventListener('click', e => {
        if (e.target === modal) closeProject();
    });

    // mantém o foco do teclado dentro da janela enquanto ela está aberta
    modal.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        const focusables = modal.querySelectorAll('button, [href], video, [tabindex]:not([tabindex="-1"])');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
}

// tecla Esc fecha a janela do portfólio e o menu do celular
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeProject();
    if (navPanel && navPanel.classList.contains('open')) setMenu(false);
});
