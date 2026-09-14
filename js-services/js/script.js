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
// sozinha depois de 4 segundos.
// ---------------------------------------------------------
function hidePreloader() {
    const pre = document.getElementById('preloader');
    if (!pre || pre.classList.contains('hide')) return;
    pre.classList.add('hide');
    setTimeout(() => pre.remove(), 650); // remove do DOM após o fade-out
}

const MIN_LOADER_TIME = 900; // tempo mínimo (ms) que a tela fica visível
const loaderStart = Date.now();

function runHideWithMinTime() {
    const wait = Math.max(0, MIN_LOADER_TIME - (Date.now() - loaderStart));
    setTimeout(hidePreloader, wait);
}

window.addEventListener('load', runHideWithMinTime);
setTimeout(hidePreloader, 4000); // trava de segurança

// ---------------------------------------------------------
// ANIMAÇÃO DE ENTRADA AO ROLAR (scroll reveal)
// Observa todos os elementos .reveal / .reveal-stagger e
// adiciona a classe "in" (que dispara a transição no CSS)
// assim que 15% do elemento aparece na tela.
// ---------------------------------------------------------
try {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target); // anima só uma vez
            }
        });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));
} catch (e) {
    // navegador muito antigo sem suporte a IntersectionObserver:
    // mostra tudo direto, sem animação, em vez de deixar oculto.
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => el.classList.add('in'));
}

function openProject(project) {

    document.getElementById("modalTitle").textContent =
        project.title;

    document.getElementById("modalDescription").textContent =
        project.description;

    const media = document.getElementById("modalMedia");

    if (project.video) {

        media.innerHTML = `
          <video controls autoplay muted>
            ${project.video}
          </video>
        `;

    } else {

        media.innerHTML = `
        <img src="${project.image}" alt="${project.title}">
        `;

    }

    document.getElementById("modalTools").innerHTML =
        project.tools
            .map(tool => `<span>${tool}</span>`)
            .join('');

    document
        .getElementById("projectModal")
        .classList.add("show");
}

function closeProject() {
    document
        .getElementById("projectModal")
        .classList.remove("show");
}
window.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById("projectModal");

    if (modal) {

        modal.addEventListener("click", function (e) {

            if (e.target === this) {
                closeProject();
            }

        });

    }

});