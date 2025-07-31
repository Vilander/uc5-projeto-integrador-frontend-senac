/**
 * Este script lida com a funcionalidade de pesquisa do site.
 * Ele é executado na página de resultados da pesquisa (search-results.html).
 */

// Espera a página carregar completamente antes de rodar o script
document.addEventListener("DOMContentLoaded", () => {
  // Procura a área onde os resultados vão aparecer
  const resultsContainer = document.getElementById("results-container");

  // Procura a área onde vamos mostrar o termo que foi pesquisado
  const queryDisplay = document.getElementById("search-query-display");

  // Se as duas áreas existem na página...
  if (resultsContainer && queryDisplay) {
    // Pega os dados da URL (ex: ?query=bolo)
    const urlParams = new URLSearchParams(window.location.search);

    // Pega o valor do parâmetro chamado "query" (a palavra pesquisada)
    const query = urlParams.get("query");

    // Se o usuário escreveu algo...
    if (query) {
      // Mostra a palavra pesquisada na tela
      queryDisplay.textContent = query;

      // Chama a função que vai procurar nas outras páginas
      performSearch(query, resultsContainer);
    } else {
      // Se não escreveu nada, mostra uma mensagem pedindo para digitar algo
      resultsContainer.innerHTML =
        "<p>Por favor, digite um termo para pesquisar.</p>";
    }
  }
});

/**
 * Realiza a busca pelo termo em outras páginas.
 * @param {string} query - A palavra a ser pesquisada.
 * @param {HTMLElement} container - Onde os resultados vão aparecer.
 */
async function performSearch(query, container) {
  // Lista das páginas onde vamos procurar a palavra
  const pages = ["sobre.html", "contato.html", "portifolio.html", "blog.html"];

  // Mostra uma mensagem de carregamento
  container.innerHTML = "<p>Pesquisando...</p>";

  // Deixa tudo minúsculo para facilitar a comparação
  const lowerCaseQuery = query.toLowerCase();

  // Aqui vamos guardar os resultados encontrados
  let allResults = [];

  // Começa a buscar em todas as páginas ao mesmo tempo
  const pagePromises = pages.map((pageUrl) =>
    fetch(pageUrl) // Pede o conteúdo da página
      .then((response) => {
        if (!response.ok) {
          // Se deu erro ao abrir a página, mostra erro
          throw new Error(`Erro ao carregar a página: ${pageUrl}`);
        }
        return response.text(); // Transforma o conteúdo em texto
      })
      .then((html) => {
        // Cria um "documento HTML falso" com o conteúdo da página
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Pega só o texto da parte principal da página
        const pageContent =
          doc.querySelector("main")?.innerText || doc.body.innerText;

        // Pega o título da página ou o nome do arquivo
        const pageTitle = doc.querySelector("title")?.innerText || pageUrl;

        // Verifica se o texto da página contém a palavra buscada
        if (pageContent.toLowerCase().includes(lowerCaseQuery)) {
          // Cria um trechinho do texto para mostrar como exemplo
          const snippet = createSnippet(pageContent, lowerCaseQuery);

          // Retorna os dados do resultado
          return {
            title: pageTitle.replace("Vilander Costa", "").trim(), // Remove o nome do site se quiser
            url: pageUrl,
            snippet: snippet.replace(
              new RegExp(query, "gi"),
              `<mark>${query}</mark>`
            ), // Destaca a palavra
          };
        }

        return null; // Se não encontrou, retorna nulo
      })
      .catch((error) => {
        // Se algo deu errado na busca dessa página, mostra o erro no console
        console.error(`Falha ao processar ${pageUrl}:`, error);
        return null; // Evita que a busca toda pare por causa de um erro
      })
  );

  // Espera todas as buscas terminarem
  const results = await Promise.all(pagePromises);

  // Remove os resultados nulos (que não tinham a palavra)
  const foundResults = results.filter((result) => result !== null);

  // Mostra os resultados na tela
  displayResults(foundResults, container);
}

/**
 * Mostra os resultados na página
 * @param {Array} results - Os resultados encontrados.
 * @param {HTMLElement} container - Onde os resultados serão colocados.
 */
function displayResults(results, container) {
  // Limpa a mensagem de "Pesquisando..."
  container.innerHTML = "";

  // Se não achou nada...
  if (results.length === 0) {
    container.innerHTML = "<p>Nenhum resultado encontrado para sua busca.</p>";
    return;
  }

  // Cria uma lista para mostrar os resultados
  const resultList = document.createElement("ul");
  resultList.className = "search-results-list";

  // Para cada resultado, cria um item na lista
  results.forEach((result) => {
    const listItem = document.createElement("li");
    listItem.className = "search-result-item";

    // Coloca o título, o trecho do texto e o link
    listItem.innerHTML = `
            <h3><a href="${result.url}">${result.title}</a></h3>
            <p class="snippet">${result.snippet}</p>
            <a href="${result.url}" class="result-link">${window.location.origin}/Pages/${result.url}</a>
        `;

    // Adiciona esse item na lista
    resultList.appendChild(listItem);
  });

  // Coloca a lista de resultados na tela
  container.appendChild(resultList);
}

/**
 * Cria um trecho (snippet) com a palavra pesquisada no meio
 * @param {string} content - Todo o texto da página.
 * @param {string} lowerCaseQuery - A palavra buscada, em minúsculas.
 * @returns {string} - Um pedaço do texto com a palavra.
 */
function createSnippet(content, lowerCaseQuery) {
  // Descobre onde a palavra aparece no texto
  const index = content.toLowerCase().indexOf(lowerCaseQuery);

  // Se não encontrar, mostra o comecinho do texto
  if (index === -1) {
    return content.substring(0, 180) + "...";
  }

  // Pega um pedaço antes e depois da palavra encontrada
  const start = Math.max(0, index - 80);
  const end = Math.min(content.length, index + lowerCaseQuery.length + 100);

  // Corta o texto nesse pedaço
  let snippet = content.substring(start, end);

  // Adiciona "..." se for um corte no meio do texto
  if (start > 0) {
    snippet = "..." + snippet;
  }
  if (end < content.length) {
    snippet = snippet + "...";
  }

  return snippet;
}
