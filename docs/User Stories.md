# User Stories — SkillEx

### US01 – Gestão de Usuários

Como usuário, quero criar e acessar minha conta para utilizar a plataforma.

**Descrição:**
Esta história irá desenvolver o sistema de autenticação da plataforma, incluindo cadastro, login e gerenciamento básico de usuários. Também será criada a interface de acesso, integração com o backend e armazenamento seguro das informações no banco de dados.

**Critérios de Aceitação:**

* Permitir cadastro de novos usuários.
* Permitir login utilizando e-mail e senha.
* Validar credenciais de acesso.
* Armazenar informações do usuário no banco de dados.
* Exibir mensagens de erro em caso de login inválido.
* Permitir logout do sistema.

---

### US02 – Gestão de Habilidades

Como usuário, quero cadastrar as habilidades que posso ensinar e as que desejo aprender, para que a plataforma encontre pessoas compatíveis.

**Descrição:**
Esta história irá desenvolver a funcionalidade de gerenciamento de habilidades, permitindo que usuários informem conhecimentos que desejam ensinar e aprender, possibilitando recomendações e conexões entre perfis compatíveis.

**Critérios de Aceitação:**

* Permitir cadastrar habilidades para ensinar.
* Permitir cadastrar habilidades para aprender.
* Salvar as habilidades no perfil do usuário.
* Permitir editar habilidades cadastradas.
* Permitir excluir habilidades cadastradas.
* Utilizar as habilidades para gerar recomendações de usuários.

---

### US03 – Match Inteligente

Como usuário, quero encontrar pessoas compatíveis para troca de conhecimentos.

**Descrição:**
Esta história irá desenvolver o sistema de compatibilidade entre usuários, identificando perfis com interesses e habilidades relacionadas, além de integrar backend e banco de dados para gerenciamento dos matches realizados.

**Critérios de Aceitação:**

* Identificar usuários compatíveis com base nas habilidades cadastradas.
* Exibir recomendações de perfis compatíveis.
* Permitir visualizar informações básicas dos usuários recomendados.
* Registrar os matches realizados no banco de dados.
* Atualizar recomendações conforme alterações no perfil.

---

### US04 – Comunicação

Como usuário, quero conversar com outros usuários em tempo real.

**Descrição:**
Esta história irá desenvolver o sistema de chat em tempo real, permitindo a troca de mensagens entre usuários dentro da plataforma, incluindo integração com backend e banco de dados para armazenamento das conversas.

**Critérios de Aceitação:**

* Permitir envio de mensagens em tempo real.
* Permitir recebimento de mensagens em tempo real.
* Armazenar histórico das conversas.
* Exibir lista de conversas do usuário.
* Permitir visualizar mensagens anteriores.

---

### US05 – Agendamento

Como usuário, quero marcar sessões de aprendizado com outros usuários.

**Descrição:**
Esta história irá desenvolver o sistema de agendamento de sessões, permitindo selecionar usuários, datas e horários para realização das trocas de conhecimento.

**Critérios de Aceitação:**

* Permitir selecionar usuário participante.
* Permitir definir data e horário da sessão.
* Registrar agendamentos no banco de dados.
* Exibir lista de sessões agendadas.
* Permitir cancelar ou editar agendamentos.

---

### US06 – Aulas Online

Como usuário, quero participar de videochamadas diretamente na plataforma.

**Descrição:**
Esta história irá desenvolver a funcionalidade de videochamadas integradas, permitindo que usuários participem de sessões online dentro da plataforma utilizando serviços de comunicação em tempo real.

**Critérios de Aceitação:**

* Permitir criação de salas virtuais.
* Permitir entrada dos participantes na chamada.
* Integrar sistema de videochamadas ao backend.
* Garantir funcionamento básico de áudio e vídeo.
* Relacionar chamadas aos agendamentos realizados.

---

### US07 – Avaliações

Como usuário, quero avaliar outros usuários após as sessões realizadas.

**Descrição:**
Esta história irá desenvolver o sistema de avaliações e feedbacks, permitindo que usuários atribuam notas e comentários após as trocas de conhecimento.

**Critérios de Aceitação:**

* Permitir envio de avaliações após sessões concluídas.
* Permitir atribuição de notas.
* Permitir envio de comentários.
* Armazenar avaliações no banco de dados.
* Exibir avaliações no perfil do usuário.

---

### US08 – Histórico

Como usuário, quero visualizar meu histórico de interações para acompanhar minhas atividades dentro da plataforma.

**Descrição:**
Esta história irá desenvolver a funcionalidade de histórico de atividades, permitindo visualizar sessões realizadas, interações, solicitações e atividades recentes da plataforma.

**Critérios de Aceitação:**

* Exibir histórico de trocas realizadas.
* Exibir sessões agendadas e concluídas.
* Exibir atividades recentes do usuário.
* Permitir consulta de informações anteriores.
* Integrar dados ao backend e banco de dados.
