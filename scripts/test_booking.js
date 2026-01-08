import fetch from 'node-fetch';

async function testBooking() {
    const payload = {
        name: "Test User",
        email: "test@example.com",
        phone: "11999999999",
        date: "2025-12-25",
        time: "10:00",
        // Mocking the large anamnesis data
        queixaPrincipal: "Teste de carga com payload grande.",
        motivoDivorcio: "N/A",
        numeroFilhos: "2",
        relacaoFilhos: "Boa",
        relacaoParceiro: "Estável",
        sentimentoCasa: "Paz",
        sentimentoTrabalho: "Estressante",
        pertenceFamilia: "Sim",
        pertenceSocial: "Sim",
        frustracoes: "Nenhuma",
        sexualidade: "Normal",
        traumas: "Nenhum",
        fobias: "Altura",
        drogas: "Não",
        alcool: "Socialmente",
        insonia: "Não",
        doresCabeca: "Raramente",
        ideiasSuicidas: "nao",
        medicacao: "Nenhuma",
        nivelStress: "medio",
        pensamentosSi: "Positivos",
        pensamentosCorpo: "Aceitável",
        pensamentosCompetencia: "Alta",
        visaoFuturo: "Otimista",
        felicidade: "Sim",
        mudanca: "Nada",
        criadoPais: "sim",
        relacaoPai: "Boa",
        relacaoMae: "Boa",
        paisAgressivos: "nao",
        paisAlcool: "nao",
        relacaoEntrePais: "Boa",
        crencaRelacionamento: "Positiva",
        magoaInfancia: "Nenhuma",
        medoInfancia: "Escuro",
        maioresMedosHoje: "Fracasso",
        papelVida: "responsavel",
        dominanteSubmisso: "dominante",
        raivaRancor: "Não",
        sentimentoCulpa: "Não",
        int_raiva: "Nenhuma",
        int_medo: "Pouca",
        int_culpa: "Nenhuma",
        int_tristeza: "Nenhuma",
        int_ansiedade: "Média",
        int_solidão: "Nenhuma",
        int_desanimo: "Nenhuma",
        int_angustia: "Nenhuma"
    };

    try {
        console.log("Sending request to https://traeegnimsqa.vercel.app/api/booking...");
        const response = await fetch('https://traeegnimsqa.vercel.app/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log("Response Body:", text);

        try {
            const json = JSON.parse(text);
            console.log("Parsed JSON:", json);
        } catch (e) {
            console.log("Response is NOT valid JSON.");
        }

    } catch (error) {
        console.error("Request failed:", error);
    }
}

testBooking();
