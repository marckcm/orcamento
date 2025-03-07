import sqlite3

def init_db():
    conn = sqlite3.connect('orcamentos.db')
    c = conn.cursor()
    
    # Tabela de orçamentos
    c.execute('''CREATE TABLE IF NOT EXISTS orcamentos
                (id INTEGER PRIMARY KEY AUTOINCREMENT,
                descricao TEXT NOT NULL)''')
    
    # Tabela de itens
    c.execute('''CREATE TABLE IF NOT EXISTS itens
                (id INTEGER PRIMARY KEY AUTOINCREMENT,
                descricao TEXT NOT NULL,
                valor REAL NOT NULL,
                fornecedor TEXT,
                foto TEXT,
                orcamento_id INTEGER,
                FOREIGN KEY(orcamento_id) REFERENCES orcamentos(id))''')
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()