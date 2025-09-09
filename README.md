# 🔬 Calculadora de Cinética Microbiana

Bem-vindo à Calculadora de Cinética Microbiana, uma ferramenta web interativa projetada para simular a dinâmica de bioprocessos em reatores. A plataforma permite que estudantes, pesquisadores e engenheiros de bioprocessos modelem e visualizem o comportamento de culturas microbianas em reatores do tipo **Batelada (Batch)** e **Quimiostato (CSTR)**.

A aplicação utiliza modelos cinéticos consagrados para prever as concentrações de biomassa (X), substrato (S) e produto (P) ao longo do tempo.

<!-- Link para a Demonstração Online (substitua pelo seu link do GitHub Pages) -->
<!-- [Link para a Demonstração Online](https://ewdanzer.github.io/cinetica) -->


---

## ✨ Funcionalidades

* **Dois Modos de Operação:** Simule reatores em Batelada ou em modo contínuo (CSTR).
* **Modelos Cinéticos Robustos:**
    * **Crescimento Celular:** Modelo de Monod.
    * **Consumo de Substrato:** Modelo de Pirt (considera crescimento e manutenção celular).
    * **Formação de Produto:** Modelo de Luedeking-Piret (associa a produção ao crescimento e à biomassa).
* **Visualização Interativa:** Os resultados são plotados num gráfico dinâmico com eixos duplos para melhor comparação dos dados.
* **Análise de Dados:** Visualize indicadores chave do processo (X máximo, rendimento, produtividade) e explore os dados brutos numa tabela.
* **Exportação de Dados:** Baixe os resultados da simulação em formato \`.csv\` para análises futuras.
* **Interface Moderna:** Design limpo, responsivo e com temas claro e escuro.

---

##  Tutorial

Esta plataforma foi projetada para ser intuitiva. Siga os passos abaixo para realizar a sua primeira simulação.

### Passo 1: Configuração do Reator

A primeira coisa a fazer é escolher o tipo de reator que deseja simular.

1.  **Tipo de Reator:** No menu suspenso, selecione \`Batelada (Batch)\` ou \`CSTR (Quimiostato)\`.
    * **Batelada:** Um sistema fechado onde as células crescem até que um nutriente se esgote.
    * **CSTR:** Um sistema aberto com entrada e saída contínuas, que pode atingir um estado estacionário.
2.  **Parâmetros CSTR (Apenas se selecionado):** Se escolher CSTR, dois novos campos aparecerão:
    * \`S entrada (g·L⁻¹)\`: A concentração do substrato no fluxo de alimentação.
    * \`Taxa de diluição D (h⁻¹)\`: A taxa na qual o meio entra e sai do reator.

### Passo 2: Inserir as Condições e Parâmetros

Preencha os campos com os valores para a sua simulação. Pode usar ponto (\`.\`) ou vírgula (\`,\`) como separador decimal.

* **Condições Iniciais:**
    * \`X₀\`: Concentração inicial de biomassa.
    * \`S₀\`: Concentração inicial de substrato.
    * \`P₀\`: Concentração inicial de produto.
* **Parâmetros Cinéticos:**
    * \`μₘₐₓ\`: Taxa máxima de crescimento específico do microrganismo.
    * \`Ks\`: Constante de afinidade pelo substrato (sensibilidade).
    * \`Yx/s\`: Coeficiente de rendimento de biomassa em substrato.
    * \`mS\`: Coeficiente de manutenção celular.
    * \`kd\`: Taxa de morte celular.
    * \`α\` e \`β\`: Coeficientes de Luedeking-Piret para a formação de produto.

### Passo 3: Executar a Simulação

1.  **Defina o Tempo da Simulação:**
    * \`Tempo final (h)\`: Duração total da simulação.
    * \`Passo de tempo dt (h)\`: O intervalo de tempo para cada cálculo. Valores menores aumentam a precisão.
    * \`Método Numérico\`: Recomenda-se \`RK4 (preciso)\` para melhores resultados.
2.  **Clique em "Simular":** Um indicador de carregamento aparecerá enquanto o Python (via Pyodide) realiza os cálculos no seu navegador.

### Passo 4: Analisar os Resultados

Após a conclusão, os resultados são exibidos em três seções:

1.  **Gráfico de Simulação:**
    * Visualize as curvas de Biomassa (X), Substrato (S) e Produto (P).
    * Passe o rato sobre as linhas para ver os valores em pontos específicos.
    * Use o botão \`log₁₀\` para alternar a escala do eixo da Biomassa para logarítmica.
2.  **Indicadores e Resultados:**
    * Veja um resumo rápido com os principais resultados do processo.
3.  **Tabela de Dados:**
    * Explore os dados numéricos gerados em cada passo da simulação.

### Funcionalidades Adicionais

* **Calcular Estado Estacionário (apenas CSTR):** Antes de simular, pode clicar neste botão para calcular teoricamente as concentrações que o reator atingirá no equilíbrio.
* **Baixar CSV:** Clique neste botão para salvar todos os dados da tabela num ficheiro \`.csv\`.
* **Alternar Tema:** Use o ícone de lua/sol no canto superior direito para alternar entre os modos claro e escuro.

---

## 💻 Como Executar Localmente

Para executar este projeto no seu próprio computador:

1.  **Clone o repositório:**
    \`\`\`bash
    git clone https://github.com/ewdanzer/kinetics-calculator.git
    \`\`\`
2.  **Navegue para o diretório:**
    \`\`\`bash
    cd kinetics-calculator
    \`\`\`
3.  **Inicie um servidor web local:**
    Como os ficheiros são carregados via \`fetch\`, eles precisam de ser servidos por um servidor web. A maneira mais fácil é usar o módulo http do Python.
    \`\`\`bash
    python3 -m http.server
    \`\`\`
4.  **Abra no navegador:**
    Acesse \`http://localhost:8000\` no seu navegador.

---

Este projeto foi desenvolvido por **Emerson Willian Danzer**.

* **GitHub:** [@ewdanzer](https://github.com/ewdanzer)
* **LinkedIn:** [emerson-danzer](https://linkedin.com/in/emerson-danzer)

Conheça outros projetos em que estou envolvido:
* [iGEM SynFronteras](https://www.instagram.com/igem_synfronteras)
* [RSG-Brazil](https://www.instagram.com/rsg_brazil)
