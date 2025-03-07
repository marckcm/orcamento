from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('orcamentos.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/criar_orcamento', methods=['POST'])
def criar_orcamento():
    descricao = request.json['descricao']
    conn = get_db_connection()
    conn.execute('INSERT INTO orcamentos (descricao) VALUES (?)', (descricao,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/carregar_orcamentos', methods=['GET'])
def carregar_orcamentos():
    conn = get_db_connection()
    orcamentos = conn.execute('SELECT * FROM orcamentos').fetchall()
    conn.close()
    return jsonify([dict(orcamento) for orcamento in orcamentos])

@app.route('/carregar_orcamento/<int:id>', methods=['GET'])
def carregar_orcamento(id):
    conn = get_db_connection()
    orcamento = conn.execute('SELECT * FROM orcamentos WHERE id = ?', (id,)).fetchone()
    itens = conn.execute('SELECT * FROM itens WHERE orcamento_id = ?', (id,)).fetchall()
    conn.close()
    return jsonify({
        'orcamento': dict(orcamento),
        'itens': [dict(item) for item in itens],
        'pode_excluir': len(itens) == 0  # Indica se o orçamento pode ser excluído
    })

@app.route('/adicionar_item', methods=['POST'])
def adicionar_item():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO itens (descricao, valor, fornecedor, foto, orcamento_id) VALUES (?, ?, ?, ?, ?)',
                (data['descricao'], data['valor'], data['fornecedor'], data['foto'], data['orcamento_id']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/excluir_item/<int:id>', methods=['DELETE'])
def excluir_item(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM itens WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/excluir_orcamento/<int:id>', methods=['DELETE'])
def excluir_orcamento(id):
    conn = get_db_connection()
    itens = conn.execute('SELECT * FROM itens WHERE orcamento_id = ?', (id,)).fetchall()
    if len(itens) == 0:  # Verifica se o orçamento está vazio
        conn.execute('DELETE FROM orcamentos WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Orçamento excluído com sucesso!'})
    else:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Não é possível excluir um orçamento com itens.'}), 400

@app.route('/gerar_backup', methods=['GET'])
def gerar_backup():
    conn = get_db_connection()
    orcamentos = conn.execute('SELECT * FROM orcamentos').fetchall()
    backup = []
    for orcamento in orcamentos:
        itens = conn.execute('SELECT * FROM itens WHERE orcamento_id = ?', (orcamento['id'],)).fetchall()
        backup.append({
            'descricao': orcamento['descricao'],
            'itens': [dict(item) for item in itens]
        })
    conn.close()
    return jsonify(backup)

@app.route('/restaurar_backup', methods=['POST'])
def restaurar_backup():
    backup = request.json
    conn = get_db_connection()
    for orcamento in backup:
        conn.execute('INSERT INTO orcamentos (descricao) VALUES (?)', (orcamento['descricao'],))
        orcamento_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        for item in orcamento['itens']:
            conn.execute('INSERT INTO itens (descricao, valor, fornecedor, foto, orcamento_id) VALUES (?, ?, ?, ?, ?)',
                        (item['descricao'], item['valor'], item['fornecedor'], item['foto'], orcamento_id))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

if __name__ == "__main__":
    app.run(debug=True)