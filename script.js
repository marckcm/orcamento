document.addEventListener('DOMContentLoaded', () => {
    const descricaoOrcamentoInput = document.getElementById('descricao-orcamento');
    const criarOrcamentoBtn = document.getElementById('criar-orcamento');
    const descricaoItemInput = document.getElementById('descricao-item');
    const valorItemInput = document.getElementById('valor-item');
    const fornecedorItemInput = document.getElementById('fornecedor-item');
    const fotoItemInput = document.getElementById('foto-item');
    const adicionarItemBtn = document.getElementById('adicionar-item');
    const listaOrcamentos = document.getElementById('lista-orcamentos');
    const listaItens = document.getElementById('lista-itens');
    const totalItensSpan = document.getElementById('total-itens');
    const nomeOrcamentoSpan = document.getElementById('nome-orcamento');
    const excluirOrcamentoBtn = document.getElementById('excluir-orcamento');
    const gerarBackupBtn = document.getElementById('gerar-backup');
    const restaurarBackupInput = document.getElementById('restaurar-backup');
    const restaurarBackupBtn = document.getElementById('restaurar-backup-btn');
    let orcamentoAtual = null;

    // Função para converter imagem para Base64
    function imageToBase64(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    // Função para criar um novo orçamento
    criarOrcamentoBtn.addEventListener('click', () => {
        const descricaoOrcamento = descricaoOrcamentoInput.value.trim();
        if (descricaoOrcamento) {
            fetch('/criar_orcamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ descricao: descricaoOrcamento }),
            })
            .then(response => response.json())
            .then(data => {
                descricaoOrcamentoInput.value = ''; // Limpar campo após criar
                carregarOrcamentos(); // Atualizar lista de orçamentos
            });
        } else {
            alert('Por favor, insira a descrição do orçamento.');
        }
    });

    // Função para carregar os orçamentos armazenados
    function carregarOrcamentos() {
        fetch('/carregar_orcamentos')
            .then(response => response.json())
            .then(data => {
                listaOrcamentos.innerHTML = '';
                data.forEach(orcamento => {
                    const li = document.createElement('li');
                    li.textContent = orcamento.descricao;
                    const btnCarregar = document.createElement('button');
                    btnCarregar.textContent = 'Carregar';
                    btnCarregar.addEventListener('click', () => carregarOrcamento(orcamento.id));
                    li.appendChild(btnCarregar);
                    listaOrcamentos.appendChild(li);
                });
            });
    }

    // Função para carregar um orçamento específico
    function carregarOrcamento(id) {
        fetch(`/carregar_orcamento/${id}`)
            .then(response => response.json())
            .then(data => {
                orcamentoAtual = data.orcamento;
                nomeOrcamentoSpan.textContent = orcamentoAtual.descricao;
                nomeOrcamentoSpan.style.color = '#007bff'; // Destaque para o orçamento carregado
                atualizarListaItens(data.itens);

                // Verifica se o orçamento pode ser excluído
                if (data.pode_excluir) {
                    excluirOrcamentoBtn.style.display = 'block';  // Exibe o botão de exclusão
                    excluirOrcamentoBtn.onclick = () => excluirOrcamento(orcamentoAtual.id);
                } else {
                    excluirOrcamentoBtn.style.display = 'none';  // Oculta o botão de exclusão
                }
            });
    }

    // Função para adicionar um item ao orçamento
    adicionarItemBtn.addEventListener('click', () => {
        if (!orcamentoAtual) {
            alert('Por favor, carregue um orçamento primeiro.');
            return;
        }

        const descricaoItem = descricaoItemInput.value.trim();
        const valorItem = parseFloat(valorItemInput.value);
        const fornecedorItem = fornecedorItemInput.value.trim();
        const fotoItem = fotoItemInput.files[0];

        if (descricaoItem && !isNaN(valorItem) && valorItem > 0) {
            const item = {
                descricao: descricaoItem,
                valor: valorItem.toFixed(2),
                fornecedor: fornecedorItem,
                foto: null,
                orcamento_id: orcamentoAtual.id
            };

            if (fotoItem) {
                imageToBase64(fotoItem, (base64Foto) => {
                    item.foto = base64Foto;
                    fetch('/adicionar_item', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(item),
                    })
                    .then(response => response.json())
                    .then(data => {
                        carregarOrcamento(orcamentoAtual.id); // Recarrega os itens do orçamento
                    });
                });
            } else {
                fetch('/adicionar_item', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(item),
                })
                .then(response => response.json())
                .then(data => {
                    carregarOrcamento(orcamentoAtual.id); // Recarrega os itens do orçamento
                });
            }

            descricaoItemInput.value = '';
            valorItemInput.value = '';
            fornecedorItemInput.value = '';
            fotoItemInput.value = '';
        } else {
            alert('Por favor, preencha todos os campos corretamente.');
        }
    });

    // Função para atualizar a lista de itens do orçamento
    function atualizarListaItens(itens) {
        listaItens.innerHTML = '';
        let total = 0;
        itens.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${item.descricao} - R$ ${item.valor} (Fornecedor: ${item.fornecedor})`;
            if (item.foto) {
                const img = document.createElement('img');
                img.src = item.foto;
                li.appendChild(img);
            }
            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.addEventListener('click', () => excluirItem(item.id));
            li.appendChild(btnExcluir);
            listaItens.appendChild(li);
            total += parseFloat(item.valor);
        });
        totalItensSpan.textContent = total.toFixed(2);
    }

    // Função para excluir um item do orçamento
    function excluirItem(id) {
        fetch(`/excluir_item/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            carregarOrcamento(orcamentoAtual.id); // Recarrega os itens do orçamento
        });
    }

    // Função para excluir o orçamento
    function excluirOrcamento(id) {
        fetch(`/excluir_orcamento/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                carregarOrcamentos();  // Atualiza a lista de orçamentos
                nomeOrcamentoSpan.textContent = 'Nenhum';  // Reseta o nome do orçamento
                listaItens.innerHTML = '';  // Limpa a lista de itens
                totalItensSpan.textContent = '0.00';  // Reseta o total
                alert(data.message);  // Exibe mensagem de sucesso
            } else {
                alert(data.message);  // Exibe mensagem de erro
            }
        });
    }

    // Função para gerar o backup em arquivo JSON com imagens
    gerarBackupBtn.addEventListener('click', () => {
        fetch('/gerar_backup')
            .then(response => response.json())
            .then(data => {
                const jsonBackup = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonBackup], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'backup_orcamentos.json';
                a.click();
                URL.revokeObjectURL(url);
            });
    });

    // Função para restaurar o backup de arquivo JSON com imagens
    restaurarBackupBtn.addEventListener('click', () => {
        const file = restaurarBackupInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const dados = JSON.parse(e.target.result);
                fetch('/restaurar_backup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dados),
                })
                .then(response => response.json())
                .then(data => {
                    carregarOrcamentos();
                    alert('Backup restaurado com sucesso!');
                });
            };
            reader.readAsText(file);
        }
    });

    // Carregar orçamentos ao iniciar a página
    carregarOrcamentos();
});