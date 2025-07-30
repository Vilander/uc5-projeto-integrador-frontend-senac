/**
 * Este script lida com a funcionalidade de pesquisa do site.
 * Ele é executado na página de resultados da pesquisa (search-results.html).
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se estamos na página de resultados da pesquisa.
    // O ideal é colocar este script apenas na página de resultados.
    const resultsContainer = document.getElementById('results-container');
    const queryDisplay = document.getElementById('search-query-display');

    if (resultsContainer && queryDisplay) {
        // Pega o termo de pesquisa da URL.
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('query');

        if (query) {
            // Exibe o termo que está sendo pesquisado.
            queryDisplay.textContent = query;
            // Inicia a busca.
            performSearch(query, resultsContainer);
        } else {
            resultsContainer.innerHTML = '<p>Por favor, digite um termo para pesquisar.</p>';
        }
    }
});

/**
 * Realiza a busca pelo 'query' nas páginas especificadas.
 * @param {string} query - O termo a ser pesquisado.
 * @param {HTMLElement} container - O elemento HTML onde os resultados serão exibidos.
 */
async function performSearch(query, container) {
    // Lista de páginas para pesquisar.
    // Certifique-se de que os caminhos estão corretos.
    const pages = ['sobre.html', 'contato.html', 'portifolio.html', 'blog.html'];
    container.innerHTML = '<p>Pesquisando...</p>'; // Mensagem de carregamento

    const lowerCaseQuery = query.toLowerCase();
    let allResults = [];

    // Usa Promise.all para buscar todas as páginas em paralelo.
    const pagePromises = pages.map(pageUrl =>
        fetch(pageUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar a página: ${pageUrl}`);
            }
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const pageContent = doc.querySelector('main')?.innerText || doc.body.innerText;
            const pageTitle = doc.querySelector('title')?.innerText || pageUrl;

            // Verifica se o conteúdo da página inclui o termo pesquisado.
            if (pageContent.toLowerCase().includes(lowerCaseQuery)) {
                // Se encontrar, cria um snippet do texto para exibir.
                const snippet = createSnippet(pageContent, lowerCaseQuery);
                return {
                    title: pageTitle.replace('Vilander Costa', '').trim(),
                    url: pageUrl,
                    snippet: snippet.replace(new RegExp(query, 'gi'), `<mark>${query}</mark>`) // Destaca o termo
                };
            }
            return null;
        })
        .catch(error => {
            console.error(`Falha ao processar ${pageUrl}:`, error);
            return null; // Retorna nulo em caso de erro para não quebrar a busca.
        })
    );

    const results = await Promise.all(pagePromises);
    const foundResults = results.filter(result => result !== null);

    displayResults(foundResults, container);
}

/**
 * Exibe os resultados da busca no container.
 * @param {Array} results - Um array de objetos de resultado.
 * @param {HTMLElement} container - O elemento para exibir os resultados.
 */
function displayResults(results, container) {
    container.innerHTML = ''; // Limpa a mensagem de "Pesquisando...".

    if (results.length === 0) {
        container.innerHTML = '<p>Nenhum resultado encontrado para sua busca.</p>';
        return;
    }

    const resultList = document.createElement('ul');
    resultList.className = 'search-results-list';

    results.forEach(result => {
        const listItem = document.createElement('li');
        listItem.className = 'search-result-item';
        listItem.innerHTML = `
            <h3><a href="${result.url}">${result.title}</a></h3>
            <p class="snippet">${result.snippet}</p>
            <a href="${result.url}" class="result-link">${window.location.origin}/Pages/${result.url}</a>
        `;
        resultList.appendChild(listItem);
    });

    container.appendChild(resultList);
}

/**
 * Cria um pequeno trecho de texto (snippet) em torno do termo encontrado.
 * @param {string} content - O texto completo da página.
 * @param {string} lowerCaseQuery - O termo de busca em minúsculas.
 * @returns {string} - O snippet de texto.
 */
function createSnippet(content, lowerCaseQuery) {
    const index = content.toLowerCase().indexOf(lowerCaseQuery);
    if (index === -1) {
        return content.substring(0, 180) + '...';
    }

    const start = Math.max(0, index - 80);
    const end = Math.min(content.length, index + lowerCaseQuery.length + 100);

    let snippet = content.substring(start, end);
    if (start > 0) {
        snippet = '...' + snippet;
    }
    if (end < content.length) {
        snippet = snippet + '...';
    }
    return snippet;
}
